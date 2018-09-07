/*!
 * description: 业务处理
 * date: 2016/08/30
 * author: Jahon
 */

define('productService', ['services'], function (Services) {

    var ProductService = function () {

        Services.call(this, '');
    }

    ProductService.prototype = Object.create(Services.prototype);

    var _super = Services.prototype;
    var product = {
        getList: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('mixGoodsList'),
                data: params.data || {}
            })
        },
        getCarNum: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('msgnum'),
                data: params.data || {}
            })
        }

    }

    $.extend(ProductService.prototype, product);

    return ProductService;
});
