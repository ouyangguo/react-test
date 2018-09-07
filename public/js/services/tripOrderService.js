/**
 * Created by ou on 2018/2/23.
 */
define('tripOrderService', ['services','jsbridge'], function(Services,jsbridge) {
  var jb = new jsbridge();
  var tripOrderService = function() {

    Services.call(this, '');
  }

  tripOrderService.prototype = Object.create(Services.prototype);

  var _super = Services.prototype;
  //列表
  tripOrderService.prototype.getOrderList = function(params) {
    jb.loadingHandler('show');

    return _super.getData({
      name:'trip',
      url: WEB_CONFIG.getApi('travelOrderList'),
      data: params || {}
    });
  };

  //开发票
  tripOrderService.prototype.getBatchList = function(params) {
    jb.loadingHandler('show');

    return _super.getData({
      name:'trip',
      url: WEB_CONFIG.getApi('querySettlements'),
      data: params || {}
    });
  };

  tripOrderService.prototype.submitInvoiceApply = function (params) {
    jb.loadingHandler('show');
    return _super.getData({
      name:'trip',
      url: WEB_CONFIG.getApi('submitInvoiceApply'),
      data: params || {}
    });
  };

  tripOrderService.prototype.getInvoiceHeadList = function (params) {
    jb.loadingHandler('show');
    return _super.getData({
      name:'trip',
      url: WEB_CONFIG.getApi('getInvoiceHeadList'),
      data: params || {}
    });
  };


  tripOrderService.prototype.getInvoiceDetail = function (params) {
    jb.loadingHandler('show');
    return _super.getData({
      name: 'trip',
      url: WEB_CONFIG.getApi('invoiceDetail'),
      data: params || {}
    });
  };

  tripOrderService.prototype.applyEInvoiceRed = function (params) {
    jb.loadingHandler('show');
    return _super.getData({
      name: 'trip',
      url: WEB_CONFIG.getApi('applyEInvoiceRed'),
      data: params || {}
    });
  };

  tripOrderService.prototype.getInvoiceOrders = function (params) {
    jb.loadingHandler('show');
    return _super.getData({
      name: 'trip',
      url: WEB_CONFIG.getApi('getTravelOrderByOrderSn'),
      data: params || {}
    });
  };

  tripOrderService.prototype.getHistoryInvoiceList = function (params) {
    jb.loadingHandler('show');
    return _super.getData({
      name: 'trip',
      url: WEB_CONFIG.getApi('getHistoryInvoiceList'),
      data: params || {}
    });
  };

  tripOrderService.prototype.sendInvoiceMail = function (params) {
    jb.loadingHandler('show');
    return _super.getData({
      name: 'trip',
      url: WEB_CONFIG.getApi('sendInvoiceMail'),
      data: params || {}
    });
  };

  return tripOrderService

});
