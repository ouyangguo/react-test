/**
 * Created by jahon on 2016/9/27.
 */

define('couponController', ['couponService', 'handlebars', 'livequery', 'jsbridge', 'iscroll'],
    function (CouponService, Handlebars, livequery, jsbridge, IScroll) {
        var couponService = new CouponService();
        var isIOS = /iphone|ipad|ipod/gi.test(navigator.userAgent);
        var jb = new jsbridge();

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

        var CouponController = function () {};
        CouponController.prototype = {

            init: function () {
                this.listScroll();
                this.setTabNavi();
                this.setShoppingcarNum();
                this.web2ShoppingCar();
                this.web2ShopDetail();
                this.sumTopHeight();
                this.toWapCenterPage();
                
                if(Util.isApp()){
	                //右上角购物车
	                jb.topbarHandler('right', 'shoppingCar', '', 'shareJavascriptHandler');
	                window.WebViewJavascriptBridge.registerHandler('shareJavascriptHandler', function (data, responseCallback) {
		                //跳转
	                });
                }else{
                    
                }
            },

            /**
             * 获取优惠券列表
             * @param options {$target:$selector, stype:1}
             * @returns {*|Promise.<TResult>}
             */
            getList: function (options) {

                Util.setScrollerBounce($('.wrapper'));

                var _this           = this,
                    tmplList        = $("#tmpl-couponlist").html(),
                    tmplListCompier = Handlebars.compile(tmplList),
                    $listContent    = $('#' + options.tab),
                    $contentChild   = $($listContent.find('.coupon-items')),
                    stype           = options.tab == 'status-outdate' ? '2' : '1';

                //分部视图
                Handlebars.registerPartial("partial-bank", $("#tmpl-partial-bank").html());
                Handlebars.registerHelper('htmlEscape', function (string) {
                    return new Handlebars.SafeString(string)
                });

                var cp = window.ListPages[options.tab];

                var model = {
                    data: {
                        couponstatus: stype, //优惠券状态：1、未开始 2、进行中 3、已失效
                        pagesize: cp.pageSize || 10,
                        pagenum: cp.pageNum || 1
                    }
                }
                if (cp.islast) {
                    //设置状态
                    cp.loadingStep = 0;
                    //移除loading
                    cp.pullUpEl.removeClass('loading');
                }

                $.extend(model.data, _this.setDefaultParams());

                return !cp.islast && couponService.getList(model)
                    .then(function (result) {

                        if (result.state == 0) {

                            // result.data.list = [];
                            if (!result.data.list.length) {

                                var tmlpBank = $("#tmpl-partial-bank").html();
                                var tmplBankCompier = Handlebars.compile(tmlpBank);

                                // Util.dialog.showMessage('该店铺没有优惠券.');

                                $listContent.html(tmplBankCompier({message: '暂无内容'}));

                                return;
                            }

                            //url参数链
                            result.data.qs = Util.getQueryString();

                                $.map(result.data.list, function (item,index) {

                                    // limitShopRange	1,单店铺(店铺级)，2，多店铺(平台级)，3，全店铺(平台级)，4:单店铺(平台级)
                                    item.isStarCoupon = /2|3|4/.test(item.limitShopRange);

                                    var name        = '',
                                        isDoing     = false,
                                        //失效
                                        isUnavaible = false;

                                    switch (parseInt(item.status)) {
                                        case 1:
                                            // name = '未开始';
                                            // name = '&nbsp;';
                                            name = '立即使用';
                                            break;
                                        case 2:
                                            name = '已使用';
                                            isUnavaible = true;
                                            break;
                                        case 3:
                                            name = '已过期';
                                            // name = '已失效';
                                            isUnavaible = true;
                                            break;
                                    }

                                    item.kClass = options.tab;
                                    //只有已失效 已使用，界面才显示字样
                                    item.stypeIndex = isUnavaible ? true : false;
                                    item.stypeName = isUnavaible ? name : '';
                                    //是否是小店，企业店是小店的一种 1小店 2企业店 3旗舰店
                                    item.isSmallShop = item.shopType == '1' || item.shopType == '2' ? true : false;
                                    item.statusFormat = name;

                                //是否"进行中"
                                item.isDoing = isDoing;
                                item.isUnavaible = isUnavaible;
                                item.couponstatus = options.stype;

                                //format date
                                item.beginTimeYMD = item.beginTime && Util.formatDate2(item.beginTime, 'yyyy.MM.dd') || '';
                                item.endTimeYMD = item.endTime && Util.formatDate2(item.endTime, 'yyyy.MM.dd') || '';
                                item.beginTimeYMDs = item.beginTime && Util.formatDate2(item.beginTime, 'yyyy.MM.dd hh:mm') || '';
                                item.endTimeYMDs = item.endTime && Util.formatDate2(item.endTime, 'yyyy.MM.dd hh:mm') || '';

                                    //fotmat number
                                    item.minimumAmount = Math.ceil(item.minimumAmount);
                                    item.faceValue = Math.ceil(item.faceValue);
                                    // item.minimumAmountFormat = item.couponType == '2' ? item.couponName : '满' + item.minimumAmount + '元可用' || '';
                                    item.minimumAmountFormat = '满' + item.minimumAmount + '元可用';
                                    item.couponNameFormat = item.couponType == '2' ? item.couponGuide : item.couponName || '';

                                    item.faceValueFormat = item.faceValue && item.faceValue.toString().length >= 5 ? true : false;
                                return item
                            });

                            //刷新用html，加载用append

                            if (cp.refreshStatus == 0) {
                                $contentChild.html(tmplListCompier(result.data));
                            } else {
                                $contentChild.append(tmplListCompier(result.data));
                            }
                            result.data.faceValue

                            //更新ListPage
                            if (result.data.isLastPage == 0) {
                                //不是最后一页
                                cp.pageNum++;
                            } else {
                                console.log('没有更多')
                                //没有更多数据
                                cp.pullUpL.html('没有更多数据了');
                                cp.islast = true;
                            }
                            //移除loading
                            cp.pullUpEl.removeClass('loading');

                        } else {
                            jb.toastHandler(result.msg);
                        }
                    })
                    .then(function () {
                        _this.iscrollRefresh(options.tab);
                    })
                    .fail(function (result) {
                        if (typeof result == "string") {
                            data = JSON.parse(data);
                        }
                        //if(data.state=='6829201')
                        jb.toastHandler(result.msg);
                        //jb.toastHandler('网络开小差，稍后再试');
                    })
                    .done(function () {
                        cp.loadingStep = 0;
                    });
            },

            /**
             * 设置tab切换
             */
            setTabNavi: function () {
                var _this      = this,
                    $nav       = $('.tab-nav'),
                    $firstNavi = $nav.find('.tab-item').first();
                $nav.delegate('.tab-item', 'click', function (e) {
                    e.stopImmediatePropagation();

                    var status      = 'selected',
                        $this       = $(this),
                        type        = $this.data('tab'),
                        $tabContent = $('.tab-content'),
                        $tabNavs    = $('.tab-nav').find('.tab-item'),
                        $targetContent;

                    if ($this.hasClass(status)) return;

                    $tabNavs.filter('.selected').removeClass(status);
                    $this.addClass(status);

                    $tabContent.filter('.selected').removeClass(status);
                    $targetContent = $tabContent.filter('.' + type).addClass(status);

                    var $len = $('div.selected').find('ul').children().length;
                    $len == 0 && _this.getList({tab: type});
                    $('#js-currTab').val(type)
                });
                this.getList({tab: 'status-ready'});
            },

            setShoppingcarNum: function () {
                var num = Util.getQuery('carnum') || '';
                console.log(num)
                var $car = $('.icon-cart');
                if(!!num){

                    if (num > 99) num = 99;

                    if (num > 0) {
                        $car.find('span').text(num);
                    }
                }else{
                    var params = {
                        data: {
                            t_id: +new Date(),
                            token: Util.getQuery('token'),
                        }
                    };
                    return couponService.getCarNum(params)
                        .then(function (results) {

                            jb.loadingHandler('hide');

                            results = ( typeof results === 'string') ? JSON.parse(results) : results;

                            if (results.state == 0) {

                                 num = results.data.numInCart;

                                if (num > 99) num = 99;

                                if (num > 0) {
                                    $car.find('span').text(num);
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
                }
            },

            /**
             * 设置url query
             * @returns {{shopid: (*|number), userid: (*|number), token: (*|string)}}
             */
            setDefaultParams: function () {
                return {
                    t_id: +new Date(),
                    shopid: Util.getQuery('userid'),
                    token: Util.getQuery('token')
                }
            },

            /**
             * 跳转到店铺详情页
             */
            web2ShopDetail: function () {

                var tmplList        = $("#tmpl-partial-pop").html(),
                    tmplListCompier = Handlebars.compile(tmplList),
                    $contentChild   = $('#couponpop');

                var timer = 500,clickState = false;
                if (!$('.coupon-items')) {
                    return
                }
                $('.coupon-items').livequery(function () {

                    $(this).delegate('.name', 'click', function (e) {

                        e.preventDefault();
                        e.stopImmediatePropagation();
                        var $li = $(this).parents('li'),
                            isStarCoupon = $li.data('isstarcoupon'),
                            couponId = $li.data('couponid') + '',
                            shopId   = $li.data('shopid') + '',
                            couponType = $li.data('coupontype') + '',
                            shopType  = $li.data('shoptype') + '';
                        // console.log(isStarCoupon)
                        // console.log(couponId,shopId,couponType,shopType)

                        if(isStarCoupon){

                            var starType = $(this).data('startype');
                            var params = {};
                            //星劵类型 1：仅限指定星链商品使用 2：限购一个店铺商品 3：限购多个店铺商品
                            switch (parseInt(starType)){
                                case 1 :  //可用的商品列表页
                                    params = {
                                        key_coupon_id: couponId,
                                    };
                                    jb.routerHandler(WEB_CONFIG.nativePage.goods.couponGoodsList.id, JSON.stringify(params));
                                    break;
                                case 2 : //该店铺首页
                                    params = {
                                        shopid: shopId
                                    };

                                    shopType == '3' ? jb.routerHandler(WEB_CONFIG.nativePage.shop.supplierShop.id, JSON.stringify(params)) :
                                        jb.routerHandler(WEB_CONFIG.nativePage.shop.shopDetail.id, JSON.stringify(params));
                                    break;
                                case 3 ://可用的店铺列表页
                                    params = {
                                        key_coupon_id: couponId
                                    };
                                    jb.routerHandler(WEB_CONFIG.nativePage.shop.couponShopList.id, JSON.stringify(params));
                                    break;
                                default :
                                    break;
                            }

                        }else{

                            //优惠券类型 1-定额优惠券 2-品牌优惠券
                            if (couponType == '2') {
                                //品牌优惠券
                                var str    = [],
                                    $input = $(this).children('input'),
                                    $val   = $input.val() || '',
                                    $code  = $input.data('couponcode') || '',
                                    str    = ($val && $val.split('&')) || [];
                                var params = {
                                    code: $code,
                                    content: str
                                }
                                jb.couponBarCode(params);
                            } else {
                                //定额优惠券
                                var params = {
                                    shopid: shopId
                                };
                                shopType == '3' ? jb.routerHandler(WEB_CONFIG.nativePage.shop.supplierShop.id, JSON.stringify(params)) :
                                    jb.routerHandler(WEB_CONFIG.nativePage.shop.shopDetail.id, JSON.stringify(params));
                            }
                        }
                    });

                    //4.0版本UI界面改动，不需要app弹出浮层
                    // $(this).delegate('.desc', 'click', function () {
                    //     var ctype = $(this).data('shoptype');
                    //     var isStarCoupon = $(this).parents('li').data('isstarcoupon');
                    //     var couponCode   = $(this).data('code'),
                    //         faceValue    = $(this).data('face') + '',
                    //         couponStatus = $(this).data('status'),
                    //         shopId       = $(this).data('shopid'),
                    //         couponId     = $(this).data('couponid'),
                    //         starType     = $(this).data('startype');
                    //
                    //    if(isStarCoupon){
                    //         var content =  [$(this).data('minamtdesc'), '使用期限' + $(this).data('begintimeymds').toString() + '-' + $(this).data('endtimeymds').toString(), $(this).data('couponname') + '', $(this).data('couponguide'),$(this).data('couponlimitdesc'),$(this).data('starlimitdesc')]
                    //     }else{
                    //         var content = ( ctype == '1' || ctype == '2') ?
                    //             [$(this).data('minamtdesc'), '使用期限' + $(this).data('begintimeymds').toString() + '-' + $(this).data('endtimeymds').toString(), $(this).data('couponname') + '', $(this).data('couponguide')]
                    //             : ctype == '3' ?
                    //                 [$(this).data('minamtdesc'), '使用期限' + $(this).data('begintimeymd').toString() + '-' + $(this).data('endtimeymd').toString(), $(this).data('couponlimitdesc')] : [];
                    //     }
                    //     content = content.filter(function(item){
                    //         return item.length > 0;
                    //     })
                    //
                    //     var parms = {
                    //         isCash: '2', //1-现金券 2-优惠券
                    //         code: couponCode,
                    //         faceValue: faceValue,
                    //         couponTypeDes: couponStatus == '1' ? '未使用' : couponStatus == '2' ? '已使用' : couponStatus == '3' ? '已失效' : '',
                    //         content: content,
                    //         shopId: shopId,
                    //         shopType: ctype
                    //     };
                    //     $.extend(parms,{couponId:couponId,starType:starType});
                    //     console.log(parms)
                    //     if(clickState || !parms) return;
                    //     clickState = true;
                    //     //1小店 2企业店铺 3旗舰店
                    //     if (Util.isApp()) {
                    //         jb.couponBarCode(parms);
                    //         setTimeout(function(){clickState = false},timer)
                    //     } else {
                    //         //优惠券弹窗
                    //         $('#couponpop').removeClass('none');
                    //         $contentChild.html(tmplListCompier(parms));
                    //         setTimeout(function(){clickState = false},timer)
                    //     }
                    //
                    // });

                    $(this).delegate('.show', 'click', function () {
                        var $show = $(this).parents('.coupon-cont').next();
                        if($show.hasClass('none')){
                            $show.removeClass('none');
                            $(this).addClass('slide-up');
                        }else{
                            $show.addClass('none');
                            $(this).removeClass('slide-up');
                        }
                        window.ListScrollers && window.ListScrollers[$('#js-currTab').val()].refresh()
                    })
                })

                //立即使用优惠券
                $('.js-usecoupon').livequery('click',function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var couponId = $(this).data('couponid') + '',
                        shopId   = $(this).data('shopid') + '',
                        starType = $(this).data('startype') + '',
                        shopType  = $(this).data('shoptype') + '';

                    switch (parseInt(starType)){
                        case 1 :  //可用的商品列表页
                            params = {
                                key_coupon_id: couponId,
                            };
                            jb.routerHandler(WEB_CONFIG.nativePage.goods.couponGoodsList.id, JSON.stringify(params));
                            break;
                        case 2 : //该店铺首页
                            params = {
                                shopid: shopId
                            };

                            shopType == '3' ? jb.routerHandler(WEB_CONFIG.nativePage.shop.supplierShop.id, JSON.stringify(params)) :
                                jb.routerHandler(WEB_CONFIG.nativePage.shop.shopDetail.id, JSON.stringify(params));
                            break;
                        case 3 ://可用的店铺列表页
                            params = {
                                key_coupon_id: couponId
                            };
                            jb.routerHandler(WEB_CONFIG.nativePage.shop.couponShopList.id, JSON.stringify(params));
                            break;
                        default :
                            break;
                    }
                })

                //关闭优惠券弹窗
                $('.pop').livequery(function () {

                    $(this).find('.bg-layer,.as-closed').on('click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        $('#couponpop').addClass('none');
                    });

                })
            },

            /**
             * 跳转到购物车
             */
            web2ShoppingCar: function () {

                $('.header-wrap .go-home').on('click', function (e) {

                    e.preventDefault();
                    e.stopImmediatePropagation();
                    var _params = {
                        isToHome: '1'
                    }

                    jb.routerHandler(WEB_CONFIG.nativePage.shop.shoppingCar.id, JSON.stringify(_params));

                });

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
                _this.getList({tab: type});

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
                    var wrapItemEl = $thiswrapper.find('.js-coupon');

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
                                _this.getList({tab: type});
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

            sumTopHeight: function () {

                var $bodyHeight = window.innerHeight || document.getElementsByTagName('body')[0].clientHeight;
                var $headerTop = $('body').height();

                $('.wrapper').css({
                    top: $headerTop + 'px',
                    height: ($bodyHeight - $headerTop) + 'px'
                });
            },

            toWapCenterPage: function () {
                if(!Util.isApp()){
                    $('.header-wrap .go-back').livequery('click',function(e){
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        var params = {};

                        jb.routerHandler(WEB_CONFIG.nativePage.wapPage.ceter.id, JSON.stringify(params));
                    })
                }
            },



        }

        return CouponController;
    });
