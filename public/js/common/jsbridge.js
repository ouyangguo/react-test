define('jsbridge', ['webviewBridgeLib', 'util'], function () {

    require('webviewBridgeLib');

    //注册事件监听
    function connectWebViewJavascriptBridge(callback) {
        if (window.WebViewJavascriptBridge) {
            callback(WebViewJavascriptBridge)
        } else {
            document.addEventListener(
                'WebViewJavascriptBridgeReady',
                function () {
                    callback(WebViewJavascriptBridge)
                },
                false
            );
        }
    }

    //注册回调函数，第一次连接时调用 初始化函数
    connectWebViewJavascriptBridge(function (bridge) {
        bridge.init(function (message, responseCallback) {
            //console.log('JS got a message ,this message is:' + message)
            var data = {
                "state": 0,
                "msg": "ok,JS got a message"
            };
            responseCallback(data);
        });

    })

    var jsBridge = function () {

    }

    jsBridge.prototype = {}
    jsBridge.prototype.shareHandler = function (shareInfo) {

        var handlerData = {
            "apiName": 'share',
            "params": shareInfo
        }
        console.log(handlerData)
        window.WebViewJavascriptBridge.callHandler('uiHandler', handlerData);
    }
    jsBridge.prototype.toastHandler = function (msg) {
        if (!Util.isApp() || WEB_CONFIG.global.ST) {
            // $.dialog({
            //     type: 'tips',
            //     infoText: msg
            //     //autoClose: 1500
            // })
            Util.dialog.showTips(msg)
            return
        }
        var handlerData = {
            "apiName": 'toast',
            "params": {
                type: '',
                msgContent: msg || ''
            }
        };

        console.log(msg)

        var handlerData2 = {
            "apiName": 'loading',
            "params": {"option": "hide"}
        }
        window.WebViewJavascriptBridge.callHandler('uiHandler', handlerData2);
        setTimeout(function () {
            window.WebViewJavascriptBridge.callHandler('uiHandler', handlerData);
        }, 100)
    }
    jsBridge.prototype.dialogHandler = function (msgTitle, msgContent, dialogStyle) {

        var handlerData = {
            "apiName": 'dialog',
            "params": {
                msgTitle: msgTitle || '',
                msgContent: msgContent || '',
                dialogStyle: dialogStyle || {}
            }
        };
        console.log(JSON.stringify(handlerData));
        window.WebViewJavascriptBridge.callHandler('uiHandler', handlerData);
    }

    jsBridge.prototype.loadingHandler = function (active) {
        var _params = {
            option: active || 'show',
        };
        var handlerData = {
            "apiName": 'loading',
            "params": _params
        }
        window.WebViewJavascriptBridge.callHandler('uiHandler', handlerData);

    }

    jsBridge.prototype.loginHandler = function (callhandler, apiname) {
        var _params = {
            "type": "buyer",
            "name": callhandler
        };
        var handlerData = {
            "apiName": apiname || 'userLogin',
            "params": _params
        }
        console.log(handlerData)
        if (!!Util.isApp()) {
            window.WebViewJavascriptBridge.callHandler('loginHandler', handlerData);
        } else {
            window.location.href = WEB_CONFIG.global.WEB_PATH + '/login.html?url=' + encodeURIComponent(window.location.href);
        }

    }

    jsBridge.prototype.externalPayment = function (tradeno, callhandler, callbackstr, type) {
        //apiname:  balance=可以用余额支付 nobalance=没有余额支付 external=第三方充值  account = 账期支付
        var _params = {
            tradeno: tradeno.toString() || '',
            tradeNo: tradeno.toString() || '',
            callhandler: callhandler || '',
            callbackstr: callbackstr || '',
            type: type || '1' // 第三方充值 1：手机充值，2：Q币会员，3：流量直充
        }
        var handlerData = {
            "apiName": 'external',
            "params": _params
        };
        window.WebViewJavascriptBridge.callHandler('paymentHandler', handlerData);
    }

    jsBridge.prototype.balancePayment = function (opt) {
        //apiname:  balance=可以用余额支付 nobalance=没有余额支付 external=第三方充值  account = 账期支付
        // var _params={
        //     tradeno:tradeno.toString()||'',
        //     totalamount:totalamount.toString()||'',
        //     mybalance:mybalance||'',
        //     callhandler:callhandler||'',
        //     callbackstr:callbackstr||''
        // }
        var _params = opt;
        var handlerData = {
            "apiName": 'balance',
            "params": _params
        };
        console.log(handlerData);
        window.WebViewJavascriptBridge.callHandler('paymentHandler', handlerData);
    }
    jsBridge.prototype.nobalancePayment = function (opt) {
        //apiname:  balance=可以用余额支付 nobalance=没有余额支付 external=第三方充值  account = 账期支付
        // var _params={
        //     tradeno:tradeno.toString()||'',
        //     totalamount:totalamount.toString()||'',
        //     mybalance:mybalance||'',
        //     callhandler:callhandler||'',
        //     callbackstr:callbackstr||''
        // }
        var _params = opt;
        var handlerData = {
            "apiName": 'nobalance',
            "params": _params
        };
        console.log(handlerData);
        window.WebViewJavascriptBridge.callHandler('paymentHandler', handlerData);
    }
    jsBridge.prototype.ctripPayment = function (opt) {
      var _params = opt;
      var handlerData = {
        "apiName": 'ctrip',
        "params": _params
      };
      console.log(handlerData);
      window.WebViewJavascriptBridge.callHandler('paymentHandler', handlerData);
    }
    jsBridge.prototype.accountPayment = function (opt) {
        //apiname:  balance=可以用余额支付 nobalance=没有余额支付 external=第三方充值  account = 账期支付
        // var _params={
        //     tradeno:tradeno.toString()||'',
        //     totalamount:totalamount.toString()||'',
        //     mybalance:mybalance||'',
        //     callhandler:callhandler||'',
        //     callbackstr:callbackstr||''
        // }
        var _params = opt;
        var handlerData = {
            "apiName": 'account',
            "params": _params
        };
        console.log(handlerData);
        window.WebViewJavascriptBridge.callHandler('paymentHandler', handlerData);
    }
    jsBridge.prototype.routerHandler = function (tm, tp, tu, tt) {
        var _params = {
            td: '',
            tm: tm,
            tp: tp || '',
            tu: tu || '',
            tt: tt || ''
        };
        var handlerData = {
            "apiName": 'router',
            "params": _params
        };
        console.log(handlerData);
        if (Util.isApp()) {
            window.WebViewJavascriptBridge.callHandler('pageHandler', handlerData);
        } else {
            //window.location.href = handlerData.params.tu;

            web4wap.to(_params);
        }

    }
    jsBridge.prototype.historygoHandler = function (type) {
        if (!Util.isApp() || WEB_CONFIG.global.ST) {
            // $.dialog({
            //     type: 'tips',
            //     infoText: msg
            //     //autoClose: 1500
            // })
            window.history.back()
            return
        }
        var handlerData = {
            "apiName": 'historygo',
            "params": {
                type: type || 'browser'
            }
        };
        setTimeout(function () {
            handlerData
            window.WebViewJavascriptBridge.callHandler('historygoHandler', handlerData);
        }, 105)

    }
    jsBridge.prototype.topbarHandler = function (apiName, Icon, Text, Callhandler, Background) {
        var _params = {
            text: Text || '',
            icon: Icon || '',
            callhandler: Callhandler || '',
            background: Background || ''
        };
        var handlerData = {
            "apiName": apiName,
            "params": _params
        }

        console.log(handlerData)

        if (Util.isApp()) {
            window.WebViewJavascriptBridge.callHandler('topbarHandler', handlerData);
        } else {
            //window.location.href = handlerData.params.tu;
            _params.align = apiName;
            web4wap.setHanderInfo(_params);
        }

    }
    jsBridge.prototype.addObserver = function (name, callbackHandlerName, callbackHandlerApiName) {
        var _params = {
            name: name || '',
            callbackHandlerName: callbackHandlerName || '',
            callbackHandlerApiName: callbackHandlerApiName || ''
        };
        var handlerData = {
            "apiName": 'addObserver',
            "params": _params
        }
        window.WebViewJavascriptBridge.callHandler('notificationCenterHandler', handlerData);

    }

    jsBridge.prototype.postNotification = function (name, userInfo) {
        var _params = {
            name: name || '',
            userInfo: userInfo || '{"demokey":"demovalue"}'
        };
        var handlerData = {
            "apiName": 'postNotification',
            "params": _params
        }
        console.log(handlerData)
        // alert(JSON.stringify(handlerData))
        window.WebViewJavascriptBridge.callHandler('notificationCenterHandler', handlerData);

    }

    jsBridge.prototype.getAppInfo = function () {
        var appinfo, paramsArr, appinfoObj = {};
        appinfo = Util.getQuery('appname').split('#');
        appinfo = appinfo[0];
        if (appinfo) {
            paramsArr = appinfo.split('_');
            appinfoObj.version = paramsArr[3];
            appinfoObj.sys = paramsArr[2];
            appinfoObj.name = paramsArr[1];
            appinfoObj.company = paramsArr[0]
        }
        return appinfoObj

    }

    /**
     * 优惠券二维码
     */
    jsBridge.prototype.couponBarCode = function (parms) {

        var handlerData = {
            "apiName": 'couponBarCode',
            "params": parms
        }
        window.WebViewJavascriptBridge.callHandler('uiHandler', handlerData);
    }

    /**
     * 星链生活/云店“我的订单”顶部弹窗
     */
    jsBridge.prototype.showItem = function (Callhandler, data) {

        var _params = {
            callbackHandlerName: Callhandler || '',
            itemData: data || {}
        };
        var handlerData = {
            "apiName": 'showItem',
            "params": _params
        }
        console.log(handlerData)

        window.WebViewJavascriptBridge.callHandler('showItemsHandler', handlerData);

    }

    /**
     * 日志采集(点击形式)
     * @param callhandler
     * @param data
     */
    jsBridge.prototype.ctmClick = function (data) {

        var handlerData = {
            "apiName": 'click',
            "params": data || {}
        }
        console.log(handlerData)

        window.WebViewJavascriptBridge.callHandler('uploadLogHandler', handlerData);

    }

    jsBridge.prototype.qyShoppingCartDialog = function (Callhandler, cb) {
        var handlerData = {
            "apiName": 'qyShoppingCartDialog',
            callbackHandlerName: Callhandler || ''
        };
        console.log(JSON.stringify(handlerData));
        window.WebViewJavascriptBridge.callHandler('uiHandler', handlerData, cb);
    }

    // 刷新、加载控制
    jsBridge.prototype.setRefreshType = function (params) {

        // refresh 只使用下拉刷新 loading 只使用上拉加载 all 下拉、加载都使用
        // isShowToast show 显示toast提示(如已到最后一页) hide 不显示
        var setRefreshType = '';
        var showToast      = '';
        switch (params.refreshType) {
            case 'refresh':
                setRefreshType = '1';
                break;
            case 'loading':
                setRefreshType = '2';
                break;
            case 'all':
                setRefreshType = '3';
                break;
            default:
                break;
        }
        switch (params.isShowToast) {
            case 'show':
                showToast = '1';
                break;
            case 'hide':
                showToast = '0';
                break;
            default:
                break;
        }
        var _params = {
            isShowToast: showToast  || '0',
            refreshType: setRefreshType || ''
        };

        var handlerData = {
            "apiName": 'setRefreshType',
            "params": _params
        };
        console.log(handlerData)

        window.WebViewJavascriptBridge.callHandler('controlRefreshHandler', handlerData);
    }

    //window.EaJumpPage = EaJumpPage;

    return jsBridge;

});
