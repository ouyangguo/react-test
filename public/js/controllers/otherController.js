/**
 *
 * Created by jahon on 2016/10/27.
 */

define('otherController', ['jsbridge'], function (jsbridge) {

    var jsb = new jsbridge();
    var OtherController = function () {};

    OtherController.prototype = {
        init: function () {

            jsb.routerHandler(WEB_CONFIG.nativePage.homeModule.home.id, JSON.stringify({"index": "0"}));

        }

    };

    return OtherController;
});