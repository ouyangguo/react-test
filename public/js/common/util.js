'use strict';
var Util = {
    /**
     * 获取单个参数值
     * @param name 参数名
     * @returns {string}
     */
    getQuery: function (name) {
        var matchHash = window.location.hash.match('([\?]).*');
        var qs = [window.location.search, !!matchHash ? matchHash[0].replace(/\?/, '') : ''].join('&')
        var match = RegExp('[?&]' + name + '=([^&]*)').exec(qs);
        return !match ? '' : match[1].replace(/\+/g, ' ');

    },
    /**
     *  获取参数链
     * @param excepts {Array} 剔除的参数名
     * @param extParams {} 要合并的参数名
     * @returns {*}
     */
    getQueryString: function (excepts, extParams) {
        if (location.href.indexOf("?") == -1 || location.href.indexOf(name + '=') == -1) {
            return '';
        }
        var matchHash = window.location.hash.match('([\?]).*');
        var queryString = [window.location.search, !!matchHash ? matchHash[0] : '']
            .filter(function (item) {
                return !!item
            }).join('&').replace(/\?/gi, '')

        if (!(excepts instanceof Array)) {
            return queryString;
        }

        var parameters = queryString.split("&");
        var qsArr     = [],
            newParams = {};

        for (var i = 0; i < parameters.length; i++) {
            var vArr = parameters[i].split('=');
            newParams[vArr[0]] = vArr[1];
        }

        for (var j = 0; j < excepts.length; j++) {
            delete newParams[excepts[j]];
        }

        $.extend(newParams, extParams || {});

        for (var k in newParams) {
            qsArr.push(k + '=' + newParams[k]);
        }

        return qsArr.join('&');
    },

    /**
     * 获取类URL的参数
     * @param url
     * @param name
     * @returns {string}
     */
    getLikeQuery: function (url, name) {

        console.log(url, name)

        console.log(url.match('([\?]).*'))

        var matchqs = url.match('([\?]).*'),
            qs      = !!matchqs && (matchqs || [])[0].split('?').filter(function (item) {
                return !!item
            }).join('&'),
            match   = RegExp('[?&]' + name + '=([^&]*)').exec(qs);
        return !match ? '' : match[1].replace(/\+/g, ' ');
    },

    getCookie: function (name) {
        var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
        if (arr = document.cookie.match(reg))
            return decodeURIComponent(arr[2]);
        else
            return '';
    },
    dialog: {
        _loadingText: function () {
            var e = '<div class="sk-cube-grid">';
            for (var t = 0; t < 9; t++) {
                e += '<div class="sk-cube sk-cube' + (t + 1) + '"></div>'
            }
            e += "</div>";
            return e
        },
        _close: function () {
            $(".close-x").on("click", function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                $("#js-dialog").remove()
            })
        },
        showLoading: function (e) {
            if ($(".loading").length == 0) {
                $("body").append("<div class='loading'><div class='img-out'><img src='" + WEB_CONFIG.global.H5_DOMAIN + "/life/assets/images/loading_03.gif' /></div></div>");
            }
        },
        hideLoading: function () {
            $(".loading").remove();
        },
        showMessage: function (message, fn) {
            var n =
                    '<div class="pop" id="js-dialog">' +
                    '<div class="bg-layer"></div>' +
                    '<div class="pop-wrap">' +
                    '<h4>提 示</h4>' +
                    '    <div class="artic-cont">' +
                    '       <p align="center">' + (message || '服务繁忙，请稍后再试!') + '</p>' +
                    '   </div>' +
                    '</div>' +
                    '</div>';

            $("#js-dialog").remove();
            $(n).appendTo($("body"));

            setTimeout(function () {
                $("#js-dialog").remove();
                if (typeof fn === "function") fn();
            }, 2e3);
            this._close()
        },

        showTips: function (res, callback) {
            // if($(".toast").length>0){
            //     //如果含有toast条立即删除生成新toast
            //     clearTimeout(window.toastTime);
            //     $(".toast").off();
            //     $(".toast").remove();
            // }
            // var _html="<div class='toast show'>"+res+"</div>";
            // $(_html).appendTo("body");
            // $(".toast").on("webkitAnimationEnd.tshow",function(){
            //     $(".toast").off(".tshow");
            //     window.toastTime=setTimeout(function(){
            //         $(".toast").addClass("hide");
            //         $(".toast").on("webkitAnimationEnd.thide",function(){
            //             $(".toast").off(".thide");
            //             $(".toast").remove();
            //             (callback && typeof(callback) === "function") && callback();
            //         });
            //     },1500);
            // });
            if ($(".toast").length > 0) {
                //如果含有toast条立即删除生成新toast
                clearTimeout(window.toastTime);
                clearTimeout(window.removeToastTime);
                $(".toast").remove();
            }
            var _html = "<div class='toast show'>" + res + "</div>";
            $(_html).appendTo("body");
            window.toastTime = setTimeout(function () {
                $(".toast").removeClass('show').addClass('hide');
                (callback && typeof(callback) === "function") && callback();
            }, 1500);
            window.removeToastTime = setTimeout(function () {
              $('.toast').remove();
            }, 2500);

        },

    },
    /**
     * 时间转换
     * @param dateStr 日期：yyyyMMddhhmmss
     * @param dateType
     * @returns {string}
     */
    formatDate: function (dateStr, dateType) {
        //ea 的时间格式为统一格式YYYYMMDDhh24mmss
        //console.log(dateStr)

        if (typeof dateStr !== 'string') {
            dateStr = dateStr.toString();
        }

        var o = {
            "YYYY": dateStr.substring(0, 4), //年
            "MM": dateStr.substring(4, 6), //月
            "DD": dateStr.substring(6, 8), //日
            "hh": dateStr.substring(8, 10), //时
            "mm": dateStr.substring(10, 12), //分
            "ss": dateStr.substring(12, 14) //秒
        };

        // if (/(y+)/.test(fmt)) {
        //     fmt = fmt.replace(RegExp.$1, (nowdate.getFullYear() + "").substr(4 - RegExp.$1.length));
        // }
        // for (var k in o) {
        //     if (new RegExp("(" + k + ")").test(fmt)) {
        //         fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1)
        //             ? (o[k])
        //             : (("00" + o[k]).substr(("" + o[k]).length)));
        //     }
        // }
        if (dateType == 'noYYYY') {
            return o.MM + '月' + o.DD + '日 ' + o.hh + ':' + o.mm + ':' + o.ss
        }
        if (dateType == 'YMDhm') {
            return o.YYYY + '/' + o.MM + '/' + o.DD + ' ' + o.hh + ':' + o.mm;
        } else {
            return o.YYYY + '-' + o.MM + '-' + o.DD + ' ' + o.hh + ':' + o.mm + ':' + o.ss;
        }

    },
    /**
     * 时间转换
     * @param e 日期
     * @param t 格式
     * @returns {*}
     */
    formatDate2: function (e, t) {
        if (Object.prototype.toString.call(e) === "[object String]") {
            if (/^\d{14}$/.test(e)) {
                e = Util.formatDate(e);
            }
            e = e.indexOf('.') > 0 ? new Date(e.replace(/\./g, "/")) : e.indexOf('-') > 0 ? new Date(e.replace(/\-/g, "/")) : new Date(e.replace(/\-/g, "/"));
        }

        var n = {
            "M+": e.getMonth() + 1,
            "d+": e.getDate(),
            "h+": e.getHours(),
            "m+": e.getMinutes(),
            "s+": e.getSeconds(),
            "q+": Math.floor((e.getMonth() + 3) / 3),
            S: e.getMilliseconds()
        };

        if (/(y+)/.test(t)) {
            t = t.replace(RegExp.$1, (e.getFullYear() + "").substr(4 - RegExp.$1.length))
        }
        for (var a in n) {
            if (new RegExp("(" + a + ")").test(t)) {
                t = t.replace(RegExp.$1, RegExp.$1.length == 1 ? n[a] : ("00" + n[a]).substr(("" + n[a]).length))
            }
        }
        return t
    },
    /**
     * 回到顶部
     */
    gotop: function () {
        $('.go-top').on('click', function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();

            $('html,body').scrollTop(0)
        })

    },

    getQueryHash: function (name) {
        if (location.href.indexOf("#") == -1 || location.href.indexOf(name + '=') == -1) {
            return '';
        }
        var queryString = location.hash.replace(/\#/i, '');
        var parameters = queryString.split("#");

        var pos, paraName, paraValue;
        for (var i = 0; i < parameters.length; i++) {
            pos = parameters[i].indexOf('=');
            if (pos == -1) {
                continue;
            }
            paraName = parameters[i].substring(0, pos);
            paraValue = parameters[i].substring(pos + 1);

            if (paraName == name) {
                return unescape(paraValue.replace(/\+/g, " "));
            }
        }
        return '';
    },

    setQueryHash: function (extParams) {

        var parameters = location.hash.split('#'),
            qsArr      = [],
            newParams  = {};

        for (var i = 0; i < parameters.length; i++) {
            var vArr = parameters[i].split('=');
            if (!!vArr[0]) {
                newParams[vArr[0]] = vArr[1];
            }
        }

        $.extend(newParams, extParams || {});

        for (var k in newParams) {
            qsArr.push(k + '=' + newParams[k]);
        }

        var url = [location.origin, location.pathname, location.search, '#', qsArr.join('#')].join('');

        history.pushState('', '', url);

    },

    /**
     * 动态设置URL参数
     * @param extParams object {key: value}
     */
    setQuery: function (extParams) {

        var matchHash = window.location.hash.match('([\?]).*'),
            qs        = [window.location.search, !!matchHash ? matchHash[0] : ''].join('&').replace(/\?/g, ''),
            qsArr     = [],
            params    = {};

        qs.split('&').forEach(function (item) {
            var sp = item.split('=');
            if (!!sp[0]) params[sp[0]] = sp[1]
        })

        this.extend(params, extParams || {});

        for (var key in params) {
            qsArr.push(key + '=' + params[key]);
        }

        var url = [
            location.origin,
            location.pathname,
            '?',
            qsArr.join('&'),
            location.hash.split('?').shift()
        ].join('');

        history.pushState('', '', url);

    },

    /**
     * 设置默认选中的tab
     * @param name
     * @param $target
     */
    setDefaultTab: function (name, $target) {

        var tabName     = Util.getQuery(name) || Util.getQueryHash(name),
            $tabs       = $target.find('li'),
            $activedTab = $tabs.filter('[data-tab="' + tabName + '"]');

        if ($activedTab.length === 0) {
            $activedTab = $tabs.first()
        }

        $activedTab.trigger('click')
    },

    /**
     *
     * @param excepts
     * @param params
     */
    setHistory: function (excepts, params) {

        if (excepts && !(excepts instanceof Array)) {
            excepts = []
        }

        var search = this.getQueryString(excepts, params || {}),

            url    = [location.origin, location.pathname, '?', search].join('');

        history.pushState('', '', url);

    },

    /**
     * 手机号码格式化
     * @param value
     * @returns {string|*|XML|void}
     */
    mobileFilter: function (value) {
        return value.replace(/(^\d{3}|\d{4}\B)/g, "$1 ");
    },

    /**
     * 版本比较
     * @param version1
     * @param version2
     * @returns {*}
     */
    compareVersion: function (ver1, ver2) {
        var responseData = {};
        if (ver1 == null || ver2 == null) {
            responseData.state = 1;
            responseData.msg = "缺少参数";
            return responseData;
        }
        var version1pre = parseFloat(ver1);
        var version2pre = parseFloat(ver2);
        var version1next = ver1.replace(version1pre + ".", "");
        var version2next = ver2.replace(version2pre + ".", "");
        if (version1pre > version2pre) {
            return true;
        } else if (version1pre < version2pre) {
            return false;
        } else {
            if (version1next >= version2next) {
                return true;
            } else {
                return false;
            }
        }
    },
    setAppStyle: function () {
        var appname    = this.getQuery('appname'),
            st         = this.getQuery('st'),
            appVersion = window.navigator.appVersion,
            el         = document.getElementsByTagName('html')[0],
            klass      = el.className.split(/\s/gi);

        var device  = '',
            version = '';
        if (/Android/.test(appVersion)) {
            device = 'android';
            version = appVersion.substr(appVersion.indexOf('Android') + 8, 3).replace(/\./, '');
        } else if (/iPhone|iPad/.test(appVersion)) {
            device = 'ios';
            var m = appVersion.match(/\d+_\d+/);

            version = !m ? '' : m[0].replace(/_/g, '');
        }

        var platform = (appname && !st) ? 'isnative' : 'isbrowser';

        klass.push(platform);
        device && klass.push(device);
        device && klass.push(device + '-' + version)

        el.className = klass.filter(function (item) {
            return !!item;
        }).join(' ');

        window.platform = platform;

    },
    /**
     * 获取native的APP信息
     */
    getAppInfo: function () {
        var handlerData = {
            "apiName": 'getUserInfo',
            "params": {
                "demokey": "demovalue"
            }
        }
        window.WebViewJavascriptBridge.callHandler('appinfoHandler', handlerData, function (result) {
            if (typeof result == 'string') {
                result = JSON.parse(result)
            }
            $.extend(WEB_CONFIG.appInfo, result.data)
        });

    },

    /**
     * 设置友盟数据采集
     */
    setCTMData: function () {
        var c = document.getElementsByTagName("head")[0],
            a = document.createElement("script");
        a.type = "text/javascript",
            a.charset = "utf-8",
            a.async = !0,
            a.timeout = 12e4,
            a.src = 'https://s19.cnzz.com/z_stat.php?id=1261992953&web_id=1261992953';
        return a.onerror = a.onload, c.appendChild(a);
    },
    /**
     * 检测是否是APP
     * @returns {*|string|boolean}
     */
    isApp: function () {

        return this.getQuery('appname') && !this.getQuery('st')
    },
    extend: function (to, _from) {
        for (var key in _from) {
            to[key] = _from[key];
        }
        return to
    },
    /**
     * 优化拉动页面反弹问题
     */
    setScrollerBounce: function ($target, fn1, fn2) {

        $target.on('touchmove', function (e) {

            var clientX      = e.touches[0].clientX,
                clientY      = e.touches[0].clientY,
                clientWidth  = document.documentElement.clientWidth,
                clientHeight = document.documentElement.clientHeight;
            //上拉到顶
            //下拉到底

            if (clientY < 2 || /*上拉到顶*/
                clientX < 5 ||
                clientX > (clientWidth - 5) ||
                (clientY > (clientHeight - 5))
            ) {
                $(this).trigger('touchend')
            }

            fn1 && fn1();

        }).on('touchend', function (e) {
            fn2 && fn2();
        });

    },

    getToken: function () {
        var token = (this.getCookie('token') || this.getQuery('token')) || localStorage.getItem('token');
        return decodeURIComponent(token);
    },
    /**
     * 格式化销量
     * @param num
     * @returns {*}
     */
    formatGoodsSales:function(num) {

        if (/[^\d+\.]/gi.test(num)) {
            return num
        }

        num = parseInt(num);

        return num > 9999 ? (num / 10000 + '万') : num;
    }
};

//避免重复设置class
!window.platform && Util.setAppStyle();
