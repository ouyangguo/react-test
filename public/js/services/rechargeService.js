define('rechargeService', ['services'], function(Services) {

    var rechargeService = function() {

        Services.call(this, '');
    }

    rechargeService.prototype = Object.create(Services.prototype);

    var _super = Services.prototype;

    //获取服务商品列表
    rechargeService.prototype.getRechargegoods = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('rechargegoods'),
            data: params || {}
        })
    }
    //获取服务充值详情
    rechargeService.prototype.getRechargeinfo = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('rechargeinfo','https'),
            data: params || {}
        })
    }
    //充值请求
    rechargeService.prototype.regRecharge = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('rechargereq','https'),
            data: params || {}
        })
    }

    return rechargeService;

});
