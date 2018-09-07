/**
 * Created by Administrator on 2017/6/26.
 */
//
//
//
define('shopController', ['jsbridge'], function(jsBridge) {

    var shopController = function () {};
    shopController.prototype = {

        init: function () {
            var jsb=new jsBridge();
            jsb.topbarHandler('left','','','goback');
            window.WebViewJavascriptBridge.registerHandler('goback', function (data, responseCallback) {
                jsb.postNotification('shopclosed');
            });
            $('#goindex').on('click',function (e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                jsb.routerHandler('20301')
            })
        }

    };

    return shopController;
});



