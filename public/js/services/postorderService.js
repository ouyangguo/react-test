define('postorderService', ['services'], function(Services) {

    var postorderService = function() {

        Services.call(this, '');
    }

    postorderService.prototype = Object.create(Services.prototype);

    var _super = Services.prototype;

    //退货退款列表信息  searchpostsale.do
    postorderService.prototype.getPostorderList = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('searchpostsale'),
            data: params || {}
        })
    }
    //详情 postsaleddetail.do
    postorderService.prototype.getPostorderDetail = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('postsaleddetail'),
            data: params || {}
        });
    }
    //快递公司列表 deliverycompanylist.do
    postorderService.prototype.getDeliverCompany = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('deliverycompanylist'),
            data: params || {}
        })
    }
    //提交退货发货地址 submitpostsaledaddr.do
    postorderService.prototype.setPostsaledAddr = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('submitpostsaledaddr'),
            data: params || {}
        })
    }
    //客服介入 submitmsg2service.do
    postorderService.prototype.setMsg2service = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('submitmsg2service'),
            data: params || {}
        })
    }
    //取消售后申请 updatepostsale.do
    postorderService.prototype.cancelService = function(params) {
        return _super.getData({
            url: WEB_CONFIG.getApi('updatepostsale'),
            data: params || {}
        })
    }
    //退货退款原因列表  refundcauselist.do
    postorderService.prototype.refundCause = function (params) {
        return _super.getData({
            url:WEB_CONFIG.getApi('rufundcauselist'),
            data:params || {}
        })
    };

    //退款申请
    postorderService.prototype.postsaledreCash = function (params) {
        return _super.getData({
            url:WEB_CONFIG.getApi('postsaledrecash'),
            data:params || {}
        })
    };
    //退货退款申请
    postorderService.prototype.postsaledreGoods = function (params) {
        return _super.getData({
            url:WEB_CONFIG.getApi('postsaledregoods'),
            data:params || {}
        })
    };


    //图片上传  uploadimg
    postorderService.prototype.upLoadImg = function (params) {
        return _super.getData({
            url: UPLOAD_DOMAIN + '/upload/file/multiUpload',
            cros:true,
            type: 'POST',
            data: params,
            async: true,
            cache: false,
            contentType: 'multipart/form-data',
            processData: false,
        })
    };

    return postorderService

});
