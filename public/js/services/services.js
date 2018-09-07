/**
 * Created by jahon on 2016/9/22.
 */
define('services', ['jsbridge'], function (jsBridge) {

    // static private var
    //var _numEyes = 2;
    // constructor
    var Services = function (name) {

        if (Util.getQuery('token')) {
            try {
                localStorage.setItem('token', decodeURIComponent(Util.getQuery('token')));
            } catch (ex) {
            }
        }
        if (Util.getQuery('env')) {
            try {
                localStorage.setItem('env', Util.getQuery('env'));
            } catch (ex) {
            }
        }
        // public var
        this.name = name;
    };
    var jb = new jsBridge();

    if (!!window.WebViewJavascriptBridge.registerHandler) {
        //获取登录后token
        window.WebViewJavascriptBridge.registerHandler('getTokenHandler', function (data) {

            //alert(JSON.stringify(data))
            if (typeof data == 'string') {
                data = JSON.parse(data)
            }
            if (data.params.token) {
                // var _tmpurl=location.origin+location.pathname+'?token='+data.params.token+'&'+Util.getQueryString('token');
                // window.location.href=_tmpurl;

                // localStorage.setItem('token', data.params.token);

                try {
                    localStorage.setItem('token', data.params.token);
                } catch (ex) {
                }

            } else {
                jb.toastHandler('登录失败');
            }
            //jb.toastHandler(params.token)

        });
    }
    Services.prototype = {
        _ajax: function (options) {

            var defer = $.Deferred();

            if (!options.type) {
                options.type = 'POST';
            }

            if (options.proxyUrl) {
                options.data.originUrl = options.url;
                options.url = options.proxyUrl;
            }
            options.timeout = 30000;
            // options.dataType = 'json';
            options.contentType = options.contentType || 'application/x-www-form-urlencoded; charset=utf-8';

            options.beforeSend = function (xhr, settings) {

                //Util.dialog.showLoading();
            }

            options.complete = function (xhr, status) {

                jb.loadingHandler('hide')
                //Util.dialog.hideLoading();
                // console.log('complete', xhr, status)

            };
            options.error = function (xhr, errorType) {
                //Util.dialog.hideLoading();
                //Util.dialog.showMessage();
                var msg = '服务器繁忙，请稍后再试';
                if (errorType == 'abort' && xhr.readyState == 4 && xhr.status == 0) {
                    //jb.loginHandler('getTokenHandler', 'userLogout');
                    //msg = '请重新登录';
                } else {
                    //jb.toastHandler(msg);
                }

                console.log('msgfromH5=' + msg);


            };
            var request = $.ajax(options);
            var promise = request.then(
                function (response) {
                    return response
                },
                function (xhr, errorType, error) {
                    //fail
                    defer.reject();
                });

            promise.fail = function (response) {return defer.resolve();};
            promise.done(function (data, status, xhr) {defer = request = promise = null;});

            return promise;
        },
        getData: function (options) {

            //// options = {
            ////     url: '',
            ////     headers: {},
            ////     data: {}
            //// }
            // if (WEB_CONFIG.DEBUG) {
            //     options.proxyUrl = WEB_CONFIG.api.proxyUrl;
            // }
            //
            // var p = this._ajax(options);
            //
            // //console.log(p)
            //
            // return p;
            var token = (!!Util.isApp() ? WEB_CONFIG.appInfo.token : Util.getCookie('token')) || localStorage.getItem('token') || Util.getQuery('token');

            if(options.data.hasOwnProperty('source')){
                var exModel = {
                    token: decodeURIComponent(token),
                    entry: Util.getQuery('entry') || 1,
                    appname: Util.getQuery('appname'),
                    appName: Util.getQuery('appname')
                }
            }else{
                var exModel = {
                    token: decodeURIComponent(token),
                    source: Util.getQuery('source') || 0,
                    entry: Util.getQuery('entry') || 1,
                    appname: Util.getQuery('appname'),
                    appName: Util.getQuery('appname')
                }
            }

            $.extend(options.data, exModel);


            var p = this._ajax(options);
            return p.then(function (result) {

                result = ( typeof result === 'string') ? JSON.parse(result) : result;

                //console.log(result)

                switch (parseInt(result.state)) {

                    case 3820114:
                    case 3820115:
                    case 3829201:

                        jb.loginHandler('getTokenHandler', 'userLogout');
                        //jb.loadingHandler('show')
                        break;
                    default:
                    //jb.toastHandler(data.msg);

                }
                return result

            })
            //test
            // if (WEB_CONFIG.DEBUG) {
            //
            //     jb.toastHandler('DEGUG:' + WEB_CONFIG.DEBUG)
            //
            //     options.proxyUrl = WEB_CONFIG.api.proxyUrl;
            //
            //     //拦截请求结果，debug时启用
            //     return p.then(function (result) {
            //
            //         if (options.name && MOCKDATA[options.name]) {
            //             result = MOCKDATA[options.name];
            //         }
            //
            //         return result
            //     })
            //
            // }

        }
    };

    // instance method
    // // class static method
    // Services.GET_TYPE = function () {
    //     return 'biped';
    // };
    //
    // // class static const
    // Services.NUM_LEGS = 2;

    return Services;
});