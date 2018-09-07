
/*!
 *
 */

define('collectService', ['services'], function(Services) {

    var collectService = function() {

        Services.call(this, '');
    }

    collectService.prototype = Object.create(Services.prototype);

    var _super = Services.prototype;
    var collect = {

        getLogcollect: function(data) {

            return _super.getData({
                url:  WEB_CONFIG.getApi('logcollect'),
                data: data
            })
        }

    }

    $.extend(collectService.prototype, collect);

    return collectService;
});
