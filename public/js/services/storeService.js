define( 'storeService', ['services', 'jsbridge'],
    function (Services, jsbridge) {
        var mymsgService = function () {

            Services.call(this, '');
        }
        var jb = new jsbridge();

        mymsgService.prototype = Object.create(Services.prototype);

        var _super = Services.prototype;

        mymsgService.prototype.getAdStoreList = function (params) {
            jb.loadingHandler('show');
            return _super.getData({
                url: WEB_CONFIG.getApi('adshoplist'),
                data: params || {}
            })
        };

        return mymsgService
    });
