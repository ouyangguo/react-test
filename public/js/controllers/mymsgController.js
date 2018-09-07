define('mymsgController', ['mymsgService', 'iscroll', 'handlebars', 'jsbridge', 'livequery', 'dialog'], function (MymsgService, IScroll, Handlebars, jsbridge, livequery, dialog) {
    var ms = new MymsgService();
    var jb = new jsbridge();

    var isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    function handlebarfn(tmplid, cntid, result, appendtype) {
        var tmplHtml = $(tmplid).html();
        Handlebars.registerPartial("partialnotice", $("#tmpl_nodata").html());
        var tmplCompier = Handlebars.compile(tmplHtml);
        var $appendContent = $(cntid);
        if (appendtype) {
            $appendContent.html(tmplCompier(result));
            return
        }
        $appendContent.append(tmplCompier(result));
    }

    var mymsgController = function () {};
    mymsgController.prototype = {

        getMymsgList: function (type) {
            var $cntE = '', $tmpl = '';
            var cp = window.ListPages[type];
            var noDataText = '';
            switch (type) {
                case 'msglist':
                    $cntE = '#cnt_msglist .wrapitem';
                    noDataText = '暂无消息<br/>等待爱的叮咛';
                    break;
            }
            var _this = this,
                token = Util.getQuery('token');
            var Utoken = token.length > 20 ? token : '';

            var listParams = {
                pagesize: cp.pageSize,
                pagenum: cp.pageNum,
                token: Util.getCookie('token') || Utoken
            }

            //wap传过来的token会出现以下情况都过滤掉
            // if(listParams.token == 'null' || listParams.token == '""'){
            //    listParams.token = '';
            // }

            if (listParams.token.length < 20) {
                listParams.token = '';
            }

            if (cp.islast) {
                //设置状态
                cp.loadingStep = 0;
                //移除loading
                cp.pullUpEl.removeClass('loading');
            }

            if (!listParams.token) {
                //未登录
                jb.loginHandler();
            } else {
                //获取列表
                return !cp.islast && ms.getMymsgList(listParams)
                    .then(function (data) {
                        jb.loadingHandler('hide');
                        if (data.state == 0) {

                            //是否空数据 根据total判断 total=0 没数据
                            if (data.data.total == 0) {
                                var tmpObj = {
                                    noDataText: noDataText,
                                    isNodata: true
                                }
                                $.extend(data.data, tmpObj);

                                $('body').css('background', '#ffffff');
                                handlebarfn('#tmpl_mymsglist', '#cnt_msglist', data.data, 'replace');
                            }
                            else {
                                //格式化数据
                                $.map(data.data.msgList, function (ls, index) {

                                    ls.sendTime = Util.formatDate2(ls.sendTime, 'MM-dd');
                                    ls.msgStatus = (ls.msgStatus == 1);
                                    if (ls.businessContent && ls.businessContent.indexOf('deal-details.html') > 0) {
                                        var targetcnt = JSON.parse(ls.businessContent);
                                        var olddealdetails = targetcnt.tc.tu;
                                        var reg = new RegExp('(' + olddealdetails.replace(/\./g, '\\.').replace(/\//g, '\/').replace(/\?/g, '\\?') + ')', 'g')
                                        ls.businessContent = ls.businessContent.replace(reg, '$1&from=msg')
                                    }
                                    return ls;
                                })
                                //刷新用html，加载用append
                                if (cp.refreshStatus == 0) {
                                    handlebarfn('#tmpl_mymsglist', $cntE, data.data, 'replace');
                                } else {
                                    handlebarfn('#tmpl_mymsglist', $cntE, data.data);
                                }

                                //跳转详情页
                                $('.wrapitem').on('click', 'li', function (event) {
                                    event.preventDefault();
                                    event.stopImmediatePropagation();

                                    var ordercen = localStorage.getItem('ordercen') && JSON.parse(localStorage.getItem('ordercen')) || {};
                                    var rul = ordercen.returnurl || '';
                                    var returnurl = Util.getQuery('returnUrl') && Util.getQuery('returnUrl') || rul;

                                    localStorage.setItem('ordercen', JSON.stringify({'returnurl': returnurl}));
                                    var _pageParam = $(this).data('urlinfo');
                                    var postparams = {
                                        msgid: $(this).data('msgid'),
                                        msgtype: '2',
                                        token: Util.getQuery('token')
                                    }
                                    //标记为已读 移除红点
                                    var noreadflag = $(this).find('.disc-sta');
                                    if (!!noreadflag.length) {
                                        ms.setMsgStatus(postparams)
                                            .then(function (data) {
                                                if (data.state == 0) {
                                                    noreadflag.remove()
                                                }
                                            })
                                    }
                                    //跳转页面
                                    jb.routerHandler(_pageParam.tc.tm.toString(), _pageParam.tc.tp);

                                });

                                //更新ListPage
                                if (data.data.isLast == 0) {
                                    //不是最后一页
                                    cp.pageNum++;
                                } else {
                                    //没有更多数据
                                    cp.pullUpL.html('没有更多数据了');
                                    cp.islast = true;
                                }
                                //移除loading
                                cp.pullUpEl.removeClass('loading');
                            }

                        } else {
                            //请求数据不成功
                            data = typeof data == 'string' ? JSON.parse(data) : data;
                            if (data.state == 3829201) {
                                //token过期
                                jb.loginHandler();
                            } else {
                                console.log(data.msg);
                                jb.toastHandler(data.msg);
                            }

                        }

                    })
                    .then(function () {
                        _this.iscrollRefresh(type);
                    })
                    .fail(function () {
                        jb.toastHandler('网络开小差，稍后再试');
                    })
                    .done(function () {
                        cp.loadingStep = 0;
                    })
            }
        },

        /**
         * iscroll refresh
         */
        iscrollRefresh: function (type) {
            setTimeout(function () {
                window.ListPages[type].pullUpEl.hide();
                window.ListScrollers && window.ListScrollers[type].refresh();
            }, 500)
        },
        /**
         * 下拉刷新
         */
        refreshList: function (type) {
            var _this = this;
            var cp = window.ListPages[type];
            cp.islast = false;
            cp.refreshStatus = 0;
            cp.pageNum = 1;
            cp.pageSize = 10;
            cp.pullDownEl.removeClass('loading');
            cp.pullDownL.html('下拉显示更多...');
            cp.pullDownEl.hide();
            //cp.pullUpEl.hide();
            _this.getMymsgList(type);
        },
        /**
         * 定义iscroll
         */
        listScroll: function () {
            window.ListScrollers = {};
            window.ListPages = {};
            var _this     = this,
                $wrappers = $('.wrapper');

            var pulldownHtml = '<div class="pullDown"><span class="pullDownIcon"></span><span class="pullDownLabel"></span></div>';
            var pullupHtml = '<div class="pullUp"> <span class="pullUpIcon"></span> <span class="pullUpLabel"></span></div>';

            $wrappers.each(function () {
                var cid   = $(this).attr('id'),
                    type  = $(this).data('tab'),
                    temp  = {},
                    temp2 = {};

                var _thisScroll = new IScroll('#' + cid, {
                    click: true,
                    tap: true,
                    //snap: true,
                    probeType: isIOS ? 3 : 2
                });
                var $thiswrapper = $(_thisScroll.wrapper);
                var wrapItemEl = $thiswrapper.find('.wrapitem');
                $(pulldownHtml).insertBefore(wrapItemEl);
                $(pullupHtml).insertAfter(wrapItemEl);

                temp2 = {
                    pullDownEl: $thiswrapper.find('.pullDown'),
                    pullDownL: $thiswrapper.find('.pullDownLabel'),
                    pullUpEl: $thiswrapper.find('.pullUp'),
                    pullUpL: $thiswrapper.find('.pullUpLabel'),
                    loadingStep: 0, //加载状态0默认，1显示加载状态，2执行加载数据，只有当为0时才能再次加载，这是防止过快拉动刷新
                    refreshStatus: 0,//0刷新，1加载更多
                    islast: false,
                    //scrollMaxY:0,
                    pageNum: 1,
                    pageSize: 10
                }

                _thisScroll.on('scroll', function () {
                    if (window.ListPages && window.ListPages[type]) {
                        temp2 = window.ListPages[type]
                    }
                    if (temp2.loadingStep == 0 && !temp2.pullDownEl.attr('class').match('flip|loading') && !temp2.pullUpEl.attr('class').match('flip|loading')) {

                        if (this.y > 5) {
                            //下拉刷新效果
                            //this.minScrollY=5;
                            temp2.refreshStatus = 0;
                            temp2.pullDownEl.show();
                            temp2.pullDownEl.addClass('flip');
                            temp2.pullDownL.html('准备刷新...');
                            temp2.loadingStep = 1;
                        } else if (this.y < (this.maxScrollY - 5)) {
                            //上拉加载效果
                            temp2.refreshStatus = 1;
                            temp2.pullUpEl.show();
                            temp2.pullUpEl.addClass('flip');
                            temp2.pullUpL.html('松开加载...');
                            if (temp2.islast) {
                                temp2.pullUpL.html('没有更多数据了。');

                            }
                            temp2.loadingStep = 1;
                        }
                    }

                    $(".lazyload-img").trigger("unveil");
                });
                //滚动完毕
                _thisScroll.on('scrollEnd', function () {
                    if (temp2.loadingStep == 1) {
                        if (temp2.pullUpEl.attr('class').match('flip|loading')) {
                            temp2.pullUpEl.removeClass('flip').addClass('loading');
                            temp2.pullUpL.html('Loading...');
                            if (temp2.islast) {
                                temp2.pullUpL.html('没有更多数据了。');
                                temp2.pullUpEl.hide();
                            }
                            temp2.loadingStep = 2;
                            _this.getMymsgList(type);
                        } else if (temp2.pullDownEl.attr('class').match('flip|loading')) {
                            temp2.pullDownEl.removeClass('flip').addClass('loading');
                            temp2.pullDownL.html('Loading...');

                            temp2.loadingStep = 2;
                            _this.refreshList(type);
                        }
                    }

                });

                //全局scroller
                temp[type] = _thisScroll;
                $.extend(window.ListScrollers, temp);

                //分页信息,默认1开始
                var lsp = {}
                lsp[type] = temp2;
                $.extend(window.ListPages, lsp);

            });

            document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

        },

        init: function () {
            this.listScroll();
            this.getMymsgList('msglist');

            if (!Util.isApp()) {
                var $head = $('.header-wrap');
                $head.removeAttr('style')
                $head.css('display', 'block');
                var hig  = $head.css('height') || 0,
                    higs = parseInt(hig);
                $('.wrapper').attr('style', 'top:' + higs + 'px');

                $('.go-back').on('click', function () {
                    var ordercen = localStorage.getItem('ordercen') && JSON.parse(localStorage.getItem('ordercen')) || {};
                    var _returnurl = ordercen.returnurl || Util.getQuery('returnUrl');
                    localStorage.setItem('ordercen', null);
                    location.href = decodeURIComponent(_returnurl);
                })
            }
        }
    };
    return mymsgController;
});
