define('walletController', ['walletService', 'handlebars', 'livequery', 'jsbridge', 'iscroll', 'md5', 'dialog'],
    function (WalletService, Handlebars, livequery, jsbridge, IScroll, md5, dialog) {
        var ws = new WalletService();
        var jb = new jsbridge();
        var params = {
            token: Util.getToken()
        }

        var isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端

        function handlebarfn(tmplid, cntid, result, appendtype) {
            var tmplHtml = $(tmplid).html();
            Handlebars.registerPartial("partialnotice", $("#tmpl_nodata").html());
            var tmplCompier = Handlebars.compile(tmplHtml);
            var $appendContent = $(cntid);
            if (appendtype) {
                $appendContent.html(tmplCompier(result));
                return
            }
            $appendContent.append(tmplCompier(result));
        }

        $.fn.pasteEvents = function (delay) {
            if (delay == undefined) delay = 20;
            return $(this).each(function () {
                var $el = $(this);
                $el.on("paste", function () {
                    $el.trigger("prepaste");
                    setTimeout(function () {
                        $el.trigger("postpaste");
                    }, delay);
                });
            });
        };

        var walletController = function () {};
        walletController.prototype = {
            getMybalance: function () {

                //========================
                //低于4.2版本隐藏余额转账按钮
                var version = parseFloat(Util.getQuery('appname').match(/\d\.\d/) || 4.2)

                if (version >= 4.2) {
                    $('.transfer').removeClass('none')

                }

                //========================

                var _this = this;
                jb.addObserver('refreshObserver', 'refreshHandler');
                //刷新页面
                window.WebViewJavascriptBridge.registerHandler('refreshHandler', function (data, responseCallback) {
                    location.reload(true)
                });

                ws.getMybalance(params)
                    .then(function (data) {
                        //console.log(data);
                        if (data.state == 0) {
                            jb.loadingHandler('hide');
                            handlebarfn('#tmpl_mybalance', '#cnt_mybalance', data.data, 'replace');
                        } else {
                            if (typeof data == 'string') {
                                data = $.parseJSON(data);
                            }
                            jb.toastHandler(data.msg);
                        }
                        return data
                    })
                    .then(function (data) {
                        if (data.state == 0) {
                            var $lt = $('#list-title');
                            var offset = $lt.offset().top + $lt.height();
                            if (offset) $('#mywallet_wrap').css('top', offset);
                            // _this.listScroll();
                            // window.ListScrollers['mywallet_wrap'].initData();
                            _this.getRcordList('recordlist')
                        }
                    })
                $('#js_todes').on('tap', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    var url = location.origin + '/life/assets/pages/wallet/Balance-description.html'
                    var tmpparams = {
                        url: url
                    }
                    jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);
                });

                $('.go-back').on('click', function (e) {
                    e.preventDefault();
                    jb.routerHandler(WEB_CONFIG.nativePage.wapPage.ceter.id, JSON.stringify({}));
                });

                jb.topbarHandler('left', '', '', 'goback');
                window.WebViewJavascriptBridge.registerHandler('goback', function (data, responseCallback) {
                    // jb.historygoHandler('browser');
                    var version = parseFloat(Util.getQuery('appname').match(/\d\.\d/) || 4.2)

                    if (version >= 4.2) {
                        if (isIOS) {
                            jb.routerHandler(WEB_CONFIG.nativePage.personal.ceter.id, JSON.stringify({}));

                        }else {
                            jb.routerHandler(WEB_CONFIG.nativePage.homeModule.home.id, JSON.stringify({"index":"4"}));
                        }

                    }else{
                        jb.historygoHandler('native');
                    } 


                    // if (isIOS) {
                    //     if (/4\.1/.test(Util.getQuery('appname'))) {
                    //         jb.historygoHandler('native');
                    //     } else {
                    //         jb.routerHandler(WEB_CONFIG.nativePage.personal.ceter.id, JSON.stringify({}));
                    //     }
                    // } else {
                    //     jb.routerHandler(WEB_CONFIG.nativePage.homeModule.home.id, JSON.stringify({}));
                    // }
                });
                //$('#js_torecharge').livequery(function () { 
                $('#js_torecharge').on('tap', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var url =location.origin + '/life/assets/pages/wallet/recharge.html'/* + Util.getQueryString(['token','env']);*/
                    jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify({url: url}), url);
                    //window.location.href = location.origin + '/life/assets/pages/wallet/recharge.html?' + Util.getQueryString();
                });
                //});

                $('.transfer').on('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    var url = location.origin + '/life/assets/pages/wallet/balance-transfer-1.html';
                    jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify({url: url}), url);
                })
            },

            getRcordList: function (type) {
                var $cntE = '', $tmpl = '';
                var cp = window.ListPages[type];
                var noDataText = '';
                switch (type) {
                    case 'recordlist':
                        $cntE = '#cnt_recordlist';
                        noDataText = '暂无明细';
                        break;
                }
                var _this = this;
                var listParams = {
                    pagesize: cp.pageSize,
                    pagenum: cp.pageNum,
                    token: Util.getQuery('token')
                }

                if (cp.islast) {
                    //设置状态
                    cp.loadingStep = 0;
                    //移除loading
                    cp.pullUpEl.removeClass('loading');
                }

                //获取列表
                return !cp.islast && ws.getRecordlist(listParams)
                    .then(function (data) {
                        jb.loadingHandler('hide');
                        if (data.state == 0) {

                            //是否空数据 根据total判断 total=0 没数据
                            if (data.data.total == 0) {
                                var tmpObj = {
                                    noDataText: noDataText,
                                    isNodata: true
                                }
                                $.extend(data.data, tmpObj);
                                $('body').css('background', '#ffffff');
                                handlebarfn('#tmpl_recordlist', $cntE, data.data, 'replace');
                            }
                            else {
                                //格式化数据
                                $.map(data.data.recordList, function (ls, index) {
                                    ls.plus = (ls.recordType != 2 && ls.recordType != 5);
                                    // ls.sendTime = Util.formatDate2(ls.sendTime, 'yyyy年MM月dd日 hh:mm');
                                    // ls.msgStatus = (ls.msgStatus == 1);
                                    return ls;
                                })
                                //刷新用html，加载用append
                                if (cp.refreshStatus == 0) {
                                    handlebarfn('#tmpl_recordlist', $cntE, data.data, 'replace');
                                } else {
                                    handlebarfn('#tmpl_recordlist', $cntE, data.data);
                                }

                                //跳转详情页
                                $('.js_item').livequery(function () {
                                    $(this).on('click', function (e) {
                                        e.preventDefault();
                                        e.stopImmediatePropagation();
                                        var _recordId = $(this).data('recordid');
                                        var _recordType = $(this).data('recordtype');
                                        //window.location.href = './details.html?recordId=' + _recordId + '&recordType=' + _recordType + '&'+Util.getQueryString();
                                        var url = location.origin + '/life/assets/pages/wallet/details.html?recordId=' + _recordId + '&recordType=' + _recordType;
                                        var tmpparams = {
                                            url: url
                                        }
                                        jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);
                                    })
                                })

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
                            //请求数据不成功
                            if (typeof data == "string") {
                                data = JSON.parse(data);
                            }
                            console.log(data.msg);
                            jb.toastHandler(data.msg);
                        }

                    })
                    .then(function () {

                        _this.iscrollRefresh(type);
                        // var opencnttype = $('#js_tabcnt').find('.selected').attr('data-tab');
                        // var opencntid = $('#js_tabcnt').find('.selected').attr('id');
                        // setTimeout(function () {
                        //     window.ListScrollers[opencnttype].refresh();
                        //     if (type == 'status1') {
                        //         window.ListScrollers[type].maxScrollY = window.ListScrollers[type].maxScrollY - 56
                        //     }
                        //     if(window.ListScrollers[opencnttype].scrollerHeight===window.ListScrollers[opencnttype].wrapperHeight){
                        //
                        //         $('#'+opencntid).find('.order-wrap').css('min-height',window.ListScrollers[opencnttype].wrapperHeight+5+'px')
                        //
                        //         window.ListScrollers[opencnttype].refresh();
                        //
                        //     }else {
                        //         $('#'+opencntid).height('')
                        //     }
                        //     //_this.lazyLoad();
                        // }, 200)
                    })
                    .fail(function (data) {
                        if (typeof data == "string") {
                            data = JSON.parse(data);
                        }
                        //if(data.state=='6829201')
                        jb.toastHandler(data.msg);
                        //jb.toastHandler('网络开小差，稍后再试');
                    })
                    .done(function () {
                        cp.loadingStep = 0;
                    })

            },

            /**
             * iscroll refresh
             */
            iscrollRefresh: function (type) {
                setTimeout(function () {
                    window.ListPages[type].pullUpEl.hide();
                    window.ListScrollers && window.ListScrollers[type].refresh();
                    //window.ListPages[type].scrollMaxY = window.ListScrollers[type].maxScrollY;
                    //window.ListScrollers[type].maxScrollY = window.ListScrollers[type].maxScrollY +5
                }, 500)
            },
            /**
             * 下拉刷新
             */
            refreshList: function (type) {
                var _this = this;
                var cp = window.ListPages[type];
                cp.islast = false;
                cp.refreshStatus = 0;
                //cp.scrollMaxY = 0;
                cp.pageNum = 1;
                cp.pageSize = 10;
                cp.pullDownEl.removeClass('loading');
                cp.pullDownL.html('下拉显示更多...');
                cp.pullDownEl.hide();
                //cp.pullUpEl.hide();

                $('#cnt_mybalance').html('');
                _this.getMybalance();
            },
            /**
             * 定义iscroll
             */
            listScroll: function () {
                window.ListScrollers = {};
                window.ListPages = {};
                var _this     = this,
                    $wrappers = $('.wrapper');

                var pulldownHtml = '<div class="pullDown"><span class="pullDownIcon"></span><span class="pullDownLabel"></span></div>';
                var pullupHtml = '<div class="pullUp"> <span class="pullUpIcon"></span> <span class="pullUpLabel"></span></div>';

                $wrappers.each(function () {
                    var cid   = $(this).attr('id'),
                        type  = $(this).data('tab'),
                        temp  = {},
                        temp2 = {};

                    var _thisScroll = new IScroll('#' + cid, {
                        click: true,
                        tap: false,
                        mouseWheel: true,
                        eventPassthrough: false,
                        preventDefault: false,
                        //snap: true,
                        probeType: isIOS ? 3 : 2
                    });
                    var $thiswrapper = $(_thisScroll.wrapper);
                    var wrapItemEl = $thiswrapper.find('ul');
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

                            if (this.y > 5) {
                                //下拉刷新效果
                                //this.minScrollY=5;
                                temp2.refreshStatus = 0;
                                temp2.pullDownEl.show();
                                temp2.pullDownEl.addClass('flip');
                                temp2.pullDownL.html('准备刷新...');
                                temp2.loadingStep = 1;
                            } else if (this.y < (this.maxScrollY - 5)) {
                                //上拉加载效果
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
                                    //    window.ListScrollers[type].refresh();
                                    //     if (type == 'status1') {
                                    //         window.ListScrollers[type].maxScrollY = window.ListScrollers[type].maxScrollY - 56
                                    //     }
                                    // }, 1000)

                                }
                                temp2.loadingStep = 2;
                                _this.getRcordList(type);
                            } else if (temp2.pullDownEl.attr('class').match('flip|loading')) {
                                temp2.pullDownEl.removeClass('flip').addClass('loading');
                                temp2.pullDownL.html('Loading...');

                                temp2.loadingStep = 2;

                                _this.refreshList(type);
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

                document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

            },

            /**
             * 详情
             */
            getRecordDetail: function () {

                var exModle = {
                    recordid: Util.getQuery('recordId')
                };
                var tmplType = Util.getQuery('recordType');
                if (tmplType == 1) {
                    //$('title').html('充值详情');
                    jb.topbarHandler('center', '', '充值详情');
                }
                if (tmplType == 2) {
                    //$('title').html('消费详情');
                    jb.topbarHandler('center', '', '消费详情');
                }
                if (tmplType == 3) {
                    //$('title').html('退款至余额详情');
                    jb.topbarHandler('center', '', '退款至余额详情');
                }
                if (tmplType == 4) {
                    jb.topbarHandler('center', '', '转账详情');
                }
                if (tmplType == 5) {
                    jb.topbarHandler('center', '', '转账详情');
                }
                console.log(tmplType);
                $.extend(exModle, params);
                console.log(exModle);
                ws.getRecorddetail(exModle)
                    .then(function (data) {
                        var tmpObj = {
                            rechargeDetail: (tmplType == 1),
                            consumeDetail: (tmplType == 2),
                            returnDetail: (tmplType == 3),
                            cardInDetail: (tmplType == 4),
                            cardOutDetail: (tmplType == 5)
                        }
                        if (data.state == 0) {
                            $.extend(data.data, tmpObj);
                            handlebarfn('#tmpl_recorddetail', '#cnt_recorddetail', data.data);
                            //跳转至列表 返回按钮
                            $('#returnBtn').livequery(function () {
                                $(this).on('click', function (e) {
                                    e.preventDefault();
                                    jb.historygoHandler('native')
                                    //history.go(-1);
                                });
                            })

                            //跳转至详情事件
                            $('#js_toDetail').on('click', function (e) {
                                e.preventDefault();
                                var ordersn = $(this).text();
                                var url = location.origin + '/life/assets/pages/order-details.html?ordersn=' + ordersn + '&transportType=1';
                                //console.log(url);
                                var tmpparams = {
                                    url: url
                                }
                                jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);
                            });

                            //跳转至退款事件
                            // $('#js_toRefund').on('click', function(e) {
                            //     e.preventDefault();
                            //     var postsaledsn = $(this).text();
                            //     var postsaledtype = $(this).data('type');
                            //
                            //     var _tp = JSON.stringify({
                            //         postsaledsn: postsaledsn,
                            //         type: postsaledtype
                            //     });
                            //     jb.routerHandler(WEB_CONFIG.nativePage.order.aftersaledetail, _tp);
                            // });
                        } else {
                            if (typeof data == "string") {
                                data = JSON.parse(data);
                            }
                            jb.toastHandler(data.msg);
                        }
                    })
            },
            /**
             * 充值
             * @return {[type]} [description]
             */
            rechargeAcount: function () {

                var $target         = $('#key'),
                    $msg            = $('.err-msg'),
                    $clear          = $('.txt-clear'),
                    $wapper         = $('.btn-wrap'),
                    regEmpty        = /[^\d\s]/g,
                    regFull         = /^[\d\s]{14,}/,
                    isDeleteMode    = false,
                    isPasteMode     = false,
                    currentPosition = 0;

                $target.on('input', function (e) {
                    var $this              = $(this),
                        value              = $this.val(),
                        rs                 = formatNumber(value),
                        leg                = rs.after.length,
                        flag               = regEmpty.test(value),
                        selectionStartPrev = $this.get(0).selectionStart;

                    if (flag) {
                        $msg.text('请输入12-16位数字').show();
                    } else {
                        $msg.hide();
                    }

                    if (leg == 0) {
                        $clear.hide();
                        $msg.hide();
                    } else if (leg > 13 && !flag) {
                        $wapper.addClass('red');

                    } else {
                        $clear.show();

                        if (regFull.test(value)) {
                            $wapper.addClass('red');
                        } else {
                            $wapper.removeClass('red');

                        }

                    }

                    var ua = window.navigator.userAgent;
                    var myua = ua.substr(ua.indexOf('Android') + 8, 3);

                    if (myua <= 8) {
                        isDeleteMode = false;
                        isPasteMode = false;
                        return
                    }

                    $this.val(rs.after)

                    var selectionStart = $this.get(0).selectionStart,
                        selectionEnd   = $this.get(0).selectionEnd,
                        delta          = $.inArray(selectionStartPrev / 5, [1, 2, 3, 4]),
                        pos            = selectionEnd;

                    // console.log(selectionStart, selectionEnd)

                    if (delta == 2) {
                        delta = 1;
                    }

                    pos = (delta > -1) ? (selectionStartPrev + ((delta == 0) ? (delta + 1) : delta)) : selectionStartPrev;

                    if (isDeleteMode) {

                        if (delta > -1) {
                            pos = pos - 1;
                        }

                    }
                    if (isPasteMode) {
                        pos = selectionEnd;
                    }
                    // console.log('input: ', 'pos:' + pos, 'prev:' + selectionStartPrev, 'delta:' + delta, 'del:' + isDeleteMode)

                    $this.get(0).setSelectionRange(pos, pos);

                    isDeleteMode = false;
                    isPasteMode = false;

                })

                $target.on('keydown', function (event) {

                    var $this          = $(this),
                        // selectionStartPrev = $this.get(0).selectionStart,
                        selectionStart = $this.get(0).selectionStart;

                    currentPosition = selectionStart;

                    // console.log('keydown', currentPosition, selectionStartPrev, selectionStart)

                    if (event.keyCode === 8) {
                        isDeleteMode = true;
                    }

                })
                $target.on('paste', function (event) {
                    isPasteMode = true;
                })

                function formatNumber(value) {

                    var arrStr = Array.prototype.slice.apply(value.replace(/\s/g, '')),
                        count  = Math.ceil(value.replace(/\s/g, '').length / 4),
                        arr    = [];

                    for (var i = 0; i < count; i++) {

                        var t = arrStr.slice(i * 4, (i + 1) * 4).join('')

                        t && arr.push(t)
                    }

                    return {
                        before: value,
                        after: arr.join(' ').replace(/[^\d\s]/g, '')
                    }
                }

                $clear.on('click', function () {
                    $target.val('');
                    $(this).hide();
                    $wapper.removeClass('red');
                    $msg.hide();
                    $target.focus();
                });

                $('#ok').on('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    var key   = $('#key').val().replace(/ /g, ''),
                        state = $(this).data('state') || 'unselect';

                    //防止重复提交
                    if (state !== 'unselect' || !$('.btn-wrap').hasClass('red')) {
                        return;
                    }
                    var postparams = {
                        cardpwd: $.md5(key),
                        token: Util.getQuery('token') || ''
                    }
                    ws.rechargeCard(postparams)
                        .then(function (result) {
                            console.log(result);
                            //result = $.parseJSON(result);
                            //rechargeMessage(data)
                            var errorCode = result.state + '';
                            var $error = $('.err-msg');
                            if (result.state == 0) {
                                var recordId = result.data.recordId;
                                jb.toastHandler('充值成功');

                                var url = location.origin + '/life/assets/pages/wallet/details.html?recordId=' + recordId + '&recordType=1&' + Util.getQueryString();
                                var tmpparams = {
                                    url: url
                                }
                                jb.postNotification('refreshObserver');
                                jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);
                                // $.dialog({
                                //     type:'info',
                                //     infoIcon:'../../images/common_icon_pass@3x.png',
                                //     infoText:'充值成功',
                                //     onClosed:function(){
                                //         window.location.href = 'details.html?recordId=' + recordId + '&recordType=1&' + Util.getQueryString(['env']);
                                //     }
                                // })
                            } else {
                                if (errorCode.length > 3) {
                                    if (errorCode.charAt(2) == 3) //错误第三位数字=0的时候，不进行任何提示。
                                    {
                                        jb.toastHandler(result.msg);
                                        // $.dialog({
                                        //     contentHtml: result.msg
                                        // })
                                    } else {
                                        $error.text(result.msg).show();
                                    }
                                } else {
                                    jb.toastHandler(result.msg);
                                    // $.dialog({
                                    //
                                    //     contentHtml: result.msg
                                    // })
                                }
                            }

                        });

                });

            },
            init: function () {
            }
        };
        return walletController;
    });
