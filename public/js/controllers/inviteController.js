define('inviteController', ['jsbridge', 'vue', 'dialog', 'inviteService'],
    function (jsbridge, Vue, d, inviteService) {

        var inviteController = function () {};
        var jb = new jsbridge();
        var is = new inviteService();
        inviteController.prototype = {
            /**
             * 配置微信
             * @returns {{title: string, desc: string, link: string, imgUrl: string}}
             */
            setShareData: function () {

                var link = [location.origin.replace(/https/, "http"), '/life/assets/pages/personal/invite-share.html', '?toInviteCode=' + Util.getQuery('toInviteCode') + '&iconUrl=' + Util.getQuery('iconUrl'), '&env=' + Util.getQuery('env')].join('');
                if (Util.getQuery('env') === 'test') {
                    link = [location.origin.replace(/https/, "http"), ':8128', '/life/assets/pages/personal/invite-share.html', '?toInviteCode=' + Util.getQuery('toInviteCode') + '&iconUrl=' + Util.getQuery('iconUrl'), '&env=' + Util.getQuery('env')].join('');
                }
                var imageUrl = location.href.substring(0, location.href.indexOf('assets') - 1) + '/assets/images/share.jpg';

                return {
                    link: link, // 分享链接
                    imgUrl: imageUrl, // 分享图标
                    title: '我的生活我做主',
                    desc: '这是一个可以提高你生活质量的APP!'
                }
            },
            /**
             * 设置微信分享
             */
            setWXShare: function () {
                var _this = this;

                //判断是否是微信浏览器
                function isWeiXin() {
                    var ua = window.navigator.userAgent.toLowerCase();
                    return ua.match(/MicroMessenger/i) == 'micromessenger';
                }

                if (isWeiXin()) {

                    $("html").addClass("wx");

                    // 微信分享
                    var shareData = {
                        // title: "年货回家 粤享欢乐", // 分享标题
                        // desc: "广东EA年货节", // 分享描述
                        type: "link", // 分享类型,music、video或link，不填默认为link
                        dataUrl: "", // 如果type是music或video，则要提供数据链接，默认为空
                        success: function () {}, // 用户确认分享后执行的回调函数
                        cancel: function () {} //用户取消分享后执行的回调函数
                    };
                    $.WeiXin($.extend(shareData, _this.setShareData())).share();
                }
            },
            /**
             * 终端类型
             */
            getBrowserType: function () {
                var ua = navigator.userAgent.toLowerCase();
                var _browser = {
                    isWeixin: (/MicroMessenger/i).test(ua),
                    isIos: (/iPhone\sOS/i).test(ua),
                    isAndroid: (/Android/i).test(ua),
                    androidVersion: ua.substr(ua.indexOf('android') + 8, 3) || ''
                }
                return _browser

            },
            /**
             * app  分享页面
             */
            init: function () {
                var _this = this;

                $('#inviteCode').html(Util.getQuery('toInviteCode'));
                $('#inviteNum').html(Util.getQuery('toInviteAmount'));
                if(!!Util.isApp()){
                    jb.topbarHandler('right', '', '分享', 'shareJavascriptHandler');

                    //调起分享组件
                    window.WebViewJavascriptBridge.registerHandler('shareJavascriptHandler', function (data, responseCallback) {
                        var sd = _this.setShareData();
                        var shareData = {
                            "id": "",
                            "name": "",
                            "title": sd.title,
                            "logo": sd.imgUrl,
                            "content": sd.desc,
                            "linkUrl": sd.link,
                            "codePicUrl": "",
                            "comName": "星链",
                            "comDomain": location.host
                        };
                        jb.shareHandler(shareData);
                    });
                }else{
                    _this.setWXShare();
                }
            },
            /**
             * 被分享页面
             */
            initShare: function () {

                var _this = this;
                var data = {
                    downloadLink: {
                        ios: '#',
                        android: '#'
                    },
                    browserInfo: _this.getBrowserType(),
                    inviteInfo: {
                        toInviteCode: Util.getQuery('toInviteCode'),
                        iconUrl: Util.getQuery('iconUrl') || location.href.substring(0, location.href.indexOf('assets') - 1) + '/assets/images/icon_user_default.png'
                    },
                    popStatus: false
                }

                _this.setWXShare();
                _this.getDownloadUrl().then(function (androidData) {
                    console.log(data.downloadLink.ios);
                    console.log(WEB_CONFIG.messageBox.appurl_ios)
                    data.downloadLink.ios = WEB_CONFIG.messageBox.appurl_ios;
                    data.downloadLink.android = androidData.state == 0 ? (androidData.data.list.length ? androidData.data.list[0].downloadUrl : '#') : '#';
                    _this.shareFunc(data);
                }).fail(function () {
                    jb.toastHandler('获取下载链接失败');
                    _this.shareFunc(data);
                });

            },
            shareFunc: function (data) {
                var _this = this;
                var shareVm = new Vue({
                    el: '#invShare',
                    data: data,
                    methods: {
                        gotodownload: function (url) {
                            if (data.browserInfo.isWeixin) {
                                data.popStatus = true;
                                return
                            }
                            location.href = url
                        },
                        _select: function (element) {
                            var selectedText;
                            //
                            if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
                                element.focus();
                                element.setSelectionRange(0, element.value.length);

                                selectedText = element.value;
                            } else {
                                if (element.hasAttribute('contenteditable')) {
                                    element.focus();
                                }

                                var selection = window.getSelection();
                                var range = document.createRange();

                                range.selectNodeContents(element);
                                selection.removeAllRanges();
                                selection.addRange(range);

                                selectedText = selection.toString();
                            }
                            return selectedText;
                        },
                        _copyToClipboard: function (elemId) {
                            var target = document.getElementById("hiddenText");
                            target.textContent = $('#' + elemId).html();
                            console.log(target.textContent);
                            this._select(target);
                            document.execCommand("copy");
                        },
                        copytoclip: function () {
                            this._copyToClipboard('code');
                            $.dialog({
                                type: 'tips',
                                infoText: /iPhone OS 8_/i.test(navigator.userAgent) ? '您使用的iOS版本较低,请手动复制' : '复制成功',
                                autoClose: 1000
                            })
                        },
                        hidePop: function () {

                            data.popStatus = false;
                        }
                    }
                })
            },

            getDownloadUrl: function () {
                return is.getDownloadLink({
                    data: {
                        app_project: 1,
                        app_os: 1,
                        pageNum: 1,
                        pageSize: 1
                    }
                });
            }

        };
        return inviteController;
    });
