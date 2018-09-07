/*！
 * 客服中心
 */

define('helperController', ['helperService', 'jsbridge', 'vue', 'livequery', 'dialog'], function (HelperService, jsbridge, Vue) {
    var hs = new HelperService();
    var jb = new jsbridge();
    var isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    var sitetype = Util.getQuery("sitetype") || 0; //0：生活app 1：云店app 2:友店app 3:云商 4：友店wap

    var HelperController = function () {
    };
    HelperController.prototype = {
        /**
         * 手机号码格式化344
         * 操作：输入及删除
         */
        formatTel: function () {
            var $target         = $('#tel'),
                isDeleteMode    = false,
                isPasteMode     = false,
                currentPosition = 0;

            $target.on('input', function (e) {
                var $this              = $(this),
                    value              = $this.val().replace(/\s/g, ""),
                    rs                 = formatNumber(value),
                    selectionStartPrev = $this.get(0).selectionStart;

                $this.val(rs.after)
                //135 1214 5548
                var selectionStart = $this.get(0).selectionStart,
                    selectionEnd   = $this.get(0).selectionEnd,
                    delta          = $.inArray(selectionStartPrev, [4, 9]),
                    pos            = selectionEnd;

                //alert(selectionStart)

                pos = (delta > -1) ? (selectionStartPrev + ((delta == 0) ? (delta + 1) : delta)) : selectionStartPrev;

                if (isDeleteMode) {
                    if (delta > -1) {

                        if (delta == 0) {
                            pos = pos - 2;
                        } else {
                            pos = pos - 1;
                        }
                    }

                }
                if (isPasteMode) {
                    pos = selectionEnd;
                }

                $this.get(0).setSelectionRange(pos, pos);

                isDeleteMode = false;
                isPasteMode = false;

            })

            $target.on('keydown', function (event) {

                var $this          = $(this),
                    selectionStart = $this.get(0).selectionStart;

                currentPosition = selectionStart;

                if (event.keyCode === 8) {
                    isDeleteMode = true;
                }

            })
            $target.on('paste', function (event) {
                isPasteMode = true;
            })

            function formatNumber(value) {

                return {
                    before: value,
                    after: value.replace(/(^\d{3}|\d{4}\B)/g, "$1 ")
                }
            }

        },
        /**
         * 问题分类
         */
        getHotquestion: function () {
            var _params = {
                siteType: sitetype
            }
            hs.getQuestionTypeLists(_params)
                .then(function (data) {
                    if (typeof data == 'string') {
                        data = JSON.parse(data)
                    }
                    $.map(data.data.questionTypeDoList, function (ls, index) {
                        ls.questiondetail = WEB_CONFIG.global.API_DOMAIN + '/newbuyer/30/service/questionListByTypeId.do?questionTypeId=' + ls.id;
                        return ls
                    })
                    if (data.state == 0) {
                        var hotquestionVm = new Vue({
                            el: '#hotquestion',
                            data: data.data,
                            methods: {
                                goToDetail: function (categoryId, categoryName) {

                                    var _params = {
                                        url: location.origin + '/life/assets/pages/question/detail.html?id=' + categoryId + '&name=' + encodeURIComponent(categoryName)
                                        //url: './question/detail.html?id=14&name=注册下载'
                                    }
                                    jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(_params), _params.url)

                                }
                            }
                        })
                    }
                })
                .fail(function () {
                    jb.toastHandler('请求失败')
                })

        },
        /**
         * 问题详情页
         */
        getQuestionDetail: function () {
            var _title = decodeURIComponent(Util.getQuery('name')),
                _id    = Util.getQuery('id');
            jb.topbarHandler('center', '', _title);
            if (!Util.isApp()) {
                $('.header-wrap .header-title').html(_title);
            }
            ;
            var _params = {
                questionType: _id
            }
            hs.getQuestionDetails(_params)
                .then(function (data) {
                    var detailVm = new Vue({
                        el: '#detailWrapper',
                        data: data

                    })
                })
                .then(function () {

                    $('#detailWrapper').removeClass('none');

                });
        },
        init: function () {
            if (!Util.isApp()) {
                $('.go-back').on('click', function () {
                    var _params = {
                        url: ''
                    };
                    jb.routerHandler(WEB_CONFIG.nativePage.wapPage.ceter.id, JSON.stringify(_params));
                });
            }
            $('#js_feedbackbtn').on('click', function (event) {

                event.preventDefault();

                var appname = Util.getQuery('appname');
                var version = !!appname && parseInt(appname.match(/\d+/g).join(''));
                console.log(version)
                if (Util.isApp()) {
                    var _params = {};
                    if (version < 430) {
                         _params = {
                            url: location.origin + '/life/assets/pages/feedback.html?' + Util.getQueryString()
                        };
                        jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(_params), _params.url);
                    } else {
                        jb.routerHandler(WEB_CONFIG.nativePage.thirdparty.customerServiceCenter.id, JSON.stringify(_params));
                    }

                } else {
                    location.href = 'http://yiyatong.udesk.cn/im_client/?web_plugin_id=21500'
                }
            });

            //tel-server
            $('#tel-server').on('click', function (e) {
                e.preventDefault()
                e.stopImmediatePropagation();

                location.href = $(this).data('href')

            });

            this.getHotquestion();
        },

    }

    return HelperController;
});
