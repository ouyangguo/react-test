/**
 * 明星旗舰店列表
 */

define('storeController', ['storeService', 'iscroll', 'handlebars', 'jsbridge', 'livequery', 'dialog'],
    function (StoreService, IScroll, Handlebars, jsbridge) {
        var ss = new StoreService();
        var jb = new jsbridge();

        var isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
        function handlebarfn(tmplid, cntid, result, appendtype) {
            var tmplHtml = $(tmplid).html();
            var tmplCompier = Handlebars.compile(tmplHtml);
            var $appendContent = $(cntid);
            if (appendtype) {
                $appendContent.html(tmplCompier(result));
                return
            }
            $appendContent.append(tmplCompier(result));
        }

        var storeController = function () {};
        storeController.prototype = {
            /**
             * 配置微信
             * @returns {{title: string, desc: string, link: string, imgUrl: string}}
             */
            setShareData: function () {
                var _shareinfo = {};
                _shareinfo = JSON.parse(localStorage.getItem('shareinfo'));

                return {

                    "id": _shareinfo.id || '',
                    "name": _shareinfo.name || '',
                    "title": _shareinfo.title || '',
                    "logo": _shareinfo.logo || '',
                    "content": _shareinfo.content || '',
                    "linkUrl": _shareinfo.linkUrl || '',
                    "codePicUrl": _shareinfo.codePicUrl || '',
                    "comName": _shareinfo.comName || '',
                    "comDomain": _shareinfo.comDomain || ''
                }

            },

            getStoreList: function (type) {
                var $cntE = '', $tmpl = '';
                var cp = window.ListPages[type];
                var noDataText = '';
                switch (type) {
                    case 'storelist':
                        $cntE = '#cnt_storelist .wrapitem';
                        noDataText = '暂无内容';
                        break;
                }
                var _this = this;
                var listParams = {
                    pagesize: cp.pageSize,
                    pagenum: cp.pageNum,
                    adid: Util.getQuery('adid') || '',
                    ispubservice: Util.getQuery('ispubservice') || '0',
                    token: Util.getQuery('token')
                }

                if (cp.islast) {
                    //设置状态
                    cp.loadingStep = 0;
                    //移除loading
                    cp.pullUpEl.removeClass('loading');
                }

                //获取列表
                return !cp.islast && ss.getAdStoreList(listParams).then(function (data) {


                        jb.loadingHandler('hide');
                        if (data.state == 0) {

                            var pageTitle = data.data.adInfo.adName || '旗舰店列表';
                            //设置标题
                            jb.topbarHandler('center', '', pageTitle);
                            document.title = pageTitle;
                            //获得分享信息
                            localStorage.setItem('shareinfo', JSON.stringify(data.data.adInfo.shareInfo))

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

                                if (data.data.list.length) {

                                    $.map(data.data.list, function (item) {

                                        item.hastags = (item.eptitle || item.discountTitle || item.fullReduceInfo||item.couponList)
                                        item.ispubservice = listParams.ispubservice == 1;

                                        return item
                                    })
                                }

                                var renderType = (cp.refreshStatus == 0) ? 'replace' : '';

                                //....
                                //刷新用html，加载用append
                                handlebarfn('#tmpl_storelist', $cntE, data.data, renderType);

                                //跳转店铺首页- 供应商首页
                                $('.wrapitem').on('click', 'li', function (event) {
                                    event.preventDefault();
                                    event.stopImmediatePropagation();
                                    var _shopid = $(this).data('shopid') + '';
                                    var _params = {
                                        shopid: _shopid
                                    }
                                    console.log(_params)

                                    //跳转页面
                                    jb.routerHandler(WEB_CONFIG.nativePage.shop.supplierShop.id, JSON.stringify(_params));

                                });

                                //更新ListPage
                                if (data.data.isLastPage == 0) {
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
                            if (typeof data == "string") {
                                data = JSON.parse(data);
                            }
                            console.log(data.msg);
                            jb.toastHandler(data.msg);
                        }

                    })
                        .then(function () {

                            _this.iscrollRefresh(type);
                        })
                        .fail(function (data) {
                            if (typeof data == "string") {
                                data = JSON.parse(data);
                            }
                            //if(data.state=='6829201')
                            jb.toastHandler(data.msg);
                            //jb.toastHandler('网络开小差，稍后再试');
                        })
                        .done(function () {
                            cp.loadingStep = 0;
                        })

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
                _this.getStoreList(type);
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
                                _this.getStoreList(type);
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
                var _this = this;
                this.listScroll();
                this.getStoreList('storelist');

                jb.topbarHandler('right', '', '分享', 'shareJavascriptHandler');

                //调起分享组件
                window.WebViewJavascriptBridge.registerHandler('shareJavascriptHandler', function (data, responseCallback) {
                    var shareData = _this.setShareData();
                    jb.shareHandler(shareData);
                });
            }
        };
        return storeController;
    });
