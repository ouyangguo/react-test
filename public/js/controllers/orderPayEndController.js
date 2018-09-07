define('orderPayEndController', ['orderService', 'handlebars', 'jsbridge'],
    function (OrderService, Handlebars, jsbridge) {
        var os = new OrderService();

        var jb = new jsbridge();
        var isIOS = /iphone|ipad|ipod/gi.test(navigator.userAgent);

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

        var orderPayEndController = function () {};

        orderPayEndController.prototype = {
            init: function () {
                this.getOrderList()

            },
            getOrderList: function () {
                var ordersn = Util.getQuery('ordersn'),
                    _this   = this;
                if (ordersn) {
                    var params = {
                        'ordersn': ordersn
                    }
                    jb.loadingHandler('show');
                    os.getOrderDetail(params)
                        .then(function (res) {
                            if (res.state == 0) {
                                jb.loadingHandler('hide');
                                //渲染模板
                                _this.render(res.data.orderInfo);
                                _this.goPage();
                                var orderBaseInfo = res.data.orderInfo.orderBaseInfo;
                                _this.showCouponFun(orderBaseInfo.factNotContainDeliveryFee)
                            }else{
                                jb.toastHandler(res.msg)
                            }
                        })

                }

            },
            render: function (res) {
                var _this = this;
                res.orderBaseInfo.isToHomeFormat = res.orderBaseInfo.isToHome == '1' ? true : false
                res.orderBaseInfo.isSelfgetFormat = res.orderBaseInfo.isSelfget == '1' ? true : false
                res.receiverInfo.addr = res.receiverInfo.areaName + res.receiverInfo.postAddr || res.receiverInfo.areaName;

                handlebarfn('#tmpl_footerdetail', $('#js-cent'), res, 'replace');
            },
            goPage: function () {
                //点击查看订单
                $('#js-order').on('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var ordersn = Util.getQuery('ordersn')
                    var url = location.origin + '/life/assets/pages/order-details.html?ordersn=' + ordersn;

                    var tmpparams = {
                        url: url
                    }
                    jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);
                })

                //继续购买
                $('#js-keepbuy').on('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    if(isIOS){
                        jb.routerHandler(WEB_CONFIG.nativePage.homeModule.home.id, JSON.stringify({}));
                    }else{
                        jb.routerHandler(WEB_CONFIG.nativePage.homeModule.home.id, JSON.stringify({"index":"0"}));
                    }
                })
            },
            /**
             *
             * @param totalOrderFee 订单总金额
             */
            showCouponFun: function (totalOrderFee) {
                if (totalOrderFee) {
                    var params = {
                        'ordermoney': totalOrderFee
                    }
                    os.getOderishavecoupon(params).then(function (res) {

                        // console.log(res)

                        if (res.state == 0) {

                            var couponStatus = res.data.couponStatus;

                            if (couponStatus == 2) {

                                //渲染优惠券
                                var couponInfo = res.data.couponSchema;

                                couponInfo.isStart = couponInfo.couponType == 2;
                                couponInfo.faceValueFormat = couponInfo.faceValue && couponInfo.faceValue.toString().length >= 5;

                                handlebarfn('#tmpl_coupondetail', $('body'), couponInfo);

                                //关闭浮层
                                $('.js-close').on('click', function () {
                                    $('#pop').remove()
                                })

                            }
                        }
                    })
                }
            }

        }
        return orderPayEndController;
    }
)