define('qyOrderController', ['qyOrderService', 'handlebars', 'livequery', 'jsbridge', 'util', 'iscroll', 'cLifeFooter', 'dialog', 'unveil'],
    function (qyOrderService, Handlebars, livequery, jsbridge, util, IScroll, CLifeFooter) {
        var os = new qyOrderService();
        var jb = new jsbridge();
        var isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
        var appinfo = jb.getAppInfo();

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

        /**
         * JSON.stringify
         */
        Handlebars.registerHelper("stringify", function (value) {

            if (!!value) {
                return JSON.stringify(value).replace(/"/g, '&quot;');
            }

        });

        function handlebarfn(tmplid, cntid, result, appendtype) {
            var tmplHtml = $(tmplid).html();

            Handlebars.registerPartial("goodsdetail", $("#tmpl_goodsdetail").html());
            Handlebars.registerPartial("wuliu", $("#tmpl_wuliu").html());

            var tmplCompier = Handlebars.compile(tmplHtml);
            var $appendContent = $(cntid);
            if (appendtype) {
                $appendContent.html(tmplCompier(result));
                return
            }
            $appendContent.append(tmplCompier(result));
        }

        var params = {
            ordersn: Util.getQuery('ordersn'),
            getPageNum: Util.getQuery('pagenum')
        };
        //判断是否在选择订单页
        var locationhref = location.pathname;
        var pattOrderSelect = new RegExp('order-select.html');
        var pattRechargeOrder = new RegExp('recharge-order.html');
        var isKeFuOrderPage = pattOrderSelect.test(locationhref);
        var isRechargeOrder = pattRechargeOrder.test(locationhref);

        var mybalance = '';

        var clickstatus = true;
        var qyOrderController = function () {
            this.isPayment = '';
            this.payChannel = '';
        };
        qyOrderController.prototype = {

            /**
             * 检查是否是账期订单
             */
            checkPaymentDaysSupport: function () {
                var _this = this;
                var params = {
                    source: 4,
                    token: Util.getQuery('token')
                };

                var locationhref = location.pathname;
                var isOrderDetail = /qyorder-details.html/.test(locationhref);

                return os.checkPaymentDaysSupport(params)
                    .then(function (data) {

                        jb.loadingHandler('hide');

                        data = (typeof data === 'string') ? JSON.parse(data) : data;
                        jb.loadingHandler('hide');
                        //0成功 ，3830010 没有设置账期支付
                        if (data.state == 0) {
                            _this.isPayment = true;
                            _this.payChannel = data.data.channelList[0].payChannel;
                            if (isOrderDetail) {
                                _this.getDetail('orderrefresh');
                            } else {
                                $('.js_tab2 span').text('待审核');
                                _this.tabSwitchFn();
                                _this.setDefaultTab();
                            }
                        } else if (data.state == 3800010) {
                            _this.isPayment = false;
                            if (isOrderDetail) {
                                _this.getDetail('orderrefresh');
                            } else {
                                $('.js_tab2 span').text('待付款');
                                $('.submit-wrap').removeClass('none');
                                _this.tabSwitchFn();
                                _this.setDefaultTab();
                            }
                        } else {
                            jb.toastHandler(data.msg);
                        }
                    })
                    .fail(function () {
                        jb.toastHandler(data.msg);
                    })
                    .done(function () {

                    })

            },
            /**
             * 订单列表
             * @param  {[type]} type [description]
             * @return {[type]}      [description]
             */
            getOrderList: function (type) {

                // localStorage.removeItem('detailData');
                var ot;
                var $cntE = '', $tmpl = '#tmpl_orderlist', $tmplre = '#tmpl_reorderlist';
                var cp = window.ListPages[type];
                var noDataText = '';

                //获取上次选择订单页码
                if (isKeFuOrderPage && params.getPageNum) {

                    window.ListPages[type].pageNum = params.getPageNum;
                    params.getPageNum = ''
                }
                var _this = this;

                //商品订单请求参数
                var listParams = {
                    orderstatus: ot ? ot : '',
                    pagesize: cp.pageSize || 10,
                    pagenum: cp.pageNum || 1,
                    storetype: 5,
                    source: 4
                };
                //充值订单请求参数
                var rechargeListParams = {
                    ordertype: '1,2,3',
                    orderstatus: ot ? ot : '20,30,40,50',
                    entry: 1,
                    pagesize: cp.pageSize || 10,
                    pagenum: cp.pageNum || 1,
                    storetype: 5
                };

                if (cp.islast) {
                    //设置状态
                    cp.loadingStep = 0;
                    //移除loading
                    cp.pullUpEl.removeClass('loading');
                }

                //
                function getOrderList(isrecharge, listParams) {
                    if (isrecharge) {
                        //获取充值订单列表
                        return !cp.islast && os.getRechargeOrderList(listParams)
                            .then(function (data) {

                                data = (typeof data === 'string') ? JSON.parse(data) : data;

                                //jb.loadingHandler('hide');

                                if (data.state == 0) {

                                    //是否空数据 根据total判断 total=0 没数据
                                    if (data.data.total == 0) {
                                        console.log('no data')
                                        var tmpObj = {
                                            noDataText: noDataText,
                                            isNodata: true
                                        }
                                        $.extend(data.data, tmpObj);
                                        $('body').css('background', '#ffffff');
                                        handlebarfn('#tmpl_nodata', '#cnt_' + type, data.data, 'replace');
                                    }
                                    else {

                                        console.log(data.data)
                                        //格式化数据
                                        $.map(data.data.rechargeOrderList, function (ls, index) {

                                            ls.payAmount = ls.payAmount / 100;
                                            ls.hasdesc = ls.desc.length > 0;

                                            switch (ls.payChannel) {
                                                case 0:
                                                    ls.payChannelName = '未支付';
                                                    break;
                                                case 1:
                                                    ls.payChannelName = '支付宝支付';
                                                    break;
                                                case 2:
                                                    ls.payChannelName = '微信支付';
                                                    break;
                                                case 3:
                                                    ls.payChannelName = '微信公众号支付';
                                                    break;
                                                case 4:
                                                    ls.payChannelName = '乐分期支付';
                                                    break;
                                                case 5:
                                                    ls.payChannelName = '星链卡支付';
                                                    break;
                                                case 6:
                                                    ls.payChannelName = '星链钱包支付';
                                                    break;
                                                default:
                                                    break;

                                            }
                                            if (isKeFuOrderPage) {
                                                ls.isSelected = (ls.orderSn == params.ordersn);
                                            }
                                            return ls;
                                        })
                                        //刷新用html，加载用append
                                        if (cp.refreshStatus == 0) {
                                            handlebarfn($tmplre, $cntE, data.data, 'replace');
                                        } else {
                                            handlebarfn($tmplre, $cntE, data.data);
                                        }

                                        //交互事件
                                        _this.orderListEvent();

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
                            })
                    } else {
                        //获取订单列表
                        return !cp.islast && os.getOrderList(listParams)
                            .then(function (data) {

                                data = (typeof data === 'string') ? JSON.parse(data) : data;

                                //jb.loadingHandler('hide');

                                if (data.state == 0) {

                                    //是否空数据 根据total判断 total=0 没数据
                                    if (data.data.total == 0 && data.data.orderList.length <= 0) {
                                        console.log('no data')
                                        var tmpObj = {
                                            noDataText: noDataText,
                                            isNodata: true
                                        }
                                        $.extend(data.data, tmpObj);
                                        $('body').css('background', '#ffffff');
                                        handlebarfn('#tmpl_nodata', '#cnt_' + type, data.data, 'replace');
                                    }
                                    else {
                                        console.log(data.data)

                                        //格式化数据
                                        $.map(data.data.orderList, function (ls, index) {

                                            ls.operaBtnData = {};
                                            var _status = ls.orderStatus;
                                            var _subOrderStatus = parseInt(ls.subOrderStatus);
                                            //var _isPickup=/自提/gi.test(ls.deliveryType);
                                            var _isPickup = (ls.isSelfget == 1);
                                            ls.isToHome = (ls.isToHome == 1);
                                            ls.isShowTrackBtn = ( (_subOrderStatus == 30 || _subOrderStatus == 40 || _subOrderStatus == 70 || _subOrderStatus == 80) && !ls.isToHome && !_isPickup )
                                            ls.songhuo = (ls.isToHome == 1) && (!_isPickup)
                                            //退款
                                            ls.isRefundApply = (ls.isRefundApply == 1 && !_this.isPayment);
                                            ls.oneItem = (ls.goodsList.length == 1);

                                            ls.isGrouponOrder = (ls.isGrouponOrder == 1); //团购
                                            ls.isCross = (ls.isCross == 1);  //海淘

                                            //账期订单
                                            // console.log(_this.isPayment ,ls.orderStatus)
                                            // if (_this.isPayment && ls.orderStatus == 15) {
                                            //     ls.orderStatusName = '待审核'
                                            // }
                                            _this.setOperationBtn(_status, ls.operaBtnData, ls.isToHome, _isPickup);

                                            //匹配默认选中订单
                                            if (isKeFuOrderPage) {
                                                ls.isSelected = (ls.orderSN == params.ordersn);
                                            }
                                            return ls;
                                        })
                                        data.data.multiPay = (type == 'status2' && !_this.isPayment);
                                        //刷新用html，加载用append
                                        if (cp.refreshStatus == 0) {
                                            handlebarfn($tmpl, $cntE, data.data, 'replace');
                                        } else {
                                            handlebarfn($tmpl, $cntE, data.data);
                                        }
                                        //交互事件
                                        _this.orderListEvent();

                                        //更新ListPage
                                        if (data.data.isLastPage == 0) {
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
                            })
                    }

                }

                //判断是否来自客服
                if (!isKeFuOrderPage) {
                    //isRechargeOrder false，商品订单 true，充值订单
                    if (!isRechargeOrder) {

                        switch (type) {
                            case 'status1':
                                ot = '';
                                $cntE = '#cnt_status1 .order-wrap';
                                noDataText = '暂无订单';
                                break;
                            case 'status2':
                                ot = _this.isPayment ? '15' : '10';
                                $cntE = '#cnt_status2 .order-wrap';
                                noDataText = '暂无订单';
                                break;
                            case 'status3':
                                ot = '20';
                                $cntE = '#cnt_status3 .order-wrap';
                                noDataText = '暂无订单';
                                break;
                            case 'status4':
                                ot = '30';
                                $cntE = '#cnt_status4 .order-wrap';
                                noDataText = '暂无订单';
                                break;
                        }
                        listParams.orderstatus = ot;
                        getOrderList(false, listParams)

                    } else {

                        //  订单状态(10:未付款,20:已付款,30:充值中,40:充值成功,50:充值失败)。
                        // 支持组合查询，以“,”分隔。如：orderstatus=10,20
                        switch (type) {
                            case 'status1':
                                ot = '20,30,40,50';
                                $cntE = '#cnt_status1 .order-wrap';
                                noDataText = '暂无订单';
                                break;
                            case 'status2':
                                ot = '20,30';
                                $cntE = '#cnt_status2 .order-wrap';
                                noDataText = '暂无订单';
                                break;
                            case 'status3':
                                ot = '40';
                                $cntE = '#cnt_status3 .order-wrap';
                                noDataText = '暂无订单';
                                break;
                            case 'status4':
                                ot = '50';
                                $cntE = '#cnt_status4 .order-wrap';
                                noDataText = '暂无订单';
                                break;
                        }

                        rechargeListParams.orderstatus = ot;
                        getOrderList(true, rechargeListParams)
                    }

                } else {
                    switch (type) {
                        case 'status1':
                            $cntE = '#cnt_status1 .order-wrap';
                            noDataText = '暂无订单';
                            getOrderList(false, listParams);
                            break;
                        case 'status2':
                            $cntE = '#cnt_status2 .order-wrap';
                            noDataText = '暂无订单';
                            getOrderList(true, rechargeListParams);
                            break;
                    }
                }

            },
            /**
             * 订单列表事件
             */
            orderListEvent: function () {

                var _this = this;

                //列表跳转店铺详情
                $('.ol-top h4').livequery(function () {

                    var $thisEle = $(this);

                    _this.getStoreDetail($thisEle);
                })
                //充值订单详情
                $('.ro-info').livequery(function () {
                    $(this).on('click', function (e) {

                        e.preventDefault();
                        e.stopImmediatePropagation();

                        var ordersn = $(this).data('ordersn')
                        var url = location.origin + '/life/assets/pages/recharge-orderdetail.html?ordersn=' + ordersn;

                        var tmpparams = {
                            url: url
                        }
                        if (clickstatus) {
                            jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);
                        }
                        clickstatus = false;
                        setTimeout(function () {
                            clickstatus = true;
                        }, 1000)

                    });
                });
                //商品订单详情
                $('.item-show').livequery(function () {
                    $(this).on('click', function (e) {

                        e.preventDefault();
                        e.stopImmediatePropagation();
                        var _ordersn = $(this).data('ordersn');
                        var fromwhere = Util.getQuery('pageFlag');
                        var url = '';

                        if (!!fromwhere) {
                            url = location.origin + '/life/assets/pages/clife/qyorder-details.html?ordersn=' + _ordersn + '&fromwhere=' + fromwhere;
                        } else {
                            url = location.origin + '/life/assets/pages/clife/qyorder-details.html?ordersn=' + _ordersn;
                        }
                        console.log(url);
                        var tmpparams = {
                            url: url
                        }

                        if (clickstatus) {
                            jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);
                        }
                        clickstatus = false;
                        setTimeout(function () {
                            clickstatus = true;
                        }, 1000)
                    });
                });
                ////选择订单
                if (isKeFuOrderPage) {

                    //获取订单号
                    var getkefuInfo = {
                        selectedOrderSn: '',
                        orderType: '',
                        pagenum: ''
                    };
                    $('.check-cont').livequery(function () {

                        $(this).on('click', function (e) {
                            e.preventDefault();
                            e.stopImmediatePropagation();

                            var $thisEle = $(this).find('.check-label');

                            $thisEle.toggleClass('selected');

                            $(this).parents('.order-list').siblings().find('.check-label').removeClass('selected');
                            var $eleTab = $(this).parents('.tab-content').data('tab') + '';
                            var pageNum = window.ListPages[$eleTab].pageNum;
                            if (pageNum > 1) --pageNum;
                            getkefuInfo.pagenum = pageNum;

                            if ($eleTab == 'status1') {
                                getkefuInfo.orderType = '1';
                            } else if ($eleTab == 'status2') {
                                getkefuInfo.orderType = '2';
                            }
                            if ($thisEle.hasClass('selected')) {
                                getkefuInfo.selectedOrderSn = $thisEle.next('input').attr('id').toString();
                                sessionStorage.setItem('getkefuInfo', JSON.stringify(getkefuInfo));
                            } else {
                                getkefuInfo.selectedOrderSn = '';
                                getkefuInfo.orderType = '';
                                getkefuInfo.pagenum = '';
                            }
                            console.log(getkefuInfo.selectedOrderSn)

                        })
                    });

                    $('.btn-select').livequery(function () {
                        $(this).on('click', function (e) {

                            e.preventDefault();
                            e.stopImmediatePropagation();

                            var getkefuInfo = JSON.parse(sessionStorage.getItem('getkefuInfo'));
                            var isSelected = $('.check-cont').find('.check-label').hasClass('selected');
                            console.log(window.ListPages['status1'])
                            console.log(!!Util.isApp())
                            if (!!Util.isApp()) {
                                //上次已选择
                                if (isSelected && !getkefuInfo) {
                                    jb.historygoHandler('native');
                                } else {
                                    console.log(getkefuInfo)
                                    if (!!getkefuInfo) {
                                        jb.postNotification('refreshListenFeedbackList', JSON.stringify({
                                            'tab': 'orderFlag',
                                            'orderNo': getkefuInfo.selectedOrderSn,
                                            'orderType': getkefuInfo.orderType,
                                            'pagenum': getkefuInfo.pagenum
                                        }));
                                        jb.historygoHandler('native');
                                    } else {
                                        jb.toastHandler('请选择您需要咨询的订单');
                                    }
                                }
                            } else {
                                var href = location.origin + '/life/assets/pages/feedback.html?token=' + Util.getQuery('token') + '&env=' + Util.getQuery('env');

                                if (isSelected && !getkefuInfo) {
                                    // window.history.go(-1);
                                    window.location.href = href;
                                } else {
                                    console.log(getkefuInfo)
                                    if (!!getkefuInfo) {
                                        localStorage.setItem('getkefuInfo', JSON.stringify({
                                            'tab': 'orderFlag',
                                            'orderNo': getkefuInfo.selectedOrderSn,
                                            'orderType': getkefuInfo.orderType,
                                            'pagenum': getkefuInfo.pagenum
                                        }));
                                        // window.history.go(-1);

                                        window.location.href = href;
                                    } else {
                                        Util.dialog.showTips('请选择您需要咨询的订单');
                                    }
                                }
                            }

                        })
                    })

                } else if (isRechargeOrder) {
                    //充值订单

                    //再次充值
                    $('.js-againrecharge').livequery(function () {
                        $(this).on('tap', function (e) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            var phoneNumber = $(this).data('phonenumber'),
                                orderType   = $(this).data('ordertype');
                            var _clickstatus = true;
                            console.log(orderType)
                            var url = '';
                            if (orderType == 2) {
                                url = location.origin + '/life/assets/pages/recharge/recharge_qq.html?qqnumber=' + phoneNumber;
                            } else {
                                url = location.origin + '/life/assets/pages/recharge/recharge.html?phonenumber=' + phoneNumber;
                            }
                            var tmpparams = {
                                url: url
                            }
                            if (_clickstatus) {
                                jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);
                                _clickstatus = false;
                            }
                            setTimeout(function () {
                                _clickstatus = true;
                            }, 1000)

                        });
                    })

                } else {
                    //商品订单

                    //绑定按钮点击事件
                    _this.bindOperationFn();

                    //绑定选择事件
                    $('.check-label').livequery(function () {
                        $(this).on('click', function (e) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            $(this).toggleClass('selected')
                            if ($(this).hasClass('selected')) {
                                $(this).next('input').prop('checked', 'checked');
                            } else {
                                $(this).next('input').prop('checked', '');
                            }
                        });
                    });

                    //合并支付
                    $('#js_comPay').livequery(function () {
                        $(this).on('click', function (e) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            _this.getSelectedOrders();
                        });
                    });

                }

            },

            /**
             * 订单详情
             * @return {[type]} [description]
             */
            getDetail: function (type) {
                var _this = this;
                var cp = window.ListPages[type];

                localStorage.removeItem('deliverData');
                localStorage.removeItem('detailData');

                jb.addObserver('refreshListenindetail', 'listRefresh')
                _this.registerJsHandler();

                os.getOrderDetail(params)
                    .then(function (data) {
                        jb.loadingHandler('hide');

                        data = (typeof data === 'string') ? JSON.parse(data) : data;

                        if (data.state == 0) {

                            var orderInfo = data.data.orderInfo;
                            orderInfo.operaBtnData = {};
                            orderInfo.statusInfo = [];

                            ////console.log(data);
                            //店铺（小店）订单且送货上门不显示物流信息 payTypeStatus
                            var _shoptohome = orderInfo.deliveryInfo.deliveryType == "送货上门" || orderInfo.deliveryInfo.isSelfget == 1;
                            //自提
                            //var _ispickup=/自提/gi.test(orderInfo.deliveryInfo.deliveryType);
                            var _ispickup = (orderInfo.deliveryInfo.isSelfget == 1);
                            orderInfo.deliveryInfo.isSelfget = (_ispickup);
                            orderInfo.deliveryInfo.isDeliverGoods = (orderInfo.deliveryInfo.deliveryType == "送货上门");
                            //显示发票
                            orderInfo.receiptType.hasreceipt = (orderInfo.receiptType.type != 0);
                            //显示查看电子发票
                            orderInfo.receiptType.isViewInvoice = (!!orderInfo.receiptType.isViewBillDetail && orderInfo.receiptType.isViewBillDetail != 1);
                            //显示退款
                            orderInfo.isRefundApply = (orderInfo.isRefundApply == 1 && !_this.isPayment);
                            //显示店铺名称
                            orderInfo.orderBaseInfo.isshop = (orderInfo.orderBaseInfo.isToHome == 1);

                            orderInfo.orderBaseInfo.orderTime = Util.formatDate2(orderInfo.orderBaseInfo.orderTime, 'yyyy-MM-dd hh:mm');

                            //是否拼团订单
                            orderInfo.orderBaseInfo.isGrouponOrder = (orderInfo.orderBaseInfo.isGrouponOrder == 1);
                            //是拼图且订单状态为组团中和组团失败
                            orderInfo.orderBaseInfo.noSuccessGrouponOrder = (orderInfo.orderBaseInfo.isGrouponOrder == 1 && orderInfo.orderBaseInfo.grouponStatus != 2);

                            orderInfo.orderBaseInfo.isCross = (orderInfo.orderBaseInfo.isCross == 1);

                            //交易关闭原因字段是否为空
                            orderInfo.orderBaseInfo.isorderClose = !!orderInfo.orderBaseInfo.orderCloseReason;

                            //在线付款的 待付款、代付款取消订单、超时未支付  和货到付款的不显示付款时间
                            var hidePaytimeStatus = [10, 50, 60];
                            var inHidePaytimeStatus = $.inArray(parseInt(orderInfo.orderBaseInfo.subOrderStatus), hidePaytimeStatus) != -1;
                            orderInfo.orderBaseInfo.showPayTime = (!inHidePaytimeStatus && orderInfo.orderBaseInfo.payTypeStatus == 0);
                            if (orderInfo.orderBaseInfo.showPayTime) {
                                if (!!orderInfo.orderBaseInfo.payTime) {
                                    orderInfo.orderBaseInfo.payTime = Util.formatDate2(orderInfo.orderBaseInfo.payTime, 'yyyy-MM-dd hh:mm');
                                }
                            }

                            // orderInfo.payInfo = [
                            //     {name: "商品总额", value: "￥1.00"},
                            //     {name: "运费", value: "￥23.00"},
                            //     {name: "优惠", value: "￥3.00"},
                            //     {name: "实付款", value: "￥24.00"},
                            //     {name: "星链卡抵扣", value: "￥24.00"},
                            //     {name: "星链卡支付", value: "￥0.00"},
                            // ];
                            var sfkindex = '';
                            var payInfoLength = orderInfo.payInfo.length;
                            //处理人民币符号
                            $.map(orderInfo.payInfo, function (ls, index) {

                                var tmparr = ls.value.match(/[-]|\d+(.)+/g),
                                    str    = '';

                                if (tmparr) {
                                    if (tmparr.length == 1) {
                                        ls.showflag = false;
                                        str = tmparr[0];
                                    } else {
                                        ls.showflag = true;
                                        str = tmparr[1];
                                    }

                                }
                                ls.value = str;

                                ls.youhui = /优惠/.test(ls.name) ? 'cl-red' : '';
                                ls.shifukuan = /实付款/.test(ls.name) ? 'total' : '';
                                ls.islastitem = false;
                                if (/实付款/.test(ls.name)) {
                                    sfkindex = index;
                                    if (payInfoLength == index + 1) {
                                        ls.islastitem = true;
                                    }
                                }
                                if (!!sfkindex) {
                                    ls.maxsfkindex = index > sfkindex ? 'pay-items' : '';
                                }

                                return ls;
                            });

                            //设置按钮
                            var _status = orderInfo.orderBaseInfo.subOrderStatus;
                            if (_status == 90) {
                                orderInfo.orderBaseInfo.orderStatusName = '订单已删除';
                            }
                            //显示物流
                            orderInfo.showdelivery = !_shoptohome && (_status == 30 || _status == 40 || _status == 70 || _status == 80 );
                            console.log(_shoptohome)
                            console.log(orderInfo.showdelivery)
                            var shopInfo = {
                                shopType: orderInfo.orderBaseInfo.storeType,
                                shopId: orderInfo.orderBaseInfo.storeId
                            }
                            _this.setOperationBtn(_status, orderInfo.operaBtnData, orderInfo.orderBaseInfo.isshop, _ispickup, orderInfo.orderBaseInfo.isCross, shopInfo);

                            if (orderInfo.orderBaseInfo.isGrouponOrder) {
                                switch (parseInt(orderInfo.orderBaseInfo.grouponStatus)) {
                                    //组团中商品状态
                                    case 1:
                                        if (orderInfo.orderBaseInfo.orderStatus == '10') {
                                            //取消参团处理
                                            orderInfo.orderBaseInfo.isGrouponOrder = false;
                                            orderInfo.statusInfo = _this.setStatusInfo(parseInt(orderInfo.orderBaseInfo.subOrderStatus), orderInfo.orderBaseInfo.isshop, (orderInfo.orderBaseInfo.payTypeStatus == 1), _ispickup);
                                        } else {
                                            orderInfo.statusInfo = _this.setStatusInfo(parseInt(100), orderInfo.orderBaseInfo.isshop, (orderInfo.orderBaseInfo.payTypeStatus == 1), _ispickup);
                                        }
                                        break;
                                    //组团成功商品状态
                                    case 2 :
                                        // orderInfo.statusInfo = _this.setStatusInfo(parseInt(110), orderInfo.orderBaseInfo.isshop, (orderInfo.orderBaseInfo.payTypeStatus == 1), _ispickup);
                                        orderInfo.statusInfo = _this.setStatusInfo(parseInt(orderInfo.orderBaseInfo.subOrderStatus), orderInfo.orderBaseInfo.isshop, (orderInfo.orderBaseInfo.payTypeStatus == 1), _ispickup);
                                        break;
                                    //组团失败商品状态
                                    case 3:
                                        orderInfo.statusInfo = _this.setStatusInfo(parseInt(120), orderInfo.orderBaseInfo.isshop, (orderInfo.orderBaseInfo.payTypeStatus == 1), _ispickup);
                                        break;
                                    default:
                                        break;
                                }
                                console.log(orderInfo)

                            } else {
                                //设置状态 subOrderStatus
                                orderInfo.statusInfo = _this.setStatusInfo(parseInt(orderInfo.orderBaseInfo.subOrderStatus), orderInfo.orderBaseInfo.isshop, (orderInfo.orderBaseInfo.payTypeStatus == 1), _ispickup);
                            }

                            orderInfo.hasRefundStatusName = (!!orderInfo.refundStatusName);

                            //处理订单退货状态与名称
                            $.map(orderInfo.orderBaseInfo.goodsList, function (ls, index) {

                                //賬期支付訂單不顯示退貨退款按鈕
                                ls.isReshipApply = (ls.isReshipApply == 1 && !_this.isPayment);
                                ls.hasReshipStatusName = (!!ls.reshipStatusName && !_this.isPayment);

                                return ls;
                            });

                            //保存数据到localStorage
                            var localStorageData = {
                                deliverImg: orderInfo.orderBaseInfo.goodsList[0].goods.smallLogoUrl,
                                deliverName: orderInfo.deliveryInfo.deliveryName
                            }
                            localStorage.setItem('deliverData', JSON.stringify(localStorageData));
                            localStorage.setItem('detailData', JSON.stringify(orderInfo));

                            if (orderInfo.showdelivery) {
                                //获取最新物流信息

                                os.getDeliverflowinfo(params).then(function (data) {
                                    if (data.state == 0) {

                                        $.map(data.data.deliverFlowInfo, function (ls, index) {

                                            ls.occurTime = Util.formatDate2(ls.occurTime, 'yyyy-MM-dd hh:mm:ss');

                                            return ls;
                                        })
                                        if (data.data.deliverFlowInfo.length > 0) {
                                            var deliveryInfo = data.data.deliverFlowInfo[0];

                                            handlebarfn('#tmpl_wuliu', '#js_delivery', deliveryInfo, 'replace');

                                            _this.iscrollRefresh('orderrefresh');

                                        }

                                    } else {
                                        if (typeof data == "string") {
                                            data = JSON.parse(data);
                                        }
                                        jb.toastHandler(data.msg);
                                    }
                                })
                            }

                            handlebarfn('#tmpl_ordertail', '#cnt_orderdetail', orderInfo, 'replace');
                            handlebarfn('#tmpl_footerdetail', '#cnt_footerdetail', orderInfo, 'replace');

                            _this.orderDetailsEvent(orderInfo)

                        }
                        else {
                            jb.toastHandler(data.msg)
                        }
                    }).then(function () {

                    _this.iscrollRefresh(type);

                }).done(function () {
                    cp.loadingStep = 0;
                });
            },
            /**
             * 订单详情事件
             */
            orderDetailsEvent: function (orderInfo) {

                var _this = this;
                //显示 5 个
                _this.listfold(5);

                //绑定按钮点击事件
                _this.bindOperationFn();

                //选择订单隐藏操作按钮
                var fromRechargeOrderList = Util.getQuery('fromwhere');
                if (fromRechargeOrderList == 'feedbackHtml') {
                    $('.footer').addClass('none');
                    $('.js-tkbtn').addClass('none');
                }

                //跳转商品详情
                function toGoodsDetails($thisEle, needGrouponID) {

                    var _goodsid = $thisEle.data('goodsid').toString();
                    var _shopid = $thisEle.data('shopid').toString();
                    var _grouponid = $thisEle.data('grouponid').toString();

                    var _params = {
                        goodsid: _goodsid,
                        shopid: _shopid,
                        gid: ''
                    };
                    _params.gid = (needGrouponID === true) ? _grouponid : '';

                    var routerId = WEB_CONFIG.nativePage.clife.qyPlatformgoodsdetial.id;
                    jb.routerHandler(routerId, JSON.stringify(_params));

                }

                //查看物流
                $('#js_delivery').livequery(function () {
                    $(this).on('click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        var url = location.origin + '/life/assets/pages/track.html?';
                        window.location.href = url + Util.getQueryString();
                    });
                })
                //跳转商品详情
                $('.item-wrap li a').livequery(function () {
                    $(this).on('click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        $thisEle = $(this);

                        toGoodsDetails($thisEle, true);
                    });
                });
                //跳转店铺详情 item-wrap
                $('.item-wrap h4').livequery(function () {
                    var $thisEle = $(this);
                    //店铺关门跳空白页
                    _this.getStoreDetail($thisEle);

                });
                //重新开团跳转商品详情
                $('.js-kaituan').livequery(function () {
                    $(this).on('click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        var $thisEle = $(this).parents('.main_content').find('.item-wrap li a');

                        toGoodsDetails($thisEle);
                    });
                });

                //组团中，邀请好友
                $('.js-yaoqing').livequery(function () {
                    $(this).on('click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        var _shareinfo = orderInfo.orderBaseInfo.shareInfo;

                        var shareData = {
                            "id": _shareinfo.id || '',
                            "name": _shareinfo.name || '',
                            "title": _shareinfo.title || '',
                            "logo": _shareinfo.logo || '',
                            "content": _shareinfo.content || '',
                            "linkUrl": _shareinfo.linkUrl || '',
                            "codePicUrl": _shareinfo.codePicUrl || '',
                            "comName": _shareinfo.comName || '',
                            "comDomain": _shareinfo.comDomain || ''
                        }
                        // console.log(shareData)

                        jb.shareHandler(shareData);
                    });
                });
                //组团玩法跳转
                $('.js-getgroupplay').livequery(function () {
                    $(this).on('click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        var _params = {
                            url: location.origin + '/life/assets/pages/help/pingtuanwanfa.html'
                        };
                        jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(_params), _params.url)
                    });
                });
                //电子发票跳转
                $('.js-invoiceview').livequery(function () {
                    $(this).on('click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        //先判断发票是否生成，再进行跳转 == 2 未生成
                        var noInvoice = (orderInfo.receiptType.isViewBillDetail == 2);
                        if (noInvoice) {

                            jb.toastHandler('发票会在确认收货后的3个工作日内生成，请耐心等待');
                        } else {
                            var _params = {};
                            $.extend(_params, orderInfo.receiptType);

                            console.log(_params);
                            jb.routerHandler(WEB_CONFIG.nativePage.order.invoic.id, JSON.stringify(_params))
                        }

                    });
                });

                /**
                 * 修复tel:000-000-00 在iOS平台调不起电话问题(受iScroll影响)
                 */
                $('.busi-tel').livequery(function () {
                    $(this).find('a').on('click', function (e) {
                        e.preventDefault()
                        e.stopImmediatePropagation();

                        location.href = $(this).data('href')
                    })
                })

                //处理是否显示按钮区
                var _hasBtn = $('#cnt_footerdetail .footer').find('a').length;

                //非组团订单，
                if (!orderInfo.orderBaseInfo.noSuccessGrouponOrder) {

                    $('.contact-tel').css('margin-bottom', '0');

                    if (_hasBtn <= 0) {
                        $('.footer').addClass('none');
                    }
                }
            },

            /**
             * 物流详情
             * @return {[type]} [description]
             */
            getDeliverflowinfo: function () {

                var _this = this;

                var lsStr = localStorage.getItem('deliverData');

                function setHtmltoPage(goodsinfo) {
                    os.getDeliverflowinfo(params).then(function (data) {
                        console.log(data);
                        if (data.state == 0) {
                            data.data.orderTime = Util.formatDate2(data.data.orderTime, 'yyyy-MM-dd hh:mm:ss');
                            $.extend(data.data, JSON.parse(goodsinfo));
                            $.map(data.data.deliverFlowInfo, function (ls, index) {

                                ls.occurTime = Util.formatDate2(ls.occurTime, 'yyyy-MM-dd hh:mm:ss');

                                return ls;
                            })
                            handlebarfn('#tmpl_deliver', '#cnt_deliver', data.data);
                            //设置进度样式
                            var list     = $('.track-process').find('li'),
                                list_len = list.length;
                            if (list_len == 1) {
                                list.addClass('one-len');
                            }
                        } else {
                            if (typeof data == "string") {
                                data = JSON.parse(data);
                            }
                            jb.toastHandler(data.msg);
                        }
                    })
                }

                if (Util.getQuery('from') == 'list' && Util.getQuery('ordersn')) {
                    os.getOrderDetail(params)
                        .then(function (data) {
                            if (typeof data == 'string') {
                                data = JSON.parse(data);
                            }
                            jb.loadingHandler('hide');
                            if (data.state == 0) {
                                var orderInfo = data.data.orderInfo;
                                var localStorageData = {
                                    deliverImg: orderInfo.orderBaseInfo.goodsList[0].goods.smallLogoUrl,
                                    deliverName: orderInfo.deliveryInfo.deliveryName
                                }
                                lsStr = JSON.stringify(localStorageData);
                                setHtmltoPage(lsStr)
                            }
                        })
                } else {
                    setHtmltoPage(lsStr);
                }
            },

            /**
             * 支付结果
             * @return {[type]} [description]
             */
            getPayresult: function () {
                var listparam = {
                    type: Util.getQuery('type') || '1',
                    orderno: Util.getQuery('orderno') || ''
                };
                $.extend(params, listparam);
                if (!listparam.orderno) {
                    var data = {
                        data: {
                            statusIcon: '../../images/common_icon_pass@3x.png',
                            payStatusName: '感谢使用POS收银'
                        }
                    }
                    handlebarfn('#tmpl_nopaydetail', '#cnt_paydetail', data.data);
                } else {
                    os.getPayresult(params)
                        .then(function (data) {
                            if (typeof data == 'string') {
                                data = JSON.parse(data)
                            }
                            console.log(data)
                            if (data.state == 0) {
                                data.data.statusIcon = '../../images/common_icon_no_pass@3x.png';
                                if (data.data.payStatus == 40 || data.data.payStatus == 20) {
                                    data.data.statusIcon = '../../images/common_icon_pass@3x.png';
                                }
                                data.data.isPos = (listparam.type == 2);
                                data.data.showBuyBtn = (listparam.type == 1 && !!data.data.rechargeAD )

                                if (!!data.data.rechargeAD) {
                                    var _tmpRechargeAD = JSON.parse(data.data.rechargeAD);
                                    //换购按钮点击事件
                                    $('.opera-wrap a').on('click', function () {

                                        console.log(_tmpRechargeAD.targetConditon)
                                        jb.routerHandler(_tmpRechargeAD.targetConditon.tm, _tmpRechargeAD.targetConditon.tp, _tmpRechargeAD.targetConditon.tu, _tmpRechargeAD.targetConditon.tt);

                                    })
                                }
                                handlebarfn('#tmpl_paydetail', '#cnt_paydetail', data.data);
                                if (!data.data.isPos) {
                                    console.log('这是充值类订单')
                                }
                                if (data.data.isPos && (data.data.payStatus == 40 || data.data.payStatus == 20)) {
                                    return data.data
                                }

                            } else {
                                jb.toastHandler(data.msg)
                            }
                        })
                        .then(function (data) {
                            if (!data) {
                                return
                            }
                            var _params = {
                                shopid: data.shopId,
                                orderid: data.tradeNo,
                                ordermoney: data.totalFee
                            }

                            var isfrommsg = (Util.getQuery('from') == 'msg')
                            if (isfrommsg) {
                                data.couponStatus = 1;
                                handlebarfn('#tmpl_coupon', '#cnt_coupon', data, 'replace');
                            } else {
                                os.scanpaycouponinfo(_params).then(function (res) {
                                    console.log(res)
                                    if (typeof res == 'string') {
                                        res = JSON.parse(res)
                                    }
                                    if (res.state == 0) {
                                        $.extend(data, res.data)

                                        if (data.couponStatus == 3) {
                                            $('.pt-icon img').attr('src', '../../images/pay/common_icon_pass_coin@3x.png');
                                            $('body').addClass('pay-bg');
                                            $('.pay-main').addClass('for-bg');
                                        }
                                        handlebarfn('#tmpl_coupon', '#cnt_coupon', data, 'replace');

                                        $('#cnt_coupon').on('click', '#refreshBtn', function (e) {
                                            e.preventDefault();
                                            e.stopImmediatePropagation();
                                            window.location.reload();
                                        })
                                        $('#cnt_coupon').on('click', '.pi-coupon dt', function (e) {
                                            //跳转店铺首页
                                            e.preventDefault();
                                            e.stopImmediatePropagation();
                                            //供应商店铺详情 20708
                                            jb.routerHandler(WEB_CONFIG.nativePage.shop.supplierShop.id, JSON.stringify({'shopid': data.couponSchema.shopId}))
                                        })
                                        $('#cnt_coupon').on('click', '#getCouponBtn', function (e) {
                                            //立即领取与去使用
                                            e.preventDefault();
                                            e.stopImmediatePropagation();
                                            var $this = $(this);
                                            var _status = $this.data('status')
                                            if (_status == 1) {
                                                //立即领取
                                                var getcouponParams = {
                                                    shopid: data.shopId,
                                                    couponid: data.couponSchema.couponId,
                                                    orderid: data.tradeNo
                                                }
                                                os.scanpayreceivecoupon(getcouponParams).then(function (res) {
                                                    if (typeof res == 'string') {
                                                        res = JSON.parse(res)
                                                    }
                                                    if (res.state == 0) {
                                                        jb.toastHandler('领取成功');
                                                        $('.js-txt').html('成功领取' + data.couponSchema.couponNum + '张优惠券')
                                                        $this.html('去使用').data('status', 2)

                                                    } else {
                                                        jb.toastHandler(res.msg)
                                                    }
                                                })

                                            } else {
                                                //去使用
                                                // jb.routerHandler(WEB_CONFIG.nativePage.shop.supplierShop.id, JSON.stringify({'shopid': data.couponSchema.shopId}))
                                                /**
                                                 a、 生效时间（预热期）：9月27日0:00~10月2日添加到日历24:00
                                                 跳转链接：https://h5.380star.com/yms/huodong/90650/assets/pages/index.html?env=idc
                                                 b、生效时间（三好节期间）：10月3日0:00-10月25日24:00
                                                 跳转链接：https://h5.380star.com/yms/huodong/90630/assets/pages/index.html?env=idc
                                                 */
                                                var params = {
                                                    url: 'https://h5.380star.com/yms/huodong/90630/assets/pages/index.html?env=idc'
                                                };
                                                jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params), params.url);

                                            }
                                        })
                                    } else {
                                        jb.toastHandler(data.msg)
                                    }
                                })

                            }

                        })
                }
            },

            /**
             * 获取余额
             * @return {[type]} [description]
             */
            getMybalance: function () {
                os.getMybalance(params)
                    .then(function (data) {
                        console.log(data);
                        if (data.state == 0) {
                            mybalance = data.data.myBalance;
                        } else {
                            if (typeof data == "string") {
                                data = JSON.parse(data);
                            }
                            jb.toastHandler(data.msg);
                        }
                    })
            },

            /**
             * 获取选中订单
             */
            getSelectedOrders: function () {

                var $items = $('input[name="post-check"]:checked');

                var selectedOrder = [],
                    invoiceArr    = [],
                    isToHomearr   = [],
                    isCrossarr    = [],
                    hasInvoice;

                $.each($items, function (index, item) {
                    var $this = $(item);
                    selectedOrder.push(item.id);
                    invoiceArr.push($this.data('hasinvoice'));
                    isToHomearr.push($this.data('istohome'));
                    isCrossarr.push($this.data('iscross'))

                });

                hasInvoice = ($.inArray(1, invoiceArr) != -1 || $.inArray(2, invoiceArr) != -1) ? 1 : 0

                //如果有店铺订单或有海淘商品 ， 用没有余额的支付组件
                var usebalance = $.inArray(true, isToHomearr) == -1;//true:没有店铺订单 ,可以用余额支付
                console.log(isCrossarr)
                var hasCross = ($.inArray(true, isCrossarr) != -1) ? 1 : 0;
                params.ordersns = selectedOrder.join(',');

                if (clickstatus && selectedOrder.length > 0) {
                    console.log(params)
                    jb.loadingHandler('show');

                    os.setPayorder(params)
                        .then(function (data) {
                            if (typeof data == "string") {
                                data = JSON.parse(data);
                            }
                            if (data.state == 0) {
                                var _tmpcallback = {
                                    callhandler: 'paymentresult',
                                    callbackstr: ''
                                }
                                $.extend(data.data, _tmpcallback)
                                $.extend(data.data, {'hasInvoice': hasInvoice, 'hasCross': hasCross})
                                if (!usebalance) {
                                    jb.nobalancePayment(data.data)
                                } else {
                                    jb.balancePayment(data.data)
                                }

                            } else {
                                if (typeof data == "string") {
                                    data = JSON.parse(data);
                                }
                                jb.toastHandler(data.msg);
                            }
                        })

                } else {
                    jb.toastHandler('请选择需要支付的订单')
                }
                clickstatus = false;
                setTimeout(function () {
                    clickstatus = true;
                }, 1000)
            },

            /**
             * 店铺跳转
             */
            getStoreDetail: function ($thisEle) {
                $thisEle.on('tap', function (e) {

                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var storeid   = $thisEle.data('storeid') + '',
                        storetype = $thisEle.data('storetype') + '';
                    var _params = {
                        shopid: storeid
                    }

                    if (storeid == 'undefined') return;

                    console.log(_params);
                    // console.log(storetype)
                    if (storetype == 3) {
                        jb.routerHandler(WEB_CONFIG.nativePage.shop.supplierShop.id, JSON.stringify(_params))
                    } else {
                        jb.routerHandler(WEB_CONFIG.nativePage.shop.shopDetail.id, JSON.stringify(_params))
                    }

                });
            },

            /**
             * 订单详情 设置状态图标文字
             */
            setStatusInfo: function (status, type, shoptohome, ispickup) {
                // var statusInfo={
                //     className:'',
                //     statusText:''
                // }
                var _this = this;
                var statusInfo = [];

                var orderIconStatus = {
                    //待付款    ''
                    dfk: {
                        currentClass: '',
                        className: 'dfk',
                        statusText: '待付款',
                        imgIcon: 'order_icon_daizhifu_2@3x.png'
                    },
                    //待发货    ''
                    dfh: {
                        currentClass: '',
                        className: 'dfh',
                        statusText: '待发货',
                        imgIcon: 'order_icon_daifahuo_2@3x.png'
                    },
                    //待签收    ''
                    dqs: {
                        currentClass: '',
                        className: 'dqs',
                        statusText: '待签收',
                        imgIcon: 'order_icon_peisongzhong_2@3x.png'
                    },
                    //交易成功   ''    curr-stat
                    jycg: {
                        currentClass: '',
                        className: 'jycg',
                        statusText: '交易成功',
                        imgIcon: 'order_icon_jiaoyichenggong_2@3x.png'
                    },
                    //交易关闭         curr-stat
                    jygb: {
                        currentClass: 'curr-stat',
                        className: 'jygb',
                        statusText: '交易关闭',
                        imgIcon: 'order_icon_jiaoyiguanbi_2@3x.png'
                    },
                    //待提货    ''     curr-stat
                    dth: {
                        currentClass: '',
                        className: 'dth',
                        statusText: '待提货',
                        imgIcon: 'order_icon_daishouhuo_2@3x.png'
                    },
                    //邀请好友   ''    curr-stat
                    yqhy: {
                        currentClass: '',
                        className: 'yqhy',
                        statusText: '邀请好友',
                        imgIcon: 'order_icon_yaoqinghaoyou_2@3x.png'
                    },
                    //组团成功    ''  curr-stat
                    ztcg: {
                        currentClass: '',
                        className: 'jycg',
                        statusText: '组团成功',
                        imgIcon: 'order_icon_zutuanchenggong_2@3x.png'
                    },
                    //组团失败        curr-stat
                    ztsb: {
                        currentClass: 'curr-stat',
                        className: 'jygb',
                        statusText: '组团失败',
                        imgIcon: 'order_icon_zutuanshibai_2@3x.png'
                    },

                    //待店主接单      ''
                    ddzjd: {
                        currentClass: '',
                        className: 'djd',
                        statusText: '待店主接单',
                        imgIcon: 'order_icon_daijiedan_2@3x.png'
                    },
                    //待配送          ''
                    dps: {
                        currentClass: '',
                        className: 'dsh',
                        statusText: '待配送',
                        imgIcon: 'order_icon_peisongzhong_2@3x.png'
                    },
                    //配送中          curr-stat
                    dsh: {
                        currentClass: 'curr-stat',
                        className: 'dsh',
                        statusText: '待收货',
                        imgIcon: 'order_icon_daishouhuo_2@3x.png'
                    },
                    //企業生活  待審核
                    qydsh: {
                        currentClass: '',
                        className: 'dshh',
                        statusText: '待审核',
                        imgIcon: 'order_icon_daishenhe_2@3x.png'
                    }
                };
                switch (status) {
                    case 10:
                        //待付款
                        statusInfo = [orderIconStatus.dfk];
                        if (shoptohome) {//货到付款
                            statusInfo = [];
                        }
                        break;
                    case 15:
                        //15 待审核 16审核不通过（企业生活订单）
                        statusInfo = [orderIconStatus.qydsh]
                        break;
                    case 16:
                        //企业生活订单账期支付，审核不通过
                        orderIconStatus.jygb.statusText = '审核不通过';
                        statusInfo = [orderIconStatus.jygb];
                        break;
                    case 20:
                        //待发货 待接单
                        if (!type) { //平台订单
                            statusInfo = [orderIconStatus.dfh];
                            if (ispickup) {
                                statusInfo = [orderIconStatus.dth];
                            }
                        } else {
                            statusInfo = [orderIconStatus.ddzjd];
                        }
                        break;
                    case 25:
                        if (!type) { //平台订单
                            statusInfo = [orderIconStatus.dqs];
                            if (ispickup) {
                                statusInfo = [orderIconStatus.dth];
                            }
                        } else {
                            statusInfo = [orderIconStatus.dps];
                            if (ispickup) {
                                statusInfo = [orderIconStatus.dth];
                            }
                        }
                        break;
                    //已接单
                    case 30:
                        //已发货  配送中
                        if (!type) { //平台订单
                            statusInfo = [orderIconStatus.dqs];
                            if (ispickup) {
                                statusInfo = [orderIconStatus.dth];
                            }
                        } else {
                            statusInfo = [orderIconStatus.dsh];
                            if (ispickup) {
                                statusInfo = [orderIconStatus.dth];
                            }
                        }
                        break;
                    case 40:
                        //交易成功 已送达
                        statusInfo = [orderIconStatus.jycg];
                        break;
                    case 50:
                    //交易关闭 ： 待付款时取消订单
                    case 51:
                    //交易关闭 ： 卖家取消订单
                    case 52:
                    //交易关闭 ： 卖家超时未接单
                    case 53:
                    //交易关闭 ：
                    case 60:
                    //交易关闭 ： 超时未支付
                    case 70:
                    //交易关闭 ： 退款成功
                    case 80:
                        //交易关闭 ： 全部商品退货成功
                        statusInfo = [orderIconStatus.jygb];
                        break;
                    case 90:
                        //删除
                        break;
                    case 100:
                        //组团中
                        statusInfo = [orderIconStatus.yqhy];
                        break;
                    case 110:
                        //组团成功
                        statusInfo = [orderIconStatus.dfh];
                        break;
                    case 120:
                        //组团失败
                        statusInfo = [orderIconStatus.ztsb];
                        break;
                }

                statusInfo[0].imgIcon = '../../images/img/' + statusInfo[0].imgIcon;

                return statusInfo
            },

            /**
             * 绑定操作按钮事件
             */
            bindOperationFn: function () {
                var _this = this;
                $('.opera-wrap .comm-btn').livequery(function () {
                        $(this).on('click', function (e) {
                                e.preventDefault();
                                e.stopImmediatePropagation();
                                var $this = $(this);

                                /**
                                 * tradeNo 交易流水号  orderSn 订单号 totalAmount  订单待付款 isToHome 是否店铺订单
                                 * totalOrderFee 订单总金额  hasInvoice 发票种类
                                 */
                                var tradeNo, orderSn, totalAmount, isToHome, isGrouponOrder, isCross, totalOrderFee, hasInvoice,
                                    storeId, orderStatus, payTypeStatus;

                                var opraId = $this.data('type');
                                var detailinfostr = localStorage.getItem('detailData');
                                var detailobj = JSON.parse(detailinfostr);

                                //判断是否在详情页
                                var locationhref = location.pathname;
                                var patt = new RegExp('qyorder-details.html');
                                var isDetailPage = patt.test(locationhref);

                                if (isDetailPage) {
                                    tradeNo = detailobj.orderBaseInfo.tradeNo;
                                    orderSn = detailobj.orderBaseInfo.orderSN;
                                    totalAmount = detailobj.orderBaseInfo.totalAmount; //传订单实付金额
                                    totalOrderFee = detailobj.orderBaseInfo.totalOrderFee; //传订单总金额
                                    maxOrderFefund = detailobj.orderBaseInfo.maxOrderFefund; //订单可退最大金额
                                    deliveryFee = detailobj.orderBaseInfo.deliveryFee;  // 发货运费
                                    isToHome = (detailobj.orderBaseInfo.isToHome == 1);
                                    hasInvoice = (detailobj.receiptType.type == 0) ? 0 : 1;
                                    storeId = detailobj.orderBaseInfo.storeId;
                                    payTypeStatus = detailobj.orderBaseInfo.payTypeStatus;
                                    orderStatus = detailobj.orderBaseInfo.orderStatus;
                                    isCross = (detailobj.orderBaseInfo.isCross == 1);

                                } else {
                                    tradeNo = $this.parent().data('tradeno') + '';
                                    orderSn = $this.parent().data('ordersn') + '';
                                    totalAmount = $(this).parent().data('totalamount') + '';
                                    totalOrderFee = $(this).parent().data('totalorderfee') + '';
                                    maxOrderFefund = $(this).parent().data('maxorderfefund') + '';
                                    deliveryFee = $(this).parent().data('deliveryfee') + '';
                                    isToHome = ($(this).parent().data('istohome') + '' == 'true');
                                    hasInvoice = ($(this).parent().data('hasinvoice') == 0) ? 0 : 1;
                                    storeId = $this.parent().parent().find('h4').data('storeid') + '';
                                    isGrouponOrder = $(this).parent().data('isgrouponorder');
                                    payTypeStatus = $(this).parent().data('paytypestatus') + '';
                                    orderStatus = $(this).parent().data('orderstatus') + '';
                                    isCross = ($(this).parent().data('iscross') == 1);
                                }
                                if (clickstatus) {
                                    if (opraId == 1) {
                                        //取消订单
                                        params.ordersn = orderSn;
                                        $.dialog({
                                            type: 'confirm',
                                            subtitle: '您将取消订单',
                                            onClickOk: function () {

                                                os.cancelOrder(params).then(function (data) {
                                                    if (typeof data == 'string') {
                                                        data = $.parseJSON(data);

                                                    }
                                                    console.log(data);
                                                    if (data.state == 0) {
                                                        if (isDetailPage) {
                                                            jb.postNotification('refreshListen')
                                                        }
                                                        if (isToHome && orderStatus == 20 && payTypeStatus == 0) {
                                                            jb.toastHandler('订单已取消，退款将在7个工作日内原路退回');
                                                        }
                                                        setTimeout(function () {
                                                            window.location.href = window.location.href;
                                                            window.location.reload(true);
                                                        }, 1500)

                                                    } else {
                                                        if (typeof data == "string") {
                                                            data = JSON.parse(data);
                                                        }
                                                        jb.toastHandler(data.msg);
                                                    }
                                                })
                                            }
                                        })
                                    }
                                    if (opraId == 2) {
                                        //立即付款
                                        //跳app  刘鹏

                                        jb.loadingHandler('show');
                                        // 先调用立即付款接口/buyer/order/payorder.do
                                        params.ordersns = orderSn;
                                        console.log(params)

                                        os.setPayorder(params)
                                            .then(function (data) {
                                                if (typeof data == "string") {
                                                    data = JSON.parse(data);
                                                }
                                                console.log(data)
                                                if (data.state == 0) {
                                                    var _tmpcallback = {
                                                        callhandler: 'paymentresult',
                                                        callbackstr: ''
                                                    }
                                                    $.extend(data.data, _tmpcallback)
                                                    $.extend(data.data, {'hasInvoice': hasInvoice, 'hasCross': isCross})
                                                    console.log(_this.isPayment,isToHome);

                                                    //账期支付调起账期支付handler
                                                    if (_this.isPayment) {

                                                        $.extend(data.data, {'payChannel':_this.payChannel});
                                                        jb.accountPayment(data.data)

                                                    } else {
                                                        if (isToHome) {
                                                            jb.nobalancePayment(data.data)
                                                        } else {
                                                            jb.balancePayment(data.data)
                                                        }
                                                    }

                                                } else {
                                                    if (typeof data == "string") {
                                                        data = JSON.parse(data);
                                                    }
                                                    jb.toastHandler(data.msg);
                                                }
                                            })

                                    }
                                    if (opraId == 3) {
                                        //申请退款

                                        var _refundStatusName = $(this).data('refundstatusname') + '';

                                        //0.00 => 0
                                        var reg = /^(?:(?!0\.00$))[\d\D]*/;
                                        if (!reg.test(deliveryFee)) deliveryFee = '0';

                                        var toPostDetails = /退款中|退款成功/.test(_refundStatusName);

                                        if (_refundStatusName == 'undefined') {

                                            //跳app
                                            var _tp = {
                                                ordersn: orderSn + '',
                                                totalAmount: maxOrderFefund + '',
                                                deliveryFee: deliveryFee + '',
                                                type: 'ordertype'
                                            }

                                            console.log(_tp)
                                            jb.routerHandler(WEB_CONFIG.nativePage.order.returnmoney.id, JSON.stringify(_tp));
                                        } else {
                                            if (_refundStatusName == '退款') {//退款 （退款被拒按钮恢复为退款）
                                                //跳app
                                                var _tp = {
                                                    ordersn: orderSn + '',
                                                    totalAmount: maxOrderFefund + '',
                                                    deliveryFee: deliveryFee + '',
                                                    type: 'ordertype'
                                                }
                                                console.log(_tp)
                                                jb.routerHandler(WEB_CONFIG.nativePage.order.returnmoney.id, JSON.stringify(_tp));

                                            } else { //退款中 退款成功
                                                //  跳售后详情
                                                var _postsaledsn = $(this).data('postsaledsn');
                                                var url = location.origin + '/life/assets/pages/postorder-detail.html?postsaledsn=' + _postsaledsn + '&type=1';

                                                console.log(url);
                                                var tmpparams = {
                                                    url: url
                                                }

                                                jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);

                                            }

                                        }
                                    }
                                    if (opraId == 4) {
                                        //确认收货
                                        var _params = {
                                            ordersns: orderSn,
                                            vk: ''
                                        };
                                        $.extend(params, _params);
                                        $.dialog({
                                            type: 'confirm',
                                            subtitle: '确定已收到商品',
                                            onClickOk: function () {
                                                os.comfirmReceipt(params).then(function (data) {
                                                    if (data.state == 0) {

                                                        window.location.href = window.location.href;
                                                        window.location.reload(true);
                                                    } else {
                                                        if (typeof data == "string") {
                                                            data = JSON.parse(data);
                                                        }
                                                        jb.toastHandler(data.msg);
                                                    }
                                                })

                                            }
                                        })
                                    }
                                    if (opraId == 5) {
                                        //订单投诉
                                        // var _tp = {
                                        //     ordersn: orderSn,
                                        //     type: '2'
                                        // };
                                        //var returnUrl = encodeURIComponent(location.href);
                                        //console.log(detailobj);
                                        //jb.routerHandler(WEB_CONFIG.nativePage.order.complain.id, JSON.stringify(_tp))
                                        if (isDetailPage) {
                                            //订单详情页
                                            var url = location.origin + '/life/assets/pages/service-in.html?ordersn=' + orderSn + '&type=2&phone=' + detailobj.receiverInfo.phone;
                                            console.log(url);
                                            var tmpparams = {
                                                url: url
                                            }
                                            jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);

                                            //window.location.href = './service-in.html?ordersn=' + orderSn + '&type=2&phone=' + detailobj.receiverInfo.phone + '&' + Util.getQueryString()+'&returnUrl='+returnUrl;
                                        } else {
                                            //订单列表页
                                            var _ordersn = $(this).parent().data('ordersn');
                                            var url = location.origin + '/life/assets/pages/service-in.html?ordersn=' + _ordersn + '&type=2';
                                            console.log(url);
                                            var tmpparams = {
                                                url: url
                                            }
                                            jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);
                                            //window.location.href = './service-in.html?ordersn=' + _ordersn + '&type=2&phone=&' + Util.getQueryString()+'&returnUrl='+returnUrl;
                                        }

                                    }
                                    if (opraId == 6) {
                                        //再次购买
                                        //跳app 瑞勤
                                        var _ordersn;
                                        var _params = {
                                            ordersn: orderSn,
                                            shopid: storeId,
                                            longitude: Util.getQuery('longitude'),
                                            latitude: Util.getQuery('latitude'),
                                            source: 4
                                        };
                                        $.extend(params, _params);
                                        jb.loadingHandler('show');

                                        function postGoodsTocart() {

                                            os.batchupdateCartP(params)
                                                .then(function (data) {
                                                    if (data.state == 0) {

                                                        var url = location.origin + '/life/assets/pages/clife/cart.html';
                                                        var params = {
                                                            url: url
                                                        };
                                                        jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params), url);
                                                    } else {
                                                        if (typeof data == "string") {
                                                            data = JSON.parse(data);
                                                        }
                                                        jb.toastHandler(data.msg);
                                                    }

                                                })

                                        }

                                        postGoodsTocart()

                                    }
                                    if (opraId == 7) {
                                        //删除订单
                                        var _params = {
                                            ordersns: orderSn,
                                            vk: ''
                                        };
                                        $.extend(params, _params);
                                        $.dialog({
                                            type: 'confirm',
                                            subtitle: '您确定要否删除订单吗？',
                                            onClickOk: function () {
                                                os.deleteOrder(params).then(function (data) {
                                                    if (data.state == 0) {
                                                        if (isDetailPage) {
                                                            //在详情页
                                                            jb.postNotification('refreshListen')
                                                            jb.historygoHandler('native');

                                                        } else {
                                                            //在列表页
                                                            $this.parents('.item-wrap').remove();
                                                            var opencntid = $('#js_tabcnt').find('.selected').attr('data-tab');
                                                            window.ListScrollers[opencntid].iscroll.refresh();
                                                        }
                                                    } else {

                                                        $.dialog({
                                                            subtitle: '删除订单失败',
                                                            autoClose: 1500
                                                        })
                                                    }
                                                })

                                            }
                                        })

                                    }
                                    if (opraId == 8) {
                                        //退货申请
                                        //跳app
                                        var goodsid = $this.data('goodsid') + '';
                                        var specid = $this.data('specid') + '';
                                        var _reshipstatusname = $this.data('reshipstatusname') + '';
                                        var goodsarr = detailobj.orderBaseInfo.goodsList;

                                        var goodsinfo = goodsarr.filter(function (item) {

                                            return item.goods.goodsId == goodsid && item.goods.specId == specid;
                                        });

                                        var _tp1 = {
                                            ordersn: detailobj.orderBaseInfo.orderSN + '', //订单号
                                            goodsId: goodsid + '', //商品id
                                            specId: goodsinfo[0].goods.specId + '', //规格id
                                            specName: goodsinfo[0].goods.specName + '',
                                            goodsName: goodsinfo[0].goods.name + '', //商品名称
                                            goodsCount: goodsinfo[0].count + '', //商品数量
                                            logoUrl: goodsinfo[0].goods.smallLogoUrl + '', //商品图片
                                            goodsPrice: goodsinfo[0].goods.price + '', //商品单价
                                            isReshipQuantity: goodsinfo[0].isReshipQuantity + '', //可退货数量
                                            maxGoodsRefund: goodsinfo[0].maxGoodsRefund + '', //商品最大可退金额
                                            perGoodsRefund: goodsinfo[0].perGoodsRefund + '', //单个商品可退金额
                                            goodsDelivery: goodsinfo[0].goodsDelivery + '',   //商品可退运费
                                            type: 'ordertype' //来自订单标识
                                        }
                                        console.log(_reshipstatusname)
                                        var toPostDetails = /退款中|退款成功/.test(_reshipstatusname);

                                        if (_reshipstatusname == 'undefined') {

                                            console.log(_tp1);
                                            jb.routerHandler(WEB_CONFIG.nativePage.order.returngoods.id, JSON.stringify(_tp1));

                                        } else {

                                            // fixReshipstatus 10 跳 app  20 跳售后详情
                                            if (_reshipstatusname == '退货退款') {
                                                //app
                                                console.log(_tp1);
                                                jb.routerHandler(WEB_CONFIG.nativePage.order.returngoods.id, JSON.stringify(_tp1));

                                            } else {

                                                //售后详情
                                                var _postsaledsn = $(this).data('postsaledsn');
                                                var url = location.origin + '/life/assets/pages/postorder-detail.html?postsaledsn=' + _postsaledsn + '&type=2';

                                                console.log(url);
                                                var tmpparams = {
                                                    url: url
                                                }

                                                jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);

                                            }

                                        }
                                    }
                                    if (opraId == 9) {
                                        //查看物流
                                        var url = location.origin + '/life/assets/pages/track.html?ordersn=' + orderSn + '&from=list';
                                        console.log(url);
                                        var tmpparams = {
                                            url: url
                                        }
                                        jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);

                                    }
                                    if (opraId == 10) {

                                        //开团中 邀请好友 弹出浮层

                                        var $thisEle = $(this).parents('.order-list').find('.item-show .js-goodsDetail');

                                        var _shareinfo = $thisEle.data('shareinfo') || {};

                                        var shareData = {
                                            "id": _shareinfo.id || '',
                                            "name": _shareinfo.name || '',
                                            "title": _shareinfo.title || '',
                                            "logo": _shareinfo.logo || '',
                                            "content": _shareinfo.content || '',
                                            "linkUrl": _shareinfo.linkUrl || '',
                                            "codePicUrl": _shareinfo.codePicUrl || '',
                                            "comName": _shareinfo.comName || '',
                                            "comDomain": _shareinfo.comDomain || ''
                                        }
                                        // console.log(shareData)

                                        jb.shareHandler(shareData);
                                    }
                                    if (opraId == 11) {
                                        //重新开团，跳商品详情页
                                        //跳转商品详情
                                        var $thisEle = $(this).parents('.order-list').find('.item-show .js-goodsDetail');

                                        var _goodsid = $thisEle.data('goodsid').toString();
                                        var _shopid = $thisEle.data('shopid').toString();
                                        var _grouponid = $thisEle.data('grouponid').toString();

                                        var _params = {
                                            goodsid: _goodsid,
                                            shopid: _shopid
                                        }

                                        var routerId = WEB_CONFIG.nativePage.clife.qyPlatformgoodsdetial.id;
                                        console.log(isToHome)
                                        jb.routerHandler(routerId, JSON.stringify(_params));

                                    }
                                }
                                clickstatus = false;

                                //日志收集
                                var ctm = $this.data('ctm');
                                var ctmg = $this.data('ctmg');
                                ctm && webCTM.ctm(jb, ctm);
                                ctmg && webCTM.ctm(jb, ctmg);

                                setTimeout(function () {
                                    clickstatus = true;
                                }, 1000)
                            }
                        );
                    }
                );
            },

            /**
             * 根据订单状态设置操作按钮
             * status:状态
             * resultObj：填充到页面的json对象
             * isToHome：是否是店铺订单
             * ispickup：是否是自提
             */
            setOperationBtn: function (status, resultObj, isToHome, ispickup, isCross, _shopInfo) {

                var orderSN = Util.getQuery('ordersn');

                // console.log(resultObj)
                //根据订单状态设置显示的图标以及按钮的文字 status
                //按钮说明====》1：取消订单；2：立即付款；3：申请退款；4：确认收货；5：评价晒单；6：再次购买；7：删除订单;8:退货申请；9:查看物流
                //isToHome： 是否店铺订单
                //状态对应的大icon
                //operaBtnData.orderStatusIcon
                //状态对应第一个按钮的id 和名字
                //operaBtnData.optId  & operaBtnData.optText
                //是否是着色按钮
                //operaBtnData.orderBaseInfo.hasCurr
                //状态对应着色按钮的id 和名字
                //operaBtnData.optCurrId  & operaBtnData.optCurrText
                // console.log(status)
                var operaBtnData = {
                    orderStatusIcon: '',
                    optId: '',
                    optText: '',
                    hasBtn: true,
                    hasCurr: false,
                    optCurrId: '',
                    optCurrText: '',
                    ctmo1: '',//日志采集-立即付款 100010  日志采集-再次购买  100012
                    ctmo2: '',//日志采集-取消订单 100011
                    ctmo3: '',//立即付款  100061
                    ctmo4: '',//取消订单  100062
                }
                if (status == '10') { //待付款

                    operaBtnData.orderStatusIcon = '../../images/icon_oder_pay@3x.png';
                    //第一个按钮
                    operaBtnData.optId = 1;
                    operaBtnData.optText = '取消订单';
                    operaBtnData.ctmo2 = webCTM.setCTMParams('orderModule/o2', 0, 'ORDER', {orderSN: orderSN});

                    //第二个按钮
                    operaBtnData.hasCurr = true;
                    operaBtnData.optCurrId = 2;
                    operaBtnData.optCurrText = '立即付款';
                    operaBtnData.ctmo1 = webCTM.setCTMParams('orderModule/o1', 0, 'ORDER', {orderSN: orderSN});

                    if (!isToHome || isCross) {
                        //立即付款
                        operaBtnData.ctmo3 = webCTM.setCTMParams('goodsDetailsModule/g1', 0, 'SHOP', _shopInfo);
                        //取消订单
                        operaBtnData.ctmo4 = webCTM.setCTMParams('goodsDetailsModule/g2', 0, 'SHOP', _shopInfo);
                    }

                } else if (status == '15') { //企業生活訂單 待審核狀態

                    //第一个按钮
                    operaBtnData.optId = 1;
                    operaBtnData.optText = '取消订单';
                    operaBtnData.ctmo2 = webCTM.setCTMParams('orderModule/o2', 0, 'ORDER', {orderSN: orderSN});

                    //第二个按钮
                    operaBtnData.hasCurr = false;

                } else if (status == '20') { //待发货

                    operaBtnData.orderStatusIcon = '../../images/icon_oder_wait@3x.png';
                    //第一个按钮
                    //operaBtnData.optId = 3;
                    //operaBtnData.optText = '申请退款';
                    //console.log(type);
                    //第二个按钮
                    operaBtnData.hasCurr = false;
                    operaBtnData.hasBtn = false;
                    if (isToHome) {
                        operaBtnData.hasBtn = true;
                        operaBtnData.optId = 1;
                        operaBtnData.optText = '取消订单';
                    }

                } else if (status == '25') { //店铺已接单
                    operaBtnData.orderStatusIcon = '../../images/icon_oder_wait@3x.png';
                    //第一个按钮
                    //operaBtnData.optId = 3;
                    //operaBtnData.optText = '申请退款';
                    //第二个按钮
                    operaBtnData.hasCurr = false;
                    operaBtnData.hasBtn = false;

                } else if (status == '30') { //待收货
                    operaBtnData.orderStatusIcon = '../../images/icon_oder_delivery@3x.png';
                    //第一个按钮
                    operaBtnData.optId = 5;
                    operaBtnData.optText = '订单投诉';
                    //第二个按钮
                    operaBtnData.hasCurr = true;
                    operaBtnData.optCurrId = 4;
                    operaBtnData.optCurrText = '确认收货';
                    if (ispickup) {
                        operaBtnData.optCurrText = '确认提货';
                    }

                } else if (status == '40') { //交易成功
                    operaBtnData.orderStatusIcon = '../../images/icon_oder_successful@3x.png';
                    //第一个按钮
                    operaBtnData.optId = 5;
                    operaBtnData.optText = '订单投诉';
                    //第二个按钮
                    operaBtnData.hasCurr = true;
                    operaBtnData.optCurrId = 6;
                    operaBtnData.optCurrText = '再次购买';
                    operaBtnData.ctmo1 = webCTM.setCTMParams('orderModule/o3', 0, 'ORDER', {orderSN: orderSN});

                } else if (status == '50') { //交易关闭
                    operaBtnData.orderStatusIcon = '../../images/icon_oder_close@3x.png';
                    //第一个按钮
                    operaBtnData.optId = 7;
                    operaBtnData.optText = '删除订单';
                    //第二个按钮
                    operaBtnData.hasCurr = true;
                    operaBtnData.optCurrId = 6;
                    operaBtnData.optCurrText = '再次购买';

                    operaBtnData.ctmo1 = webCTM.setCTMParams('orderModule/o3', 0, 'ORDER', {orderSN: orderSN});

                } else if (status == '90') {
                    //已删除
                    operaBtnData.orderStatusIcon = '../../images/common_icon_no_pass@3x.png';
                    //第一个按钮
                    //operaBtnData.optId = 3;
                    //operaBtnData.optText = '申请退款';
                    //第二个按钮
                    operaBtnData.hasCurr = false;
                    operaBtnData.hasBtn = false;
                } else {//交易关闭
                    operaBtnData.orderStatusIcon = '../../images/icon_oder_close@3x.png';
                    //第一个按钮
                    operaBtnData.optId = 7;
                    operaBtnData.optText = '删除订单';
                    //第二个按钮
                    operaBtnData.hasCurr = true;
                    operaBtnData.optCurrId = 6;
                    operaBtnData.optCurrText = '再次购买';
                    operaBtnData.ctmo1 = webCTM.setCTMParams('orderModule/o3', 0, 'ORDER', {orderSN: orderSN});

                }

                $.extend(resultObj, operaBtnData);
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
             * 下拉刷新
             */
            refreshList: function (type) {
                console.log(type)
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
                cp.pullUpEl.hide();

                if (type == 'status1') {
                    //_this.resetSelectAll()
                }
                if (type == 'orderrefresh') {
                    _this.getDetail(type)
                    // window.location.href = window.location.href;
                } else if (type == 'reorderrefresh') {
                    _this.getRechargeDetail(type)
                } else {
                    _this.getOrderList(type);
                }
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
                                    //    window.ListScrollers[type].refresh();
                                    //     if (type == 'status1') {
                                    //         window.ListScrollers[type].maxScrollY = window.ListScrollers[type].maxScrollY - 56
                                    //     }
                                    // }, 1000)

                                }
                                temp2.loadingStep = 2;
                                if (type == 'orderrefresh' || type == 'reorderrefresh') {
                                    return
                                } else {
                                    _this.getOrderList(type);
                                }
                                console.log(type)
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

                document.addEventListener('touchmove', function (e) {
                    e.preventDefault();
                }, false);

            },

            /**
             * 注册native调用函数
             * @return {[type]} [description]
             */
            registerJsHandler: function () {

                var _this = this;
                //判断是否在详情页
                var locationhref = location.pathname;
                var patt = new RegExp('qyorder-details.html');
                var isDetailPage = patt.test(locationhref);
                window.WebViewJavascriptBridge.registerHandler('paymentresult', function (data, responseCallback) {
                    // data = $.parseJSON(data);

                    if (typeof data == 'string') {
                        data = JSON.parse(data)
                    }
                    //兼容
                    var _state;
                    if (data.hasOwnProperty('apiName')) {
                        _state = data.params.state;
                    } else {
                        _state = data.state;
                    }

                    if (_state == 0) {
                        window.location.href = window.location.href;
                        location.reload(true);
                        if (isDetailPage) {
                            jb.postNotification('refreshListen');
                        }
                    }
                    var responseData = {'state': 0, 'msg': 'ok'};
                    responseCallback(responseData)
                });

                //更新页面
                window.WebViewJavascriptBridge.registerHandler('listRefresh', function (data, responseCallback) {

                    console.log('listRefresh');
                    location.reload(true)
                    location.href = location.href;
                });

                window.WebViewJavascriptBridge.registerHandler('returnHomePage', function (data, responseCallback) {

                    var url = location.origin + '/life/assets/pages/clife/index.html';
                    var params = {
                        url: url
                    };
                    jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params), url);

                });
            },

            /**
             * 设置tab
             *
             */
            tabSwitchFn: function () {

                var _this = this;
                var $nav = $('.tab-nav');

                $nav.on('click', 'li', function (e) {

                    e.stopImmediatePropagation();
                    var status      = 'selected',
                        $this       = $(this),
                        type        = $this.data('tab'),
                        $tabContent = $('#js_tabcnt');

                    if ($this.hasClass(status)) return;

                    //Util.setQuery('tabname',type);
                    //tab 样式切换
                    $this.addClass('selected').siblings().removeClass('selected');

                    //设置URL HASH
                    Util.setQueryHash({type: type})
                    Util.setQuery({type: type});

                    // tab content 切换
                    var $t = $this.index();
                    var $div = $('#js_tabcnt .wrapper');
                    $div.eq($t).addClass('selected').siblings().removeClass('selected');
                    //拉取数据
                    _this.refreshList(type)

                });
            },
            /**
             * 设置默认tab
             */
            setDefaultTab: function () {

                Util.setDefaultTab('type', $('.tab-nav'))

            },

            /**
             * 设置产品水平移动
             */
            setCarousel: function () {

                $('.item-show').livequery(function () {

                    var startX = 0;
                    var moveX = 0;
                    var deltaX = 0;

                    var $this       = $(this),
                        $items      = $this.find('li'),
                        count       = $items.length,
                        itemWidth   = $items.first().width() * count,
                        clientWidth = $this.width(),
                        deltaWidth  = itemWidth - clientWidth,
                        currentX    = 0;

                    $(this)
                        .on('touchstart', function (e) {
                            if (e.targetTouches.length == 1) {
                                var touch = event.targetTouches[0];

                                currentX = $(this).find('ul').data('left') || 0;

                                // console.log(itemWidth, clientWidth)

                                startX = touch.pageX;
                                clientWidth = touch.clientX;

                            }
                        })
                        .on('touchmove', function (e) {

                                // console.log('touchmove', e)
                                if (e.targetTouches.length == 1) {
                                    var touch = event.targetTouches[0];

                                    moveX = touch.pageX;
                                    deltaX = moveX - startX + currentX;

                                    // console.log(startX, moveX, deltaX, currentX)

                                    if (Math.abs(deltaWidth) > Math.abs(deltaX) && deltaX < 0 && deltaWidth > 0) {

                                        var $target = $(this).find('ul')
                                        $target.data('left', deltaX);
                                        $target.attr('style', 'transform:translate3d(' + deltaX + 'px,0,0);-webkit-transform: translate3d(' + deltaX + 'px,0,0);')

                                    }
                                }

                            }
                        )

                        .on('touchend', function (e) {
                            console.log('end')

                        });
                })
                ;
            },

            /**订单详情折叠
             * */
            listfold: function (num) {

                var _this   = this,
                    eletim  = $('.js-listnumber'),
                    eledown = $('.js-listdown'),
                    eleup   = $('.js-listup');

                elelength = eletim.length;

                if (elelength > num) {

                    eledown.removeClass('none');
                    eletim.eq(num - 1).addClass('no-border');
                    eletim.slice(num).addClass('none');

                    function eleupdown(eleone, eletwo, flag) {
                        eleone.livequery(function () {
                            $(this).on('click', function (e) {
                                e.preventDefault();
                                e.stopImmediatePropagation();

                                $(this).toggleClass('none');
                                if (flag) {
                                    eletim.eq(num - 1).removeClass('no-border');
                                    eletim.slice(num).removeClass('none');
                                } else {
                                    eletim.eq(num - 1).addClass('no-border');
                                    eletim.slice(num).addClass('none');
                                }
                                eletwo.removeClass('none');
                                _this.iscrollRefresh('orderrefresh');
                            });
                        });
                    }

                    //展开
                    eleupdown(eledown, eleup, true);
                    //收起
                    eleupdown(eleup, eledown, false);

                }

            },
            /**
             * 时间倒计时
             * @param options
             * @param $target
             */
            formatOrderTime: function (options, $target) {

                //单位：秒
                // options = {
                //     // "serverTime": "20161024120000",
                //     "startTime": "5",
                //     "endTime": "20"
                // }

                var endDate = options.endTime;

                //判断是否在详情页
                var locationhref = location.pathname;
                var patt = new RegExp('qyorder-details.html');
                var isDetailPage = patt.test(locationhref);

                var times = endDate;

                function countdown() {

                    var days = Math.floor(times / 86400);
                    var hourtime = times - days * 86400;
                    var hours = Math.floor(hourtime / 3600);
                    var mintime = hourtime - hours * 3600;
                    var minutes = Math.floor(mintime / 60);
                    var second = mintime - minutes * 60;

                    var mm = minutes.toString().length == 1 ? '0' + minutes : minutes;
                    var ss = second.toString().length == 1 ? '0' + second : second;

                    if (times <= 0) {
                        //return "正在进行中";
                        if (isDetailPage) {
                            $target.html('立即付款');
                            //window.location.reload(true)
                        } else {
                            $target.prev().html('删除订单').attr('data-type', '7');
                            $target.parents('.item-wrap').find('.order-stat').html('交易关闭');
                            $target.html('再次购买').attr('data-type', '6');
                        }
                    } else {
                        $target.html(mm + ':' + ss + ' | 去付款');
                        //return days+"天"+hours+"小时"+minutes+"分"+second+"秒";
                    }

                }

                function timer() {

                    times--;

                    if (times <= 0) {
                        window.clearInterval(a);
                    }
                    console.log(countdown());
                }

                var a = window.setInterval(timer, 1000);

            },
            /**
             * 启动时间倒计时
             */
            setOrderCountDown: function () {
                var _this = this;

                $('.comm-btn').livequery(function () {
                    var $this = $(this);
                    var $target = $this;
                    var $parent = $this.parents('.opera-wrap');
                    if ($parent.data('isseckill') == 1 && $this.data('type') == 2) {

                        var options = {
                            //startTime: $this.data('starttime').toString(),
                            //endTime: $this.data('endtime').toString(),
                            startTime: $parent.data('ordertime').toString(),
                            endTime: $parent.data('seckillsurplustime')
                        };
                        _this.formatOrderTime(options, $target);
                    }

                })

            },
            /**
             * 图片延迟加载
             */
            lazyLoad: function () {

                $(".lazyload-img").livequery(function () {

                    $(this).unveil(200, function () {
                        $(this).removeClass('unveil-img')
                    });
                })
            },
            tofeedbackPage: function () {
                if (!Util.isApp()) {
                    $('.header-wrap .go-back').livequery('click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        var href = location.origin + '/life/assets/pages/feedback.html?token=' + Util.getQuery('token') + '&env=' + Util.getQuery('env');
                        window.location.href = href;
                    })
                }
            },
            tabFooter: function () {
                var _this = this;
                var url = '', params = '';
                $('.bot-fixed').livequery(function () {
                    $(this).on('click', 'li', function (e) {
                        var tab = $(this).data('tab');
                        var isSelect = $(this).hasClass('n-focus');
                        if (isSelect) return;
                        $(this).addClass('n-focus').siblings().removeClass('n-focus');
                        switch (tab) {
                            case 'home':
                                url = location.origin + '/life/assets/pages/clife/index.html';
                                params = {
                                    url: url
                                };
                                jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params), url);
                                break;
                            case 'cart':
                                url = location.origin + '/life/assets/pages/clife/cart.html';
                                params = {
                                    url: url
                                };
                                jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params), url);
                                break;
                            case 'order':
                                url = location.origin + '/life/assets/pages/clife/qy-order.html';
                                params = {
                                    url: url
                                };
                                jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params), url);
                                break;
                            default:
                                break;

                        }
                    })
                })
            },

            detailInit: function () {
                this.listScroll();
                this.lazyLoad();
                this.checkPaymentDaysSupport()
                this.setOrderCountDown();
            },
            init: function () {

                this.checkPaymentDaysSupport();
                this.listScroll();
                this.registerJsHandler();

                this.setCarousel();
                this.setOrderCountDown();
                // this.tabFooter();
                CLifeFooter.init($('#footer'));
                this.lazyLoad();

                //注册监听消息
                jb.addObserver('refreshListen', 'listRefresh');
                jb.addObserver('refreshListenindetail', 'listRefresh');

                //this.getMybalance();
                //设置左上角返回按钮
                jb.topbarHandler('left', 'hidden', '', 'returnHomePage');

            }
        }
        return qyOrderController;
    })
;
