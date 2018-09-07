define('qyOrderService', ['services', 'jsbridge'], function (Services, jsbridge) {
    var jb = new jsbridge();
    var qyOrderService = function () {

        Services.call(this, '');
    }

    qyOrderService.prototype = Object.create(Services.prototype);

    var _super = Services.prototype;

    qyOrderService.prototype = {

        //详情
        getOrderDetail: function (params) {
            jb.loadingHandler('show');

            return _super.getData({
                name: 'orderDetail',
                url: WEB_CONFIG.getApi('orderDetail'),
                data: params || {}
            });
        },
        //物流信息
        getDeliverflowinfo: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('deliverflowinfo'),
                data: params || {}
            })
        },
        //订单列表
        getOrderList: function (params) {
            jb.loadingHandler('show');

            return _super.getData({
                url: WEB_CONFIG.getApi('orderlist'),
                data: params || {}
            })
        },
        //扫描支付获取优惠券信息
        scanpaycouponinfo: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('scanpaycouponinfo'),
                data: params || {}
            })
        },
        scanpayreceivecoupon: function (params) {
            jb.loadingHandler('show');
            return _super.getData({
                url: WEB_CONFIG.getApi('scanpayreceivecoupon'),
                data: params || {}
            })
        },
        //确认收货 comfirmreceipt.do
        comfirmReceipt: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('comfirmreceipt'),
                data: params || {}
            })
        },
        //取消订单
        cancelOrder: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('cancelOrder'),
                data: params || {}
            })
        },
        //删除订单 removeorderrecord.do
        deleteOrder: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('removeorderrecord'),
                data: params || {}
            })
        },
        //平台商品批量加入购物车 batchupdatecart.do
        batchupdateCartP: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('batchupdatecartP'),
                data: params || {}
            })
        },
        //店铺商品批量加入购物车 batchupdatecart.do
        batchupdateCartS: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('batchupdatecartS'),
                data: params || {}
            })
        },
        //支付结果
        getPayresult: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('rechargeinfo'),
                data: params || {}
            })
        },
        //获取我的余额
        getMybalance: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('mybalance', 'https'),
                data: params || {},
                type: 'GET'
            })
        },
        //立即支付
        setPayorder: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('payorder'),
                data: params || {}
            })
        },
        //检查用户是否在配送范围
        checkuserlbs: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('checkuserlbs'),
                data: params || {}
            })
        },
        checkPaymentDaysSupport: function (params) {
            jb.loadingHandler('show');

            return _super.getData({
                url: WEB_CONFIG.getApi('checkPaymentDaysSupport'),
                data: params || {}
            })
        }

    }

    return qyOrderService

});
