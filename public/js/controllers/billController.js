/**
 * Created by ou on 2018/2/22.
 */
define('billController', ['tripOrderService', 'handlebars', 'livequery', 'jsbridge', 'util', 'iscroll', 'dialog', 'unveil'],
  function (tripOrderService, Handlebars, livequery, jsbridge, util, IScroll) {
    var jb = new jsbridge();
    var isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    var ts = new tripOrderService();
    var billController = function () {
    };

    /**
     * if语句扩展，支持数组输入
     */
    Handlebars.registerHelper("if2", function (value, test, options) {

      var flag = false;

      if (value && /,/gi.test(test)) {
        test = test.split(/,/);
        for (var i = 0; i < test.length; i++) {
          if (value == test[i]) {
            flag = true;
            break;
          }
        }

      } else {
        if (value && value == test) {
          flag = true;
        }
      }

      // console.log('if2:', flag, value, test);

      if (flag) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }

    });

    function handlebarfn(tmplid, cntid, result, appendtype) {
      var tmplHtml = $(tmplid).html();
      var tmplCompier = Handlebars.compile(tmplHtml);
      var $appendContent = $(cntid);
      if (appendtype) {
        $appendContent.html(tmplCompier(result));
        return
      }
      $appendContent.append(tmplCompier(result));
    }

    billController.prototype = {
      init: function () {
        var _this = this;
        // 返回
        $('.go-back').click(function () {
          location.href = location.origin + '/life/assets/pages/trip/order.html';
        });
        jb.topbarHandler('left', '', '', 'toOrder');
        window.WebViewJavascriptBridge.registerHandler('toOrder', function (data) {
          _this.wapRoute('order');
        });

        var $cell = $('.cell');
        $cell.click(function () {
          var index = $cell.index($(this));
          var url = ['selectOrder', 'history', 'explain'][index];

            _this.wapRoute(url)
          // jb.historygoHandler('native');
        });
      },

      orderInit: function () {
        Handlebars.registerPartial('flight', $('#tmpl_flight').html());
        Handlebars.registerPartial('hotel', $('#tmpl_hotel').html());
        var appendTemplate = Handlebars.compile($('#tmpl_append_orders').html());

        var _this = this;
        var $next = $('.ft-btn');
        this.goback();
        // 清除发票信息
        sessionStorage.removeItem('header');
        sessionStorage.removeItem('headerNo');

        // 上方偏移调整
        var $tips = $('.trip-tips');
        $('.wrapper').css({top: $tips.offset().top + $tips.height() + 'px'});

        // 加载并格式化数据
        function loadData(type) {
          _this.fillListData(type, function (pageNum, pageSize) {
            var params = {pageindex: pageNum, pagesize: pageSize};
            var lastBatchNo = $('.settle-box:last').data('no');
            if (lastBatchNo && pageNum != 1) params.batchno = lastBatchNo;
            return ts.getBatchList(params)
              .then(function (data) {
                console.log(data)

                if (data.state == 0) {
                  $.map(data.data.settlementList, function (settlement) {
                    $.map(settlement.orderList, function (order) {
                      console.log(type)
                      var cp = window.ListPages[type];
                      // 是否有订单选中
                      if ($('.regular-checkbox:checked').length > 0 && cp.refreshStatus != 0) {
                        settlement.disabled = order.disabled = 'disabled';
                      } else {
                        settlement.disabled = order.disabled = '';
                        $('#total').text(0);
                        $('#num').text(0);
                        $next.addClass('disabled');
                      }
                      // 机票订单
                      if (order.orderType == 1) {
                        $.map(order.order.flights, function (flight) {
                          var dDate = new Date(flight.takeOffTime);
                          var aDate = new Date(flight.arrivalTime);
                          flight.dDate = Util.formatDate2(dDate, 'yyyy-MM-dd');
                          flight.aDate = Util.formatDate2(aDate, 'yyyy-MM-dd');
                          flight.dTime = Util.formatDate2(dDate, 'hh:mm');
                          flight.aTime = Util.formatDate2(aDate, 'hh:mm');
                          flight.nights = parseInt(flight.nights);
                          flight.ico = order.order.flightWay == '2' ? (flight.flightType == 2 ? 'ico-back' : 'ico-go') : '';
                        })
                      } else {
                        //酒店订单
                        var startDate = new Date(order.order.startTime);
                        var endDate = new Date(order.order.endTime);
                        order.order.startDate = Util.formatDate2(startDate, 'yyyy-MM-dd');
                        order.order.endDate = Util.formatDate2(endDate, 'yyyy-MM-dd');
                      }
                    })
                  });

                  // 如果没有批次号，必须拼接到上一个批次的订单中
                  // 如果有批次号，新建一个批次
                  var nextSettlements = [];
                  var preSettlements = [];
                  data.data.settlementList.forEach(function (item) {
                    if (item.batchNo) nextSettlements.push(item);
                    else preSettlements.push(item);
                  });
                  data.data.settlementList = nextSettlements;
                  $('.trip-order:last').append(appendTemplate({settlementList: preSettlements}));
                }
                return data;
              })
          }, '啊哦~你还没有可开票的订单')
        }

        this.listScroll(loadData);
        //获取第一页
        loadData('orders');

        // 下一步
        $next.click(function () {
          if ($(this).hasClass('disabled')) return;
          var orderInfo = [];
          var batchNo;
          var total = $('#total').text();
          $('.trip-box .regular-checkbox:checked').each(function () {
            var $this = $(this);
            batchNo = $this.parents('.cell').parents('.panel').find('.settle-box').data('no');
            orderInfo.push({orderId: $this.val(), orderType: $this.data('ordertype')})
          });
          sessionStorage.setItem('total', encodeURIComponent(total));
          sessionStorage.setItem('batchNo', encodeURIComponent(batchNo))
          sessionStorage.setItem('orderList', encodeURIComponent(JSON.stringify(orderInfo)));
          _this.wapRoute('fillBill', {orderList: JSON.stringify(orderInfo), total: total, batchNo: batchNo});
        });

        this.boxCheck();
      },
      // checkbox选择
      boxCheck: function () {
        // 批次点击
        var _this = this;
        $('.settle-box').livequery(function () {
          var $this = $(this);
          $this.on('click', function () {
            var $box = $this.find('.regular-checkbox');
            var $settle = $(this).parents('.trip-order');
            var isChecked = !$box.prop('checked');
            if ($settle.hasClass('disabled')) return;
            // 选中或者不选中所有批次
            $box.prop('checked', isChecked);
            $settle.find('.regular-checkbox').prop('checked', isChecked);
            if (isChecked) {
              $('.trip-order').addClass('disabled').find('.cell').addClass('disabled');
              $settle.removeClass('disabled').find('.cell').removeClass('disabled');
            } else {
              $('.trip-order').removeClass('disabled').find('.cell').removeClass('disabled');
            }
            _this.calOrder();
          })
        });
        // 订单点击
        $('.cell').livequery(function () {
          var $this = $(this);
          $this.on('click', function () {
            var $settle = $this.parents('.trip-order');
            var $selectBox = $settle.find('.trip-box .regular-checkbox');
            var settleBox = $settle.find('.settle-box').find('.regular-checkbox');
            var $box = $(this).find('.regular-checkbox');
            var isChecked = !$box.prop('checked');
            if ($this.hasClass('disabled')) return;
            $box.prop('checked', isChecked);
            var $selectChecked = $settle.find('.trip-box .regular-checkbox:checked');
            if (isChecked) {
              // 选中一个订单，选中这个批次，其他批次全部disabled
              $('.trip-order').addClass('disabled').find('.cell').addClass('disabled');
              // $settle.find('.regular-checkbox').prop('checked', isChecked);
              $settle.removeClass('disabled').find('.cell').removeClass('disabled');
            } else if ($selectChecked.length == 0) {
              $('.trip-order').removeClass('disabled').find('.cell').removeClass('disabled');
            }
            if (!settleBox.prop('checked')) {
              if ($selectBox.length == $selectChecked.length) {
                settleBox.prop('checked', true);
              }
            } else {
              if ($selectBox.length == $selectChecked.length) {
                settleBox.prop('checked', true);
              } else {
                settleBox.prop('checked', false);
              }
            }
            _this.calOrder();
          })
        })
      },
      // 统计订单信息
      calOrder: function () {
        var total = 0;
        var $selectOrders = $('.trip-box .regular-checkbox:checked');
        var count = $selectOrders.length;
        $selectOrders.each(function () {
          total += parseFloat($(this).parents('.cell').data('price'));
        });
        $('#num').text(count);
        $('#total').text(total);
        if (total > 0 && count > 0) {
          $('.trip-footer .ft-btn').removeClass('disabled');
        } else {
          $('.trip-footer .ft-btn').addClass('disabled');
        }
      },

      fillInit: function () {
        var _this = this;
        var total = decodeURIComponent(Util.getQuery('total') || sessionStorage.getItem('total') || 0);
        var batchNo = decodeURIComponent(Util.getQuery('batchNo') || sessionStorage.getItem('batchNo') || 0);
        var orders = decodeURIComponent(Util.getQuery('orderList') || sessionStorage.getItem('orderList') || '[]');
        var headerType = '企业抬头';
        var header = decodeURIComponent(sessionStorage.getItem('header') || '');
        var headerNo = decodeURIComponent(sessionStorage.getItem('headerNo') || '');
        var email = decodeURIComponent(sessionStorage.getItem('email') || '');
        var content = '旅游服务-机票住宿费';
        var $email = $('#email');
        var $btn = $('.comm-btn');
        var $headNo = $('#header-no');
        var $company = $('#company').find('.cell-bd');
        // 数据初始化
        orders = JSON.parse(orders);
        console.log(orders)
        sessionStorage.setItem('email', '');
        $email.val(email);
        $('#total').text(total);

        if (header && $email.val()) {
          $btn.removeClass('set-gray').addClass('curr-btn');
        }
        $email.on('input', function () {
          if (header && $email.val()) {
            $btn.removeClass('set-gray').addClass('curr-btn');
          } else {
            $btn.addClass('set-gray').removeClass('curr-btn');
          }
        });

        fillHeader(header, headerNo);

        // 选择发票抬头回调
        jb.addObserver('selectHeader', 'selectHeader');
        // 填充发票抬头
        window.WebViewJavascriptBridge.registerHandler('selectHeader', function (data, responseCallback) {
          if (typeof data === 'string') data = JSON.parse(data);
          header = (data.params && data.params.header) || data.header;
          headerNo = (data.params && data.params.headerNo) || data.headerNo;
          fillHeader(header, headerNo);
          if (header && $email.val()) {
            $btn.removeClass('set-gray').addClass('curr-btn');
          }
        });

        function fillHeader(header, headerNo) {
          if (header) {
            $company.html('<div class="text-ellipsis">' + header + '</div>')
          }
          $headNo.val(headerNo);
        }

        $('.go-back').click(function () {
          // _this.wapRoute('selectOrder');
          jb.historygoHandler('native');
        });
        $('#company').click(function () {
          sessionStorage.setItem('email', $email.val());
          _this.wapRoute('company', {headerno: headerNo});
        });

        $btn.click(function () {
          if ($btn.hasClass('set-gray')) return;
          if ($btn.hasClass('clicked')) return;
          var email = $email.val();
          if (!/^.+@.+\.com$/.test(email)) {
            jb.toastHandler('邮箱格式错误');
            return;
          }
          var param = {
            batchNo: batchNo,
            headType: '企业抬头',
            invoiceHead: header,
            taxID: headerNo,
            invoiceContent: content,
            invoiceMoney: total,
            recipient: email,
            orderList: JSON.stringify(orders)
          }
          $btn.addClass('clicked');
          ts.submitInvoiceApply({invoiceInfo: JSON.stringify(param)}).then(function (data) {
            console.log(data)
            if (data.state != 0) {
              return jb.toastHandler(data.msg);
            }
            _this.wapRoute('success');
          }).always(function () {
            $btn.removeClass('clicked');
          })

        });
      },

      companyInit: function () {
        var _this = this;
        var $searchLabel = $('.search-label');
        var $searchForm = $('#search-form');
        var $searchResult = $('#search-result');
        var $companyList = $('#company-list');
        var $searchInput = $searchForm.find('input');

        _this.renderCompany($('#company-container')).then(function () {
          _this.compaynNavFixed();
        });

        $searchInput.on('input', function () {
          _this.renderCompany($searchResult, $(this).val());
        });

        // 点击搜索
        $searchLabel.click(function () {
          $searchLabel.hide();
          $searchForm.show();
          $searchResult.show();
          $companyList.hide();
          $searchInput.val('').focus();
          _this.renderCompany($searchResult, '');
        });
        // 搜索框定位
        $('.trip-search').css('top', $('.header-wrap').height());

        this.goback();
        // 选中抬头
        $('.trip-company .cell').livequery(function () {
          $(this).on('click', function () {
            $('.trip-company .cell').removeClass('active');
            $(this).addClass('active');
            if (Util.isApp()) {
              jb.postNotification('selectHeader', JSON.stringify({
                header: $(this).text(),
                headerNo: $(this).data('no')
              }));
              jb.historygoHandler('native');
            } else {
              sessionStorage.setItem('header', $(this).text());
              sessionStorage.setItem('headerNo', $(this).data('no'));
              _this.wapRoute('fillBill');
            }
          });
        });

        $('#cancel-search').click(function () {
          $searchLabel.show();
          $searchForm.hide();
          $searchResult.hide();
          $companyList.show();
        });


      },
      getCompanyList: function (keyword) {
        return ts.getInvoiceHeadList({keyword: keyword}).then(function (data) {

          if (data.state != 0) {
            return jb.toastHandler(data.msg);
          }
          return data.data.list;
        })

      },
      renderCompany: function ($e, keyword) {
        var _this = this;
        var def = null;
        if (!this._company_templ_) {
          this._result_templ_ = Handlebars.compile($('#tmpl_company').html());
          this._company_templ_ = Handlebars.compile($('#tmpl_all_company').html());
          this._letter_templ_ = Handlebars.compile($('#tmpl_letter').html());
        }
        if (keyword || keyword === '') {
          def = _this.getCompanyList(keyword).then(function (companyList) {
            var filterList = [];
            companyList.forEach(function (list) {
              filterList = filterList.concat(list.invoiceHeadList)
            });
            $e.html(_this._result_templ_({companyList: filterList}));
          })
        } else {
          def = _this.getCompanyList().then(function (companyList) {
            $e.html(_this._company_templ_({companyList: companyList}));
            $('.letter-nav').html(_this._letter_templ_({companyList: companyList}))
          })
        }
        def.then(function () {
          var headerNo = Util.getQuery('headerno');
          if (headerNo) {
            $('[data-no="' + headerNo + '"]').addClass('active');
          }
        });
        return def;
      },
      // 跟随滚动
      compaynNavFixed: function () {
        var list = [];
        var $navLi = $('.letter-nav li');
        $(window).scrollTop(1);
        $('.letter-title').each(function (i, l) {
          var $letter = $(this);
          var item = {};
          item.key = $letter.text();
          item.offset = $letter.offset().top;
          item.index = i;
          list.push(item);
        });

        if (list.length === 0) return;
        // 滑动变颜色
        $(window).on('scroll', function () {
          var top = $(this).scrollTop();
          var item = findItem(top + list[0]['offset'], 'offset');
          $navLi.removeClass('active').eq(item.index).addClass('active');
        });
        // 查找对应的item，v:查找的值， type: 查找的类型，offset为根据距离，letter为根据字母
        function findItem(v, type) {
          for (var i = 0; i < list.length - 1; i++) {
            if (type === 'offset' && list[i]['offset'] <= v && list[i + 1]['offset'] > v) return list[i];
            if (type === 'letter' && list[i]['key'] === v) return list[i];
          }
          return list[list.length - 1];
        }

        $('.letter-nav li').livequery(function () {
          $(this).click(function () {
            var $this = $(this);
            var index = $navLi.removeClass('active').index($this);
            setTimeout(function () {
              $this.addClass('active');
            }, 30);
            if (list[index]) $(window).scrollTop(list[index]['offset'] - list[0]['offset'] + 1)
          });
        })
      },
      successInit: function () {
        var _this = this;
        $('.go-back').click(function () {
          location.href = location.origin + '/life/assets/pages/trip/index.html';
        });

        jb.topbarHandler('left', '', '', 'toIndex');
        window.WebViewJavascriptBridge.registerHandler('toIndex', function (data) {
          _this.wapRoute('index');
        })
      },

      historyInit: function () {
        var _this = this;
        // 加载并格式化数据
        function loadData(type) {
          _this.fillListData(type, function (pageNum, pageSize) {
            return ts.getHistoryInvoiceList({pageindex: pageNum, pagesize: pageSize})
              .then(function (data) {
                if (data.state == 0) {
                  $.each(data.data.invoiceList, function (i, item) {
                    item.applyDate = Util.formatDate2(new Date(item.invoiceTime), 'yyyy-MM-dd hh:ss');
                    item.invoice_type_str = ['', '酒店', '机票', '酒店+机票'][item.invoiceType];
                  });
                  // 第一页且数据长度为0，判断为没有数据
                  if (pageNum == 1 && data.data.invoiceList.length === 0) data.data.total = 0;
                }
                return data;
              })
          }, '啊哦~您还没有开票的历史')
        }

        $('.wrapper').css({top: $('.header-wrap').height() + 'px'});
        this.listScroll(loadData);
        //获取第一页
        loadData('history');
        this.goback();
        $('.trip-history').livequery(function () {
          $(this).click(function () {
            _this.wapRoute('detail', {id: $(this).data('no'), invoiceSn: $(this).data('sn')});
          });
        });
      },

      detailInit: function () {
        var _this = this;

        jb.loadingHandler('show');
        var _param = {
          id: Util.getQuery('id'),
          invoiceSn: Util.getQuery('invoiceSn')
        }
        ts.getInvoiceDetail(_param).then(function (data) {
          console.log(data)
          jb.loadingHandler('hide');
          if (data.state != 0) {
            return jb.toastHandler(data.msg);
          }
          sessionStorage.setItem('ordersn', data.data.orderSn);
          data.data.printDate = Util.formatDate2(new Date(data.data.invoiceTime), 'yyyy-MM-dd hh:ss');
          ['statusDesc', 'printDate', 'invoiceMoney', 'invoiceContent', 'taxID', 'invoiceHead', 'invoiceCount', 'orderCount', 'recipient'].forEach(function (selector) {
            $('#' + selector).text(data.data[selector]);
          });
          if (data.data.status == 3) {
            $('#op-btn').show();
          } else {
            $('#op-btn').hide();
          }
          $('.curr-btn').livequery(function () {
            $(this).click(function () {
              $.dialog({
                type: 'confirm',
                subtitle: '接收邮箱',
                contentHtml: '<input type="text" value="' + data.data.recipient + '" id="email"/>',
                onClickOk: function () {
                  ts.sendInvoiceMail({
                    invoiceurl: data.data.pdfUrl,
                    recipient: $('#email').val()
                  }).then(function (data) {
                    if (data.state != 0) {
                      return jb.toastHandler(data.msg);
                    }
                    jb.toastHandler('电子发票重发成功');
                  })
                }
              })
              $('#email').focus();
            })
          })

          $('.gray-line').livequery(function () {
            $(this).click(function () {
              $.dialog({
                type: 'confirm',
                subtitle: '申请退票后，当前发票将作废，可于开具发票页对退票订单重新申请开票。',
                onClickOk: function () {
                  ts.applyEInvoiceRed({
                    invoiceid: data.data.invoiceId,
                    invoicesn: Util.getQuery('invoiceSn')
                  }).then(function (data) {
                    console.log(data)
                    if (data.state != 0) {
                      return jb.toastHandler(data.msg);
                    }
                    _this.detailInit();
                  })
                }
              })
            })
          })
        });

        this.goback();
        $('#orders').click(function () {
          _this.wapRoute('billTrips', {ordersn: sessionStorage.getItem('ordersn')});
        });
      },

      billTripsInit: function () {
        Handlebars.registerPartial('flight', $('#tmpl_flight').html());
        Handlebars.registerPartial('hotel', $('#tmpl_hotel').html());
        var _this = this;
        var template = Handlebars.compile($('#tmpl_order').html());

        ts.getInvoiceOrders({
          ordersn: decodeURIComponent(Util.getQuery('ordersn')),
          pageindex: 1,
          pagesize: 20
        }).then(function (data) {
          if (data.state != 0) {
            return jb.toastHandler(data.msg);
          }
          // 格式化数据
          $.map(data.data.orderList, function (order) {
            // 机票订单
            console.log(order)
            if (order.orderType == 1) {
              $.map(order.order.flights, function (flight) {
                var dDate = new Date(flight.takeOffTime);
                var aDate = new Date(flight.arrivalTime);
                flight.dDate = Util.formatDate2(dDate, 'yyyy-MM-dd');
                flight.aDate = Util.formatDate2(aDate, 'yyyy-MM-dd');
                flight.dTime = Util.formatDate2(dDate, 'hh:mm');
                flight.aTime = Util.formatDate2(aDate, 'hh:mm');
                flight.nights = parseInt(flight.nights);
                flight.ico = order.order.flightWay == '2' ? (flight.flightType == 2 ? 'ico-back' : 'ico-go') : '';
              })
            } else {
              //酒店订单
              var startDate = new Date(order.order.startTime);
              var endDate = new Date(order.order.endTime);
              order.order.startDate = Util.formatDate2(startDate, 'yyyy-MM-dd');
              order.order.endDate = Util.formatDate2(endDate, 'yyyy-MM-dd');
            }
          })
          console.log(data);
          $('.container').html(template(data.data));
        });
        this.goback();
      },

      goback: function () {
        $('.go-back').click(function () {
          history.go(-1);
        })
      },

      wapRoute: function (page, query) {
        console.log(query);
        var querystr = [];
        if (query) {
          for (var key in query) {
            querystr.push(key + '=' + encodeURIComponent(query[key]));
          }
        }
        querystr = querystr.join('&');
        var url = location.origin + '/life/assets/pages/trip/' + page + '.html' + (querystr ? ('?' + querystr) : '');
        var tmpparams = {
          url: url
        };
        jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);
      },

      /**
       * iscroll refresh
       */
      iscrollRefresh: function (type) {
        setTimeout(function () {
          window.ListPages[type].pullUpEl.hide();
          window.ListScrollers && window.ListScrollers[type].refresh();
        }, 500)
      },

      /**
       * 定义iscroll
       */
      listScroll: function (loadData) {

        window.ListScrollers = {};
        window.ListPages = {};
        var _this = this,
          $wrappers = $('.wrapper');

        var pulldownHtml = '<div class="pullDown"><span class="pullDownIcon"></span><span class="pullDownLabel"></span></div>';
        var pullupHtml = '<div class="pullUp"> <span class="pullUpIcon"></span> <span class="pullUpLabel"></span></div>';

        $wrappers.each(function () {
          var cid = $(this).attr('id'),
            type = $(this).data('tab'),
            temp = {},
            temp2 = {};

          var _thisScroll = new IScroll('#' + cid, {
            click: true,
            tap: false,
            mouseWheel: true,
            eventPassthrough: false,
            preventDefault: true,
            //snap: true,
            probeType: isIOS ? 3 : 2
          });

          var $thiswrapper = $(_thisScroll.wrapper);
          var wrapItemEl = $thiswrapper.find('.order-wrap');
          $(pulldownHtml).insertBefore(wrapItemEl);
          $(pullupHtml).insertAfter(wrapItemEl);

          temp2 = {
            pullDownEl: $thiswrapper.find('.pullDown'),
            pullDownL: $thiswrapper.find('.pullDownLabel'),
            pullUpEl: $thiswrapper.find('.pullUp'),
            pullUpL: $thiswrapper.find('.pullUpLabel'),
            loadingStep: 0, //加载状态0默认，1显示加载状态，2执行加载数据，只有当为0时才能再次加载，这是防止过快拉动刷新
            refreshStatus: 0,//0刷新，1加载更多
            islast: false,
            //scrollMaxY:0,
            pageNum: 1,
            pageSize: 10
          }

          _thisScroll.on('scroll', function () {

            if (window.ListPages && window.ListPages[type]) {
              temp2 = window.ListPages[type]
            }
            if (temp2.loadingStep == 0 && !temp2.pullDownEl.attr('class').match('flip|loading') && !temp2.pullUpEl.attr('class').match('flip|loading')) {

              if (this.y > 15) {

                //下拉刷新效果
                //this.minScrollY=5;
                temp2.refreshStatus = 0;
                temp2.pullDownEl.show();
                temp2.pullDownEl.addClass('flip');
                temp2.pullDownL.html('准备刷新...');
                temp2.loadingStep = 1;
              } else if (this.y < (this.maxScrollY - 5)) {
                //上拉加载效果
                if (type == 'orderrefresh' || type == 'reorderrefresh') {
                  return
                } else {
                  temp2.refreshStatus = 1;
                  temp2.pullUpEl.show();
                  temp2.pullUpEl.addClass('flip');
                  temp2.pullUpL.html('松开加载...');
                  if (temp2.islast) {
                    temp2.pullUpL.html('没有更多数据了。');
                  }
                  temp2.loadingStep = 1;

                }
              }
            }

            $(".lazyload-img").trigger("unveil");
          });
          //滚动完毕
          _thisScroll.on('scrollEnd', function () {

            if (temp2.loadingStep == 1) {

              if (temp2.pullUpEl.attr('class').match('flip|loading')) {

                temp2.pullUpEl.removeClass('flip').addClass('loading');
                temp2.pullUpL.html('Loading...');
                if (temp2.islast) {
                  temp2.pullUpL.html('没有更多数据了。');
                  // setTimeout(function () {
                  temp2.pullUpEl.hide();

                }
                temp2.loadingStep = 2;
                loadData(type);

              } else if (temp2.pullDownEl.attr('class').match('flip|loading')) {
                temp2.pullDownEl.removeClass('flip').addClass('loading');
                temp2.pullDownL.html('Loading...');

                temp2.loadingStep = 2;

                var cp = window.ListPages[type];
                cp.islast = false;
                cp.refreshStatus = 0;
                //cp.scrollMaxY = 0;
                cp.pageNum = 1;
                cp.pageSize = 10;
                cp.pullDownEl.removeClass('loading');
                cp.pullDownL.html('下拉显示更多...');
                cp.pullDownEl.hide();
                cp.pullUpEl.hide();
                loadData(type);
              }
            }

          });

          //全局scroller
          temp[type] = _thisScroll;
          $.extend(window.ListScrollers, temp);

          //分页信息,默认1开始
          var lsp = {}
          lsp[type] = temp2;
          $.extend(window.ListPages, lsp);
          //$.extend(window.ListPages, tmpEl);

        });

        document.addEventListener('touchmove', function (e) {
          e.preventDefault();
        }, false);

      },

      /**
       * 填充数据到list
       */
      fillListData: function (type, getData, noDataText) {

        // localStorage.removeItem('detailData');
        var cp = window.ListPages[type];
        var _this = this;
        if (cp.islast) {
          //设置状态
          cp.loadingStep = 0;
          //移除loading
          cp.pullUpEl.removeClass('loading');
        }

        return !cp.islast && getData(cp.pageNum, cp.pageSize).then(function (data) {
            console.log(data)
            if (data.state == 0) {

              //是否空数据 根据total判断 total=0 没数据
              if (data.data.total == 0) {
                console.log('no data')
                var tmpObj = {
                  noDataText: noDataText,
                  isNodata: true
                }
                cp.islast = true;
                $.extend(data.data, tmpObj);
                $('body').css('background', '#ffffff');
                handlebarfn('#tmpl_nodata', '#cnt_' + type, data.data, 'replace');
              }
              else {
                console.log(data.data)
                console.log(type)
                //刷新用html，加载用append
                if (cp.refreshStatus == 0) {
                  handlebarfn('#tmpl_' + type, '#wrapper_' + type, data.data, 'replace');
                } else {
                  handlebarfn('#tmpl_' + type, '#wrapper_' + type, data.data);
                }

                //更新ListPage
                if (data.data.isLast == 0) {
                  //不是最后一页
                  cp.pageNum++;
                } else {
                  //没有更多数据
                  cp.pullUpL.html('没有更多数据了');
                  cp.islast = true;
                }
                //移除loading
                cp.pullUpEl.removeClass('loading');
              }

            } else {
              console.log(data.msg);
              jb.toastHandler(data.msg);
            }
          })
            .then(function () {
              _this.iscrollRefresh(type);
            })
            .fail(function (data) {
              if (typeof data == "string") {
                data = JSON.parse(data);
              }
              //if(data.state=='6829201')
              //jb.toastHandler(data.msg);
              //jb.toastHandler('网络开小差，稍后再试');
            })
            .done(function () {
              cp.loadingStep = 0;
            });
      },
    };

    return billController;
  })
