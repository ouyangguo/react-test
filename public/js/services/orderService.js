define('orderService', ['services','jsbridge'], function(Services,jsbridge) {
    var jb = new jsbridge();
    var orderService = function() {

        Services.call(this, '');
    }

    orderService.prototype = Object.create(Services.prototype);

    var _super = Services.prototype;
    //详情
    orderService.prototype.getOrderDetail = function(params) {
        jb.loadingHandler('show');

        return _super.getData({
            name:'orderDetail',
            url: WEB_CONFIG.getApi('orderDetail'),
            data: params || {}
        });
    }
    //v4.0订单是否有优惠券列表赠送
    orderService.prototype.getOderishavecoupon = function(params) {

        return _super.getData({
            name:'oderishavecoupon',
            url: WEB_CONFIG.getApi('oderishavecoupon'),
            data: params || {}
        });
    }
    //物流信息
    orderService.prototype.getDeliverflowinfo = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('deliverflowinfo'),
            data: params || {}
        })
    }
    //订单列表
    orderService.prototype.getOrderList = function(params) {
        jb.loadingHandler('show');

        return _super.getData({
            url: WEB_CONFIG.getApi('orderlist'),
            data: params || {}
        })
    }
    //充值订单列表
    orderService.prototype.getRechargeOrderList = function(params) {
        jb.loadingHandler('show');

        return _super.getData({
            url: WEB_CONFIG.getApi('rechargeOrderlist'),
            data: params || {}
        })
    }
    //充值订单详情
    orderService.prototype.getRechargeOrderDetail = function(params) {
        jb.loadingHandler('show');

        return _super.getData({
            url: WEB_CONFIG.getApi('rechargeOrderDetail'),
            data: params || {}
        })
    }
    //扫描支付获取优惠券信息
    orderService.prototype.scanpaycouponinfo=function (params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('scanpaycouponinfo'),
            data: params || {}
        })
    }
    orderService.prototype.scanpayreceivecoupon=function (params) {
        jb.loadingHandler('show');
        return _super.getData({
            url: WEB_CONFIG.getApi('scanpayreceivecoupon'),
            data: params || {}
        })
    }

    //确认收货 comfirmreceipt.do
    orderService.prototype.comfirmReceipt = function(params) {
        jb.loadingHandler('show');
        return _super.getData({
            url: WEB_CONFIG.getApi('comfirmreceipt'),
            data: params || {}
        })
    }
    //取消订单
    orderService.prototype.cancelOrder = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('cancelOrder'),
            data: params || {}
        })
    }

    //删除订单 removeorderrecord.do
    orderService.prototype.deleteOrder = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('removeorderrecord'),
            data: params || {}
        })
    }
    //平台商品批量加入购物车 batchupdatecart.do
    orderService.prototype.batchupdateCartP = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('batchupdatecartP'),
            data: params || {}
        })
    }
    //店铺商品批量加入购物车 batchupdatecart.do
    orderService.prototype.batchupdateCartS = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('batchupdatecartS'),
            data: params || {}
        })
    }
    //支付结果 
    orderService.prototype.getPayresult = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('rechargeinfo'),
            data: params || {}
        })
    }
    //获取我的余额
    orderService.prototype.getMybalance = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('mybalance','https'),
            data: params || {},
            type:'GET'
        })
    }
    //立即支付
    orderService.prototype.setPayorder = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('payorder'),
            data: params || {}
        })
    }
    //检查用户是否在配送范围
    orderService.prototype.checkuserlbs=function (params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('checkuserlbs'),
            data: params || {}
        })
    },
    //查询是否是最后一笔退货子订单(订单详情退货退款、退款使用)
    orderService.prototype.isSplitLast=function (params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('isSplitLast'),
            data: params || {}
        })
    }

    return orderService

});
