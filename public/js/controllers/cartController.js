/*!*
 * 企业生活-购物车
 */
define('cartController', ['clifeService', 'handlebars', 'livequery', 'iscroll', 'jsbridge', 'cLifeFooter', 'dialog', 'unveil'],
function(clifeService, Handlebars, livequery, IScroll, jsbridge, CLifeFooter) {
  var clifeService = new clifeService();
  var jb = new jsbridge();
  Handlebars.registerHelper("if2", function(value, test, options) {

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

    if (flag) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }

  });

  var isedit = true; // true=右上角为"编辑  false=右上角为"完成"
  var globalParams;
  var selectedId = [];
  var cartController = function() {};
  var storageGoodsList = localStorage.getItem('goodslist')
  var delstorageGoodsList = localStorage.getItem('delgoodslist')
  cartController.prototype = {
      init: function() {
        jb.addObserver('gobackcart', 'gobackHandler') // 监听返回事件，刷新页面
        CLifeFooter.init($('#footer'));
        this.getCartList();
        this.setCheck();
        jb.topbarHandler('left', 'hidden', '', 'returnHomePage');
        jb.topbarHandler('right', '', '编辑', 'showMultDelete')
        jb.addObserver('qyDentityConfirm', 'onIdConfirmCallback') // 监听认证页面返回事件
        this.registerJsHandler();
        this.removeEditStatus();
        $('#goindex').on('click', function(e) {
          var params = {
            url: location.origin + '/life/assets/pages/clife/index.html'
          }
          jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params), params.url);
        })
      },
      /**
       * 获取购物车列表
       */
      getCartList: function() {
        var _this = this,
          tmplCart = $("#tmpl-cartList").html(),
          tmplCartCompier = Handlebars.compile(tmplCart),
          tmplCartList = $('#cartlist');
        var model = {
          data: {
            source: 4
          }
        }
        $.extend(model.data, _this.setDefaultParams());
        clifeService.getCartList(model)
          .then(function(result) {
            if (result.state == 0) {
              if (result.data.shippingTab) {
                $('#checkWrap').removeClass('none')
                var goodsList = result.data.shippingTab.storeList[0];
                var list = goodsList.supplierList
                // 是否显示原来价格
                list.forEach(function(item) {
                  item.goodsList.forEach(function(item) {
                    item.showPrice = false
                    if (item.storePrice < item.price) {
                      item.showPrice = true
                    }
                  })
                })
                tmplCartList.append(tmplCartCompier(goodsList));
                var $listBox = $('#cartlist li');
                var shelves = $('.shelves').closest('li')
                var soldout = $('.soldout').closest('li')
                shelves.addClass('no-sale')
                soldout.addClass('no-sale')
                for (var i = 0; i < $listBox.length; i++) {
                  if (!$listBox.eq(i).hasClass('no-sale')) {
                    $listBox.eq(i).addClass('cancheckbox')
                  }
                }
                // 判断是否有本地存储
                if (isedit && storageGoodsList) {
                  var oldgoodslist = JSON.parse(storageGoodsList);
                  _this.storageHandler(oldgoodslist)
                } else {
                  if (delstorageGoodsList) {
                    var oldgoodslist = JSON.parse(delstorageGoodsList);
                    _this.storageHandler(oldgoodslist)
                  }
                }
                _this.changeGoodsNum();
              } else {
                $('.blank-wrap').removeClass('none')
              }

            } else {
              jb.toastHandler(result.msg);
            }
            return result.data
          }).then(function(data) {
            _this.lazyLoad();
          })
      },
      /**
       * 本地存储
       **/
      storageHandler: function(oldgoodslist) {
        var _this = this
        var $listBox = $('#cartlist li')
        var goodslist = $.map($listBox, function(item) {
          var goods = []
          goodsId = $(item).closest('li').data('goodsid')
          goods.push(goodsId)
          return goods
        });
        for (var i = 0; i < goodslist.length; i++) {
          var index = i;
          var goodsid = goodslist[i];
          oldgoodslist.forEach(function(item) {
            var storageGoodsId = item.goodsid
            if (goodsid == storageGoodsId) {
              if (isedit) {
                if($listBox.eq(index).hasClass('cancheckbox')){
                  $listBox.eq(index).addClass('select');
                  $listBox.eq(index).find('label').addClass('selected');
                }
              } else {
                $listBox.eq(index).addClass('select');
                $listBox.eq(index).find('label').addClass('selected');
              }
            }
          })
        }
        var $selectBox = $('.select')
        var $cancheckBox = $('.cancheckbox')
        if (isedit) {
          if ($selectBox.length > 0) {
            _this.totalCheck()
            $('#canCheck').addClass('canCheck')
            $('#canCheck em').text($selectBox.length)
            if ($cancheckBox.length == $selectBox.length) {
              $('#checkAllGoods label').addClass('selected')
            }
          }
        } else {
          if ($selectBox.length > 0) {
            $('#delBtn').addClass('canCheck')
            if ($listBox.length == $selectBox.length) {
              $('#checkAllGoods label').addClass('selected')
            }
          }
        }
    },
    /**
     * 选择商品结算
     */
    setCheck: function() {
      var _this = this,
        $cartList = $('#cartlist'),
        $checkAllBtn = $('.check-cont'),
        $checkBtn = $('.sw-r');

      $cartList.livequery(function() {
        // 跳转到详情页
        $(this).delegate('li .gotoDetail', 'click', function(e) {
          e.preventDefault();
          e.stopImmediatePropagation();
          var goodsid = $(this).parent().data('goodsid');
          var params = {
            goodsid: goodsid
          }
          jb.routerHandler(WEB_CONFIG.nativePage.clife.qyPlatformgoodsdetial.id, JSON.stringify(params), params.goodsid);
        });

        //单选
        $(this).delegate('li .check-label', 'click', function(e) {
          e.preventDefault();
          e.stopImmediatePropagation();

          var $input = $(this).next('input'),
            listcheck = $(this).parent().parent().hasClass('no-sale');
          // 如果是编辑状态，且listcheck存在
          if (isedit && listcheck) {
            return
          }
          // 如果当前按钮未被选中
          if (!$(this).hasClass('selected')) {
            $(this).addClass('selected');
            $(this).closest('li').addClass('select')
          } else {
            $(this).removeClass('selected');
            $(this).closest('li').removeClass('select')
          }
          var checkedLength = $cartList.find('li.select').length;
          singleBar(checkedLength, $checkBtn)
          // 存储选择的商品到本地
          var $checkboxies = $('.select');
          var goodslist = $.map($checkboxies, function(item) {
            var goods = {}
            goods.goodsid = $(item).data('goodsid')
            goods.specid = $(item).data('specid')
            return goods
          });
          if (isedit) {
            localStorage.setItem('goodslist', JSON.stringify(goodslist))
          } else {
            localStorage.setItem('delgoodslist', JSON.stringify(goodslist))
          }
        });
      });
      // 单选时,判断bar的状态
      function singleBar(checkedLength, $checkBtn) {
        var length = $cartList.find('li').length,
            canlength = $cartList.find('li.cancheckbox').length,
          $checkAllBtnLabel = $checkAllBtn.find('label'),
          checkNum = $('#canCheck em');
        if (checkedLength >= 1) {
          $checkBtn.addClass('canCheck')
          checkNum.text(checkedLength)
          if(isedit){
            if (checkedLength == canlength) {
              $checkAllBtnLabel.addClass('selected')
            } else {
              $checkAllBtnLabel.removeClass('selected')
            }
          } else {
            if (checkedLength == length) {
              $checkAllBtnLabel.addClass('selected')
            } else {
              $checkAllBtnLabel.removeClass('selected')
            }
          }
          
        } else {
          $checkAllBtnLabel.removeClass('selected')
          $checkBtn.removeClass('canCheck')
          checkNum.text(0)
        }
        _this.totalCheck()
      };
      //全选
      $checkAllBtn.on('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        var $listBox = $cartList.find('li'),
          $nosale = $('.no-sale'),
          $cancheckbox = $('.cancheckbox'),
          $labels = $cartList.find('check-label');
        if (!$(this).find('label').hasClass('selected')) {
          if (isedit) {
            $cancheckbox.addClass('select');
            $cancheckbox.find('label').addClass('selected');
            $(this).find('label').addClass('selected');
            if ($cancheckbox.length > 0) {
              $checkBtn.addClass('canCheck')
            }
          } else {
            $listBox.addClass('select');
            $listBox.find('label').addClass('selected');
            $(this).find('label').addClass('selected');
            $checkBtn.addClass('canCheck')
          }
          var $selectList = $cartList.find('li.select');
          $('#canCheck em').text($selectList.length)
        } else {
          $listBox.removeClass('select');
          $listBox.find('label').removeClass('selected');
          $(this).find('label').removeClass('selected');
          $checkBtn.removeClass('canCheck')
          $('#canCheck em').text(0)
        }
        _this.totalCheck()

        // 存储选择的商品到本地
        var $checkboxies = $('.select');
        var goodslist = $.map($checkboxies, function(item) {
          var goods = {}
          goods.goodsid = $(item).data('goodsid')
          goods.specid = $(item).data('specid')
          return goods
        });
        if (isedit) {
          localStorage.setItem('goodslist', JSON.stringify(goodslist))
        } else {
          localStorage.setItem('delgoodslist', JSON.stringify(goodslist))
        }
      });

      // 结算
      $('#canCheck').on('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        //获取选中的商品
        var $checkboxies = $('.select');
        var goodslist = $.map($checkboxies, function(item) {
          var goods = {}
          goods.goodsid = $(item).data('goodsid')
          goods.specid = $(item).data('specid')
          return goods
        });

        if (isedit) {
          localStorage.setItem('goodslist', JSON.stringify(goodslist))
        } else {
          localStorage.setItem('delgoodslist', JSON.stringify(goodslist))
        }

        var model = {
          data: {
            'goodslist': JSON.stringify(goodslist),
            'source': 4,
          }
        }
        $.extend(model.data, _this.setDefaultParams());
        clifeService.settle(model).then(function(result) {
          if (result.state == 0) {
            if (result.msg == "成功") {
              var goodsid = $(this).parent().data('goodsid');
              globalParams = {
                "goodslist": goodslist
              }
              jb.routerHandler(WEB_CONFIG.nativePage.clife.confirmOrder.id, JSON.stringify(globalParams), globalParams);
            } else {
              window.location.reload()
              jb.toastHandler(result.msg);
            }
          } else if (result.state == 3829010 || result.state == 3829011 || result.state == 3829012) { // 包含跨镜商品
            jb.toastHandler(result.msg);
            var params = {
              "error_code_key": result.state,
            }
            jb.routerHandler(WEB_CONFIG.nativePage.clife.confirmIdentity.id, JSON.stringify(params), params);
          } else {
            jb.toastHandler(result.msg);
          }
        })
      })
      //删除操作
      $('#delBtn').on('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!$(this).hasClass('canCheck')) {
          return
        }
        //获取选中的商品
        var $checkboxies = $cartList.find('li').filter('.select');
        var goodslist = $.map($checkboxies, function(item) {
          var goods = {}
          goods.goodsid = $(item).data('goodsid')
          goods.specid = $(item).data('specid')
          return goods
        });
        if (!goodslist.length) {
          return
        }
        $.dialog({
          type: 'confirm',
          contentHtml: '确定要删除商品吗？',
          onClickOk: function() {
            //批量删除
            _this.deletePost4Batch(goodslist, 4);
            _this.removeEditStatus();
          },
          onClickCancel: function() {
            //_this.resetDeletePop()
            _this.removeEditStatus();
          }
        })
      });
    },
    // 商品总数与商品总价格
    totalCheck: function() {
      var selectBoxLength = $('.select').length
      var totalPrice = 0;
      if (selectBoxLength) {
        var goodslist = $.map($('.select'), function(item) {
          var goods = {}
          goods.goodsNum = parseInt($(item).find('label input').val())
          goods.goodsPrice = parseFloat($(item).find('.sale-price').text().slice(1))
          return goods
        });
        for (var i = 0; i < goodslist.length; i++) {
          totalPrice += goodslist[i].goodsNum * goodslist[i].goodsPrice
          $('.amount em').text(totalPrice.toFixed(2))
        }
      } else {
        $('.amount em').text('0.00')
      }
    },
    /**
     * 批量删除商品
     */
    deletePost4Batch: function(goodslist, source) {
      var _this = this
      var model = {
        data: {
          'goodslist': JSON.stringify(goodslist),
          'source': 4,
        }
      }
      $.extend(model.data, this.setDefaultParams());
      clifeService.batchDeleteCart(model).then(function(result) {
        if (result.state == 0) {
          var $selectBox = $('li.select');
          $selectBox.remove();
          var $liBox = $('#cartlist li');
          if ($liBox.length) {
            $('.blank-wrap').addClass('none')
          } else {
            $('.blank-wrap').removeClass('none')
            $('#checkWrap').addClass('none')
            $('#delWrap').addClass('none')
          }
          jb.toastHandler('操作成功');
        } else {
          jb.toastHandler(result.msg);
        }
      })
    },
    //重置还原选择
    resetDeletePop: function() {
      $('#delWrap').addClass('none');
      $('#checkWrap').removeClass('none');
      $('.check-label').removeClass('selected');
    },
    /**
     * 加减商品
     */
    changeGoodsNum: function() {
      var _this = this,
        $checkSingleWrap = $('#cartlist li'),
        $minus = $checkSingleWrap.find('.minus'),
        $plus = $checkSingleWrap.find('.plus'),
        $inputClick = $checkSingleWrap.find('label > input'),
        $input, goodsNum, goodsid, specid;
      // 初始化购物车状态
      for (var i = 0; i < $checkSingleWrap.length; i++) {
        goodsNum = parseInt($('label>input').eq(i).val());
        if (goodsNum > 1) {
          $('.minus').eq(i).addClass('allows')
        } else {
          $('.minus').eq(i).removeClass('allows')
        }
      }

      // 增加购物车商品数量事件
      $plus.on('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var i = $(this).closest('li').index(),
          nosale = $(this).closest('li').hasClass('no-sale');
        if (nosale) {
          return
        }
        $input = $('label > input').eq(i);
        goodsNum = parseInt($input.val());
        goodsNum++
        if (goodsNum > 1) {
          $('.minus').eq(i).addClass('allows')
        }
        var goodsid = $('li').eq(i).data('goodsid');
        var pecid = $('li').eq(i).data('specid');
        _this.setupdateCart($input, goodsid, specid, goodsNum, 1)
      })

      // 减少购物车商品数量事件
      $minus.on('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var i = $(this).closest('li').index(),
          nosale = $(this).closest('li').hasClass('no-sale');
        if (nosale) {
          return
        }
        $input = $('label > input').eq(i);
        goodsNum = parseInt($input.val());
        if (goodsNum <= 1) {
          return
        } else {
          goodsNum--
          if (goodsNum == 1) {
            $(this).removeClass('allows')
          }
          $input.val(goodsNum)
          goodsid = $('li').eq(i).data('goodsid');
          specid = $('li').eq(i).data('specid');
          _this.setupdateCart($input, goodsid, specid, goodsNum, 1)
          _this.totalCheck()
        }
      })

      // 输入数字
      $inputClick.on('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var i = $(this).closest('li').index(),
          $input = $(this);

        if ($(this).closest('li').hasClass('no-sale')) {
          return
        }

        $('label input').removeClass('numberchecked')
        $(this).addClass('numberchecked')
        var $select = $(this).closest('li');
        var goodsid = $('li').eq(i).data('goodsid');
        var pecid = $('li').eq(i).data('specid');
        jb.qyShoppingCartDialog('onGoodsNumCallback', function(data) {
          if (typeof data === 'string') {
            data = JSON.parse(data || '{}')
          }
          var model = {
            data: {
              goodsid: goodsid,
              specid: specid,
              amount: data.count,
              action: 1,
              source: 4
            }
          }
          $.extend(model.data, _this.setDefaultParams());
          clifeService.updateCart(model).then(function(result) {
            var $numberchecked = $('.numberchecked')
            if (result.state == 0) {
              $numberchecked.val(data.count)
              if ($select.hasClass('select')) {
                _this.totalCheck()
              }
              jb.toastHandler('操作成功');
            } else if (result.state == 3822002) { // 库存不足
              jb.toastHandler(result.msg);
              /*$numberchecked.val(result.data.quantity)
              if ($select.hasClass('select')) {
                _this.totalCheck()
              }*/
            } else {
              jb.toastHandler(result.msg);
            }
          })
        });

      })
    },
    /**
     * 商品删减更新
     */
    setupdateCart: function($input, goodsid, specid, amount, action) {
      var _this = this
      if (specid) {
        var model = {
          data: {
            goodsid: goodsid,
            specid: specid,
            amount: amount,
            action: action,
            source: 4
          }
        }
      } else {
        var model = {
          data: {
            goodsid: goodsid,
            amount: amount,
            action: action,
            source: 4
          }
        }
      }
      $.extend(model.data, this.setDefaultParams());
      clifeService.updateCart(model).then(function(result) {
        if (result.state == 0) {
          jb.toastHandler('操作成功');
          $input.val(amount)
          if ($input.closest('li').hasClass('select')) {
            _this.totalCheck()
          }
        } else if (result.state == 3822002) {
          jb.toastHandler(result.msg);
        } else {
          jb.toastHandler(result.msg);
        }
      })
    },
    /**
     * 注册右上角点击事件
     */
    registerJsHandler: function() {
      var _this = this;
      window.WebViewJavascriptBridge.registerHandler('showMultDelete', function(data, responseCallback) {
        var $listLength = $('#cartlist li'),
          $input = $('#cartlist li input'),
          $checkLabel = $('.check-label'),
          $checkWrap = $('#checkWrap'),
          $delWrap = $('#delWrap'),
          $priceWrap = $('.price-cont'),
          $canCheckNum = $('#canCheck em'),
          $amount = $('.amount em'),
          $canCheck = $('.sw-r'),
          $blankWrap = $('.blank-wrap');
        if (isedit) {
          //显示删除
          //设置右上角
          jb.topbarHandler('right', '', '完成', 'showMultDelete');
          isedit = false;
          if ($listLength.length == 0) {
            $delWrap.addClass('none');
            $blankWrap.removeClass('none');
            return
          }
          $canCheck.removeClass('canCheck');
          $canCheckNum.text('0');
          $amount.text('0.00');
          $checkLabel.removeClass('selected');
          $listLength.removeClass('select');
          $delWrap.removeClass('none');
          $checkWrap.addClass('none');
          $priceWrap.addClass('none');
          $input.addClass('ipt-edit');
          localStorage.setItem('goodslist', '')
          localStorage.setItem('delgoodslist', '')
          /*// 如果有本地存储
          if (delstorageGoodsList) {
            var oldgoodslist = JSON.parse(delstorageGoodsList);
            _this.storageHandler(oldgoodslist)
          }*/
        } else {
          //设置右上角
          jb.topbarHandler('right', '', '编辑', 'showMultDelete');
          isedit = true;
          //隐藏删除
          if ($listLength.length == 0) {
            $blankWrap.removeClass('none');
            $checkWrap.addClass('none')
            return
          }
          $canCheck.removeClass('canCheck');
          $canCheckNum.text('0');
          $amount.text('0.00');
          $checkLabel.removeClass('selected');
          $listLength.removeClass('select');
          $delWrap.addClass('none');
          $checkWrap.removeClass('none');
          $checkLabel.removeClass('selected');
          $priceWrap.removeClass('none')
          $input.removeClass('ipt-edit');
          localStorage.setItem('goodslist', '')
          localStorage.setItem('delgoodslist', '')
          /*// 如果有本地存储
          if (storageGoodsList) {
            var oldgoodslist = JSON.parse(storageGoodsList);
            _this.storageHandler(oldgoodslist)
          }*/
        }
      });
      window.WebViewJavascriptBridge.registerHandler('gobackHandler', function(data) {
        window.location.reload()
      })
      window.WebViewJavascriptBridge.registerHandler('onGoodsNumCallback', function(data) {
        if (typeof data === 'string') {
          data = JSON.parse(data || '{}')
        }
      })
      window.WebViewJavascriptBridge.registerHandler('onIdConfirmCallback', function(data) {
        jb.routerHandler(WEB_CONFIG.nativePage.clife.confirmOrder.id, JSON.stringify(globalParams), globalParams)
      })
      window.WebViewJavascriptBridge.registerHandler('returnHomePage', function(data, responseCallback) {

        var url = location.origin + '/life/assets/pages/clife/index.html';
        var params = {
          url: url
        };
        jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params), url);
      });
    },
    /**
     * 检查是否编辑状态
     */
    checkEditStatus: function() {
      return !!sessionStorage.getItem('isEdit');
    },
    setEditStatus: function() {
      sessionStorage.setItem('isEdit', true);
    },
    removeEditStatus: function() {
      sessionStorage.clear('isEdit');
    },
    /**
     * 图片延迟加载
     */
    lazyLoad: function() {
      $("#cartlist img").livequery(function() {
        $(this).unveil(200, function() {
          $(this).removeClass('unveil-img')
        });
      })
    },
    /**
     * 设置url query
     */
    setDefaultParams: function() {
      return {
        token: WEB_CONFIG.appInfo.token || Util.getQuery('token'),
        t_id: +new Date()
      }
    },
}
return cartController;
});
