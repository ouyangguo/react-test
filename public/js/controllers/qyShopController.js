define('qyShopController', ['clifeService','handlebars', 'livequery', 'iscroll', 'jsbridge'],
    function (ClifeService, Handlebars, livequery, IScroll, jsbridge) {
        var cliftService = new ClifeService();
        var jb = new jsbridge();

        var qyShopController = function () {};

        function handlebarfn(tmplid, cntid, result, appendtype) {
            var tmplHtml = $(tmplid).html();
            var tmplCompier = Handlebars.compile(tmplHtml);
            var $appendContent = $(cntid);
            if (appendtype) {
                $appendContent.html(tmplCompier(result));
                return
            }
            $appendContent.append(tmplCompier(result));


            // if (cp.refreshStatus == 0) {
            //     handlebarfn('#tmpl_showMyFeedback', '#showMyFeedback', data.data, 'replace');
            // } else {
            //     handlebarfn('#tmpl_showMyFeedback', '#showMyFeedback', data.data);
            // }
        }

        qyShopController.prototype = {
            init: function () {
                this.listScroll();
                var corpid = Util.getQuery('corpId') || '';

                //shoptype： 1 小店首页
                this.getCouponFun({corpid: corpid, shoptype: '1'})

                //this.setWelfareProductSort({'params': {"shopid": shopid, "types": "3", "shop": "shop"}});

                this.web2PlatformProductDetail();

            },
            getCouponFun: function (opt) {
                var _this          = this,
                    tmpltag        = $("#tmpl-partial-welfare-tagList").html(),
                    tmpltagCompier = Handlebars.compile(tmpltag),
                    $tmplTagLsit   = $('#welfare-tag');

                var params = {'corpid': opt.corpid, shoptype: opt.shoptype || ''};

                cliftService.getCorplifeshoppingindex(params)
                    .then(function (res) {

                        // for(var i=0;i<2;i++){
                        //     res.data.couponList=res.data.couponList.concat(res.data.couponList);
                        // }
                        // console.log(2222,res)

                        if (res.state == 0) {
                            //优惠券
                            $.map(res.data.couponList, function (item) {
                                // item.beginTimeYMD = Util.formatDate2(item.beginTime, 'yyyy.MM.dd');
                                // item.endTimeYMD = Util.formatDate2(item.endTime, 'yyyy.MM.dd');
                                //fotmat number
                                item.minimumAmount = parseInt(item.minimumAmount);
                                item.faceValue = parseInt(item.faceValue);

                                item.hasReceived = (item.status == 2);

                                item.couponjson = JSON.stringify(item);
                                return item;
                            });

                            $.map(res.data.groupBuyList, function (item) {

                                item.targetConditonJson = JSON.stringify(item.targetConditon)

                                return item;
                            });

                            sessionStorage.setItem('option:tag', JSON.stringify(res.data));

                            $tmplTagLsit.html(tmpltagCompier(res.data));

                            //只绑定小店

                            if (res.data.isBindShop == '1') {
                                $('#qyImg').addClass('none');
                                res.data.shopid = res.data.mshopId;
                                //调用旧的接口
                            } else if (res.data.isBindShop == '2') {
                                $('#qyImg').addClass('none');
                                res.data.shopid = res.data.cshopId;

                            } else if (res.data.isBindShop == '3') {

                                res.data.shopid = res.data.cshopId;
                                $('#qyImg').removeClass('none');

                                $('#qyImg').on('click', function (e) {
                                    e.stopImmediatePropagation();

                                    var params = {
                                        url: location.origin + '/life/assets/pages/clife/qyShop.html?corpId=' + sessionStorage.getItem('publishCorpId')
                                    }

                                    jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params), params.url);
                                })

                                //点击跳转以后展示绑定小店的商品列表
                                this.shopid = res.data.mshopId;

                            } else {
                                //既无绑定小店又没上架企业生活商品
                                //res.data.isBindShop == '0'
                                $('#welfare-list').html(Handlebars.compile($('#tmpl-nothing').html()))
                            }

                            _this.setWelfareProductSort({
                                'params': {
                                    "shopid": res.data.mshopId,
                                    "types": "3",
                                    "shop": "shop"
                                }
                            });
                            res.data.couponList.length > 0 && (_this.recieveCoupon())

                        } else {
                            jb.toastHandler(res.msg);
                        }

                        return res
                    })
                    .then(function (res) {

                        res.data.couponList.length && new IScroll('.coupon-wrap', {
                            scrollX: true,
                            scrollY: false,
                            mouseWheel: true
                        });

                    });
            },
            getWelfareProductList: function (options) {
                var _this = this;
                if (options.params.shop) {
                    //企业店铺子页面的模版
                    var tmplWelfares        = $("#tmpl-welfare-product-partials").html(),
                        tmplWelfareCompiers = Handlebars.compile(tmplWelfares),
                        tmplWelfareLists    = $('#welfare-list').find('.product-list');

                    var tmplWelfaresTag        = $('#tmpl-welfare-product-partial-tag').html(),
                        tmplWelfareCompiersTag = Handlebars.compile(tmplWelfaresTag),
                        tmplWelfareListsTag    = $('#sort-menus');
                } else {
                    var tmplProduct        = $("#tmpl-welfare-product-partial").html(),
                        tmplProductCompier = Handlebars.compile(tmplProduct),
                        tmplProductList    = $('#welfare-list').find('.product-list');
                }

                var model = {data: {}};

                $.extend(model.data, _this.setDefaultParams());
                $.extend(model.data, options.params || {});

                window.ListScrollers && (window.ListScrollers['life-content'].fetchStatus = 1);

                //tab的类型
                var tabType = model.data.type;

                //type 数据类型： 1-小店商品，2-平台商品，默认为1
                //这里固定使用 1-小店商品
                model.data.type = 1;

                if (options.params.shop) {
                    var tagList = JSON.parse(sessionStorage.getItem('option:tag'))
                    tmplWelfareListsTag.html(tmplWelfareCompiersTag(tagList));
                }
                if (!options.params.shopid) {
                    return
                }
                cliftService.welfareProductList(model)
                    .then(function (result) {

                        if (result.state == 0) {
                            if (result.data.goodsList && options.params.triggerType === 'click') {

                                options.params.shop
                                    ? tmplWelfareLists.empty()
                                    : tmplProductList.empty()
                            }

                            if (options.params.shop) {

                                if(result.data.goodsList.length>0){

                                    if(options.params.triggerType == 'scroll'){
                                        tmplWelfareLists.append(tmplWelfareCompiers(result.data))
                                    }else{
                                        tmplWelfareLists.html(tmplWelfareCompiers(result.data))
                                    }
                                }else{
                                    $('#welfare-list .product-list').html(Handlebars.compile($('#tmpl-nothing').html()))
                                }
                                // result.data.goodsList.length > 0
                                //     ? tmplWelfareLists.html(tmplWelfareCompiers(result.data))
                                //     : $('#welfare-list .product-list').html(Handlebars.compile($('#tmpl-nothing').html()))
                            } else {
                                if (result.data.goodsList.length > 0) {
                                    if (model.data.pagenum == 1) {
                                        tmplProductList.html(tmplProductCompier(result.data))
                                    } else {
                                        tmplProductList.append(tmplProductCompier(result.data))
                                    }
                                } else {
                                    $('#welfare-list .product-list').html(Handlebars.compile($('#tmpl-nothing').html()))
                                }
                            }
                        } else {
                            jb.toastHandler(result.msg);
                        }

                        return result.data
                    })
                    .then(function (data) {
                        //更新商品列表分页信息

                        var optionKey = 'option:proudctList',
                            params    = JSON.parse(sessionStorage.getItem(optionKey)),
                            temp      = {};

                        //点击排序进来的，恢复分页配置
                        if (options.params.triggerType === 'click') {
                            temp = {
                                total: data.total || 10000,
                                type: tabType,
                                typeName: 'type' + tabType,
                                islastPage: data.isLastPage || 0,
                                pagenum: 1,
                                pagesize: 10
                            };

                        } else {
                            temp = {
                                total: data.total || 10000,
                                //pagenum: params.params.pagenum,
                                type: tabType,
                                typeName: 'type' + tabType,
                                islastPage: data.isLastPage || 0,
                            }

                        }

                        // console.log(temp)

                        sessionStorage.setItem(optionKey, JSON.stringify({params: $.extend(options.params, temp)}));

                        _this.updatePageInfo(temp);
                        _this.lazyLoad();
                        _this.refreshWrapper();
                    })
                    .done(function () {
                        window.ListScrollers && (window.ListScrollers['life-content'].fetchStatus = 0);
                        // console.log('done')
                    });
            },
            setWelfareProductSort: function (options) {
                var _this        = this,
                    $lifeProduct = $('.life-product'),
                    $nav         = $lifeProduct.find('.product-nav');

                var $sort       = $('.pop-sort'),
                    $navs       = $lifeProduct.find('.product-nav').find('.item'),
                    active      = 'selected',
                    $navActive  = $navs.filter('.' + active),
                    navSortType = $navActive.data('sorttype');
                $sort.livequery(function () {
                    sessionStorage.setItem('tagid', null);

                    $sort.delegate('.bg-grays', 'click', function () {
                        $sort.addClass('none')
                    })

                    $sort.delegate('em', 'click', function () {
                        tagid = $(this).data('tagid') || '';
                        this.tagid = tagid;
                        sessionStorage.setItem('tagid', tagid);
                        var option1 = {
                            params: {
                                triggerType: 'click',
                                lastOrderType: !navSortType ? 0 : parseInt(navSortType.split('|')[0]),
                                shopid: options.params.shopid,
                                order: this.order || '',
                                pagesize: 10,
                                pagenum: 1,
                                type: ListPages[ListScrollers['life-content'].selectedItem].type,
                                types: options.params.types,
                                tagid: tagid,
                                shop: options.params.shop || ''
                            }
                        }

                        if (options.params.types == '1' || options.params.shop) {
                            _this.getWelfareProductList(option1);
                        } else {
                            _this.getWelfareList(option1);
                        }

                        $sort.addClass('none')
                        //切换分类名
                        if ($($nav.find('.item')[0]).hasClass('disabled')) {
                            $($nav.find('.item')[0]).find('span').text($(this).text());
                            $.map($nav.find('.item'), function (res) {
                                $(res).removeClass('selected')
                                $.map($(res).find('i'), function (re) {
                                    $(re).removeClass('selected')
                                })
                            })
                            $($nav.find('.item')[0]).addClass('selected');
                        }
                    })
                })

                $nav.livequery(function () {
                    $nav.delegate('.item', 'click', function (e) {

                        e.preventDefault();
                        e.stopImmediatePropagation();
                        //分类
                        var $sort = $('.pop-sort');
                        var order = '',
                            tagid = '';

                        if ($(this).attr('id')) {
                            if ($sort.hasClass('none')) {
                                $sort.removeClass('none')
                            } else {
                                $sort.addClass('none')
                            }
                        } else {
                            $sort.addClass('none');
                            $('#fenleiBtn').removeClass('none');

                            var $this        = $(this),
                                $lifeProduct = $('.life-product');

                            // console.log($this)

                            //切换视图
                            if ($this.hasClass('icon')) {
                                var $list = $('#welfare-list .product-list');

                                $this.toggleClass('viewer-v');
                                $list.toggleClass('viewer-h');

                                _this.refreshWrapper();
                                return;
                            }

                            //不需要排序
                            if ($this.hasClass('disabled')) {
                                return;
                            }

                            //商品排序
                            var sortType      = $this.data('sorttype'),
                                sortTypeArr   = sortType.split('|'),
                                $sort         = $this.find('.sort'),
                                active        = 'selected',
                                $sortActive   = $sort.find('.' + active),
                                $active       = $sortActive.length ? $sortActive : $sort.find('.down'),
                                $navs         = $lifeProduct.find('.product-nav').find('.item'),
                                $navActive    = $navs.filter('.' + active),
                                originType    = $this.data('type'),
                                navActiveType = $navActive.data('type'),
                                navSortType   = $navActive.data('sorttype');

                            if (originType == 's01') {
                                $('.s23').data('sorttype', [3, 2].join('|'));
                            }
                            if (originType == 's23') {
                                $('.s01').data('sorttype', [1, 0].join('|'));
                            }
                            //交换顺序
                            sortTypeArr = sortTypeArr.reverse();
                            $this.data('sorttype', sortTypeArr.join('|'));

                            if (originType !== navActiveType) {
                                $navs.filter('.' + active).removeClass(active);
                                $this.addClass(active);

                                $navActive.find('.sort')
                                    .find('i').removeClass(active);
                            }

                            $active
                                .removeClass(active)
                                .siblings()
                                .addClass(active);

                            //fetch data params
                            order = sortTypeArr[0] || '';
                            this.order = order;
                            var tagid = sessionStorage.getItem('tagid') && sessionStorage.getItem('tagid') || '';
                            tagid = tagid === 'null' ? null : tagid;
                            var option2 = {
                                params: {
                                    triggerType: 'click',
                                    lastOrderType: !navSortType ? 0 : parseInt(navSortType.split('|')[0]),
                                    shopid: options.params.shopid,
                                    order: order,
                                    pagesize: 10,
                                    pagenum: 1,
                                    type: ListPages[ListScrollers['life-content'].selectedItem].type,
                                    types: options.params.types,
                                    tagid: tagid || '',
                                    shop: options.params.shop || ''
                                }
                            }

                            var optionKey = 'option:proudctList';
                            sessionStorage.setItem(optionKey, JSON.stringify(option2));

                            if (options.params.types == '1' || options.params.shop) {
                                _this.getWelfareProductList(option2);
                            } else {
                                _this.getWelfareList(option2)
                            }
                        }

                    })
                });

                var option3 = {
                    params: {
                        triggerType: 'click',
                        lastOrderType: 0,
                        shopid: options.params.shopid,
                        order: '',
                        pagesize: 10,
                        pagenum: 1,
                        type: ListPages[ListScrollers['life-content'].selectedItem].type,
                        types: options.params.types,
                        tagid: '',
                        shop: options.params.shop || ''
                    }
                }

                if (options.params.types == '1' || options.params.shop) {
                    this.getWelfareProductList(option3);
                } else {

                    this.getWelfareList(option3)
                }
            },
            recieveCoupon: function () {
                var _this                    = this,
                    tmplCouponDetail         = $("#tmpl-coupon-detail-partial").html(),
                    tmplCouponDetailCompier  = Handlebars.compile(tmplCouponDetail),
                    $tmplCouponDetailContent = $('.coupon-detail'),
                    $layer                   = $('.bg-layer');

                $('.coupon-list').livequery(function () {

                    $(this).delegate('.coup-item', 'click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        var $target = $(this).find('a'),
                            data    = $target.data('couponjson');

                        $tmplCouponDetailContent.html(tmplCouponDetailCompier(data))
                            .removeClass('none').addClass('newShow');
                        $layer.removeClass('none');

                        //btn-recieve

                        var $close   = $tmplCouponDetailContent.find('.closer'),
                            $recieve = $tmplCouponDetailContent.find('.btn-recieve');

                        $close.on('click', function (e) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            $layer.addClass('none');
                            $tmplCouponDetailContent.addClass('none');

                        });

                        $recieve.on('click', function (e) {
                            e.preventDefault();
                            e.stopImmediatePropagation();

                            //领取优惠券
                            recieve({
                                shopid: data.shopId,
                                couponid: data.couponId
                            }, $(this), $tmplCouponDetailContent, $target, data)

                        })

                    });

                })

                $layer.livequery('touchstart', function () {

                    if (!$(this).hasClass('none')) {
                        $('.coupon-detail').addClass('none');
                        $(this).addClass('none');
                    }
                })
                function recieve(options, $target, $content, $origin, data) {
                    //shopid  couponid
                    var model = {data: {}};
                    $.extend(model.data, _this.setDefaultParams());
                    $.extend(model.data, options);

                    !$target.hasClass('unactived') && cliftService.recieveCoupon(model)
                        .then(function (result) {

                            if (result.state == 0) {

                                $target.addClass('unactived').text('已领取');

                                //
                                data.status = 2;
                                $origin.data('couponjson', JSON.stringify(data));

                                jb.toastHandler('领取成功');

                                setTimeout(function () {
                                    $content.addClass('none')
                                }, 3000)

                            } else {
                                switch (result.state) {
                                    case 4503303:
                                    case 4503304:
                                    case 4503305:
                                    case 4503306:
                                        $target.addClass('unactived');
                                        break;
                                }

                                jb.toastHandler(result.msg);
                            }
                        })

                }
            },
            /**
             * 更新分页信息
             * @param options
             * @returns {{}|*}
             */
            updatePageInfo: function (options) {

                // console.log(options)
                var pageInfo = window.ListPages && window.ListPages[options.typeName];

                if (pageInfo) {

                    pageInfo.total = options.total;
                    pageInfo.islastPage = options.islastPage;
                    // (pageInfo.pagenum < (pageInfo.total)) && pageInfo.pagenum++;
                    (pageInfo.islastPage == 0) && pageInfo.pagenum++;
                }

                window.ListPages[options.typeName] = pageInfo;

                return pageInfo;
            },
            /**
             * 刷新iscroll
             */
            refreshWrapper: function () {

                var _this = this;

                setTimeout(function () {
                    _this.lazyLoad();
                    // if(islastPage[ListScrollers['life-content'].selectedItem])
                    window.ListScrollers && window.ListScrollers['life-content'].scroller.refresh();

                }, 200)

            },
            listScroll: function () {
                window.ListScrollers = {};
                window.ListPages = {};
                var _this          = this,
                    scrollers      = [],
                    $wrappers      = $('.wrapper'),
                    $tabContents   = $('.tab-content'),
                    $scrollLoading = $('.scroll-loading');
                var pulldownHtml =
                        '<div class="pullDown" style="text-align: center; padding: 1rem; display:block">' +
                        '<span class="pullDownIcon"></span>' +
                        '<span class="pull-down-msg">下拉刷新</span>' +
                        '</div>';

                $wrappers.each(function (index) {

                    var _thisScroll = scrollers[index],
                        cid         = $(this).attr('id'),
                        // total       = !!$(this).data('total') || 10000,
                        temp        = {};

                    _thisScroll = new IScroll('#' + cid, {
                        mouseWheel: true,
                        click: true,
                        tap: true,
                        eventPassthrough: false,
                        preventDefault: true,
                        probeType: 3
                    })
                    _thisScroll.on('scroll', function () {

                        // console.log(this.y)

                        //只在企业生活首页才会启用滑动固定功能
                        if (typeof moduleName !== 'undefined') {

                            setTimeout(function () { _this.fixedNavbar() }, 50)

                        }

                    })

                    _thisScroll.on("scrollEnd", function () {

                        _this.lazyLoad();

                        //判断是否上拉加载分页数据
                        var $wrapper = $(this.wrapper),
                            wHeight  = $wrapper.height(),
                            sHeight  = $wrapper.find('.scroller').height();

                        // console.log(this.y)

                        if (this.y < 0 &&
                            this.y < (sHeight - wHeight) &&
                            (wHeight - this.y + 100) > sHeight
                        ) {
                            //done
                            var cp = ListPages[ListScrollers[cid].selectedItem];
                            var cs = ListScrollers[cid];

                            if (cp.islastPage == 0 && cs.fetchStatus == 0) {

                               if (cp.type == 3) {


                                    var optionKey = 'option:proudctList',
                                        ops       = JSON.parse(sessionStorage.getItem(optionKey));

                                    if (!ops) {

                                        return
                                    }

                                    ops.params.pagenum++;
                                    ops.params.triggerType = 'scroll';

                                    //当前绑定的店 小店 企业
                                    var currList = JSON.parse(sessionStorage.getItem('option:tag'));
                                    //order tagid
                                    if (currList.isBindShop == '1') {

                                        _this.getWelfareProductList(ops);
                                    } else {
                                        if ($('body').attr('id') == 'shop') {
                                            ops.params.shop = 'shop'
                                            _this.getWelfareProductList(ops);
                                        } else {
                                            _this.getWelfareList(ops);
                                        }

                                    }

                                } else {
                                    if (this.y == 0) {
                                        console.log('refresh')
                                        $wrappers.find('.pullDown').remove();
                                        _this.refreshWrapper();
                                    }
                                }

                            } else {
                                //done
                                $('#welfare-list').find('.bg-white').length == 0 && jb.toastHandler('已经最后一页了');
                            }
                        } else {
                            _this.refreshWrapper();
                        }
                    });
                    _thisScroll.on("scrollStart", function () {

                        // console.log(this.y)
                        $wrappers.find('.pullDown').remove();

                        if (this.y == 0 && this.directionY == -1) {

                            // $scrollLoading.html(pulldownHtml);
                            $(pulldownHtml).insertBefore($wrappers.find('.scroller'))

                            console.log('down');

                            var lScroll = window.ListScrollers['life-content'],
                                lPages  = window.ListPages[lScroll.selectedItem],
                                tab     = $('.tab-nav').find('li').filter('.selected').data('tab')

                            //reset分页信息
                            lPages.pagenum = 1;
                            lPages.pagesize = 10;

                            var currList = JSON.parse(sessionStorage.getItem('option:tag'));

                            if ($('body').attr('id') == 'shop') {
                                var ops = {
                                    params: {
                                        triggerType: 'click',
                                        lastOrderType: 0,
                                        pagenum: 1,
                                        pagesize: 10,
                                        order: '',
                                        tagid: '',
                                        shopid: currList.mshopId,
                                        type: ListPages[ListScrollers['life-content'].selectedItem].type,
                                        types: '3',
                                        shop: 'shop',
                                    }
                                }
                                // type: ListPages[ListScrollers['life-content'].selectedItem].type,
                                // types: options.params.types,

                                _this.getWelfareProductList(ops);
                            } else {
                                _this.switchTabsData({tab: tab, type: lPages.type, fetchType: 'pulldown'});
                            }

                        }
                    });

                    //默认开启图片延迟加载
                    _this.lazyLoad();

                    //全局scroller
                    temp[cid] = {
                        scroller: _thisScroll,
                        selectedItem: 'type3',
                        /*ajax请求状态*/
                        fetchStatus: 0
                    }
                    $.extend(window.ListScrollers, temp);

                    //分页信息,默认0开始
                    //temp2[cid] = {total: total, pageNo: 0, pageSize: 10};

                    $.each($tabContents, function () {
                        var obj = {},
                            tid = $(this).attr('id');

                        obj[tid] = {
                            islastPage: $(this).data('islastPage') || 0,
                            total: $(this).data('total') || 10000,
                            pagenum: 1,
                            pagesize: 10,
                            type: $(this).data('type'),
                            typeName: tid,
                            selected: $(this).hasClass('selected')
                        }
                        $.extend(window.ListPages, obj);

                        if ($(this).hasClass('selected')) {
                            temp[cid].selectedItem = tid;
                        }

                    })

                    // $.extend(window.ListPages, temp2);

                });

                document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
            },
            web2PlatformProductDetail: function () {

                //life-welfare
                var $productList = $('.product-list');

                $productList.livequery(function () {
                    $(this).delegate('li', 'click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        //goodsType	string	商品类型：1-平台（星链自营）普通商品，2-平台（星链自营）团购商品，3-店铺普通商品，4-店铺团购商品 5-企业生活商品详情页

                        var $this     = $(this),
                            goodstype = parseInt($(this).data('goodstype')),
                            params    = {
                                goodsid: $this.data('goodsid').toString(),
                                shopid: $this.data('shopid').toString()
                            },
                            pages     = WEB_CONFIG.nativePage.clife,
                            detailId;
                        switch (goodstype) {
                            case 1:
                                detailId = pages.platformProductDetail.id;
                                break;
                            case 2:
                                detailId = pages.platformGroupBuyDetail.id;
                                break;
                            case 3:
                                detailId = pages.shopProductDetail.id;
                                break;
                            case 4:
                                detailId = pages.shopGroupBuyDetail.id;
                                break;
                            case 5:
                                detailId = pages.qyPlatformgoodsdetial.id;
                                break;
                        }

                        console.log(detailId, params)

                        if (!detailId) {

                            return;
                        }

                        jb.routerHandler(detailId, JSON.stringify(params));
                    })
                });

            },
            fixedNavbar: function () {

                var $tabWrapper = $('.tab-wrapper');

                $tabWrapper.livequery(function () {

                    var $navbar           = $('.life-product'),
                        offsetTop         = $navbar.offset().top,

                        $scroller         = $('.scroller'),
                        //外层容器高度
                        innerHeight       = $scroller.height(),
                        //内层容器高度
                        wrapperHeight     = $('.wrapper').height(),
                        tabNavHeight      = $navbar.height(),
                        $fixedbar         = $('.fixedbar'),
                        $contentOffsetTop = $('#welfare-list').offset().top;

                    var $shop = $('#shop'),
                        $wel = $('#welfare-list'),
                        $coupon = $wel.find('.life-coupon'),
                        $group = $wel.find('.groupbuy-list'),
                        $wap =$('.wrapper');

                    // console.log('offsetTop: ' + Math.ceil(offsetTop), 'tabNavHeight: ' + tabNavHeight,'contentOffsetTop: '+$contentOffsetTop);

                    if (wrapperHeight < innerHeight) {
                        //向上滑动-固定操作

                        if ($fixedbar.children().length === 0 && offsetTop < tabNavHeight) {

                            $('.life-product').appendTo($fixedbar);

                            if($shop.length > 0){
                                if($coupon.length == 0 && $group.length == 0){
                                    $wap.addClass('top1')
                                }
                            }

                        } else {
                            //向下滑动-松开操作

                            if (offsetTop < 1 && $contentOffsetTop > tabNavHeight ) {

                                if($shop.length > 0){
                                    if($coupon.length == 0 && $group.length == 0){
                                        return
                                    }
                                }
                                $fixedbar.find('.life-product').appendTo($(this).find('#welfare-tag'))

                            }
                        }

                    }

                })
            },
            lazyLoad: function () {

                // $(".imgbox img").livequery(function () {
                //
                //
                //     $(this).unveil(200, function () {
                //         $(this).removeClass('unveil-img')
                //     });
                // })
            },
            setDefaultParams: function () {
                return {
                    token: WEB_CONFIG.appInfo.token || Util.getQuery('token'),
                    t_id: +new Date()
                }
            }

        }

        return qyShopController;
    }
)