define('walletService', ['services','jsbridge'], function(Services,jsbridge) {
    var jb = new jsbridge();
    var walletService = function() {

        Services.call(this, '');
    }

    walletService.prototype = Object.create(Services.prototype);

    var _super = Services.prototype;

    //获取我的余额
    walletService.prototype.getMybalance = function(params) {

            jb.loadingHandler('show');

        return _super.getData({
            url: WEB_CONFIG.getApi('mybalance','https'),
            data: params || {},
            type:'GET'
        })
    }
    //获取余额明细
    walletService.prototype.getRecordlist = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('recordlist'),
            data: params || {}
        })
    }
    //获取余额详情
    walletService.prototype.getRecorddetail = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('recorddetail'),
            data: params || {}
        })
    }
    //充值
    walletService.prototype.rechargeCard = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('cardrecharge','https'),
            data: params || {}
        })
    }
    //星链卡转账校验
    walletService.prototype.transferCheck = function(params) {
      return _super.getData({
        url: WEB_CONFIG.getApi('transferCheck','https'),
        data: params || {}
      })
    }
    //星链卡转账
    walletService.prototype.transfer = function(params) {
      return _super.getData({
        url: WEB_CONFIG.getApi('transfer','https'),
        data: params || {}
      })
    }
    // 查找用户
    walletService.prototype.findUser = function (params) {
      return _super.getData({
        url: WEB_CONFIG.getApi('findUser', 'https'),
        data: params || {}
      })
    }

    // 查找账户信息
    walletService.prototype.findReceivableAccount = function (params) {
      return _super.getData({
        url: WEB_CONFIG.getApi('findReceivableAccount', 'https'),
        data: params || {}
      })
    }

    return walletService;

});
