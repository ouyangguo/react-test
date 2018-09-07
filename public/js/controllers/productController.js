/*!*
 * @description: 商品控制层
 * @authot: jahon
 * @date: 2017/02/11
 */

define('productController', ['productService', 'iscroll', 'handlebars', 'livequery', 'jsbridge', 'unveil'],
    function (ProductService, IScroll, Handlebars, livequery, jsbridge) {

        var productService = new ProductService();
        var jb = new jsbridge();

        var isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端

        var ProductController = function () {};

        function handlebarfn(tmplid, cntid, result, apendtype) {

            var tmplHtml = $(tmplid).html();
            Handlebars.registerPartial("partialnotice", $("#tmpl_nodata").html());
            var tmplCompier = Handlebars.compile(tmplHtml);
            var $appendContent = $(cntid);
            if (apendtype) {
                $appendContent.html(tmplCompier(result));
                return
            }
            $appendContent.append(tmplCompier(result));
        }

        /**
         * if语句扩展，支持数组输入
         */
        Handlebars.registerHelper("if2", function (value, test, options) {

            var flag = false;

            if (value && /,/gi.test(test)) {
                test = test.split(/,/);
                for (var i = 0; i < test.length; i++) {
                    if (value == test[i]) {
                        flag = true;
                        break;
                    }
                }

            } else {
                if (value && value == test) {
                    flag = true;
                }
            }

            // console.log('if2:', flag, value, test);

            if (flag) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }

        });

        ProductController.prototype = {
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
                    // "codePicUrl": _shareinfo.codePicUrl||'',
                    "comName": _shareinfo.comName || '',
                    "comDomain": _shareinfo.comDomain || ''
                }

            },

            // getTitle:function(params){
            //
            //     if (params.type == 1) {
            //       jb.topbarHandler('center', '', '店主推荐');
            //     }
            //     if (params.type == 2) {
            //       jb.topbarHandler('center', '', '本店上新');
            //     }
            //     if (params.type == 3) {
            //       jb.topbarHandler('center', '', '本店热卖');
            //     }
            // },
            /**
             * 购物车数量
             */
            setShoppingcarNum: function () {

                var params = {
                    data: {
                        t_id: +new Date(),
                        token: Util.getQuery('token'),
                    }
                };
                return productService.getCarNum(params)
                    .then(function (results) {

                        jb.loadingHandler('hide');

                        results = ( typeof results === 'string') ? JSON.parse(results) : results;

                        if (results.state == 0) {
                            // console.log(results.data)

                            var num = Util.getQuery('carnum') || results.data.numInCart;

                            var $car = $('.shopping-car').removeClass('none');
                            if (num > 99) num = 99;

                            if (num > 0) {
                                $car.find('span').removeClass('none').text(num);
                            }
                        }
                        else {
                            jb.toastHandler(results.msg);
                        }
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

                    });
            },
            getList: function (type) {
                var $cntE = '', $tmpl = '';
                var cp = window.ListPages[type];

                var noDataText = '';
                switch (type) {
                    case 'goodslist':
                        $cntE = '#cnt_goodslist .wrapitem';
                        noDataText = '暂无内容';
                        break;
                }

                var _this        = this,
                    tmplList     = '#tmpl-partial',
                    $listContent = '#item-wrap';

                var params = {
                    data: {
                        t_id: +new Date(),
                        shopid: Util.getQuery('shopid'),
                        type: Util.getQuery('type'),   // 1-店主推荐，2-本店上新，3-本店热卖
                        token: Util.getQuery('token'),
                        pagenum: cp.pageNum || '1',
                        pagesize: cp.pageSize || '20'
                    }
                };
                if (cp.islast) {
                    //设置状态
                    cp.loadingStep = 0;
                    //移除loading
                    cp.pullUpEl.removeClass('loading');
                }

                // _this.getTitle(params.data);

                return !cp.islast && productService.getList(params)
                    .then(function (results) {

                        jb.loadingHandler('hide');

                        results = ( typeof results === 'string') ? JSON.parse(results) : results;

                        if (results.state == 0) {

                            //设置标题
                            jb.topbarHandler('center', '', results.data.shareInfo.title);
                            //获得分享信息
                            localStorage.setItem('shareinfo', JSON.stringify(results.data.shareInfo))

                            if (results.data.total == 0) {

                                var tmpObj = {
                                    noDataText: noDataText,
                                    isNodata: true
                                }
                                $.extend(results.data, tmpObj);

                                $('body').css('background', '#ffffff');
                                handlebarfn(tmplList, $listContent, results.data, 'replace');

                            } else {
                                //格式化数据
                                // $.map(results.data.goodsList, function (ls, index) {
                                //
                                //     ls.goodsSales = Util.formatGoodsSales(ls.goodsSales)
                                //
                                //     return ls;
                                // })

                                //刷新用html，加载用append
                                var renderType = cp.refreshStatus === 0 ? 'replace' : '';
                                results.data.goodsList.length && handlebarfn(tmplList, $listContent, results.data, renderType);

                                //跳转详情页
                                $($listContent).on('click', 'li', function (event) {
                                    event.preventDefault();
                                    event.stopImmediatePropagation();
                                    var $thisEle = $(this);
                                    //跳转页面
                                    _this.web2ProductDetail($thisEle);

                                });

                                //更新ListPage
                                if (results.data.isLastPage == 0) {
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
                        }
                        else {
                            console.log(results.msg)

                            jb.toastHandler(results.msg);
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
                    });
            },
            /**
             * 跳转列表页-详情页(native)
             */
            web2ProductDetail: function ($this) {

                var params = {
                    goodsid: $this.data('goodsid'),
                    shopid: Util.getQuery('shopid')
                };
                var goodsType = $this.data('goodstype'),
                    pages     = WEB_CONFIG.nativePage.goods;

                params.goodsid = params.goodsid && params.goodsid + '';

                if (goodsType == 1) {
                    jb.routerHandler(pages.platformgoodsdetial.id, JSON.stringify(params));
                }
                if (goodsType == 3) {
                    jb.routerHandler(pages.shopgoodsdetial.id, JSON.stringify(params));
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
                _this.getList(type);
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

                                _this.getList(type);
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

            /**
             * 跳转到购物车
             */
            web2ShoppingCar: function () {

                $('.shopping-car').on('click', function (e) {

                    e.preventDefault();
                    e.stopImmediatePropagation();
                    var _params = {
                        //跳转到购物车默认展示小店商品列表tab
                        isToHome: '1'
                    };
                    jb.routerHandler(WEB_CONFIG.nativePage.shop.shoppingCar.id, JSON.stringify(_params));

                });

            },

            init: function () {

                var _this = this;

                this.setShoppingcarNum();
                this.web2ShoppingCar();
                this.listScroll();
                this.getList('goodslist');

                jb.topbarHandler('right', '', '分享', 'shareJavascriptHandler');

                //调起分享组件
                window.WebViewJavascriptBridge.registerHandler('shareJavascriptHandler', function (data, responseCallback) {
                    var shareData = _this.setShareData();
                    jb.shareHandler(shareData);
                });

                var titleType = parseInt(Util.getQuery('type'));
                switch (titleType) {
                    case 1:
                        jb.topbarHandler('center', '', '店主推荐', '');
                        document.title = '店主推荐';
                        break;
                    case 2:
                        jb.topbarHandler('center', '', '本店上新', '');
                        document.title = '本店上新';
                        break;
                    case 3:
                        jb.topbarHandler('center', '', '本店热卖', '');
                        document.title = '本店热卖';
                        break;
                    default:
                        break;
                }
            }

        };

        return ProductController;

    });
