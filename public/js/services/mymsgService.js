define( 'mymsgService', ['services', 'jsbridge'],
    function (Services, jsbridge) {
        var mymsgService = function () {

            Services.call(this, '');
        }
        var jb = new jsbridge();

        mymsgService.prototype = Object.create(Services.prototype);

        var _super = Services.prototype;

        mymsgService.prototype.getMymsgList = function (params) {
            jb.loadingHandler('show');
            return _super.getData({
                url: WEB_CONFIG.getApi('mymsglist'),
                data: params || {}
            })
        };
        mymsgService.prototype.setMsgStatus = function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('updatemsgstatus'),
                data: params || {}
            })
        }

        return mymsgService
    });
