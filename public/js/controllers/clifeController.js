/*!*
 * 企业生活
 */

define('clifeController', ['clifeService', 'handlebars', 'livequery', 'iscroll', 'jsbridge', 'cLifeFooter', 'carousel', 'unveil', 'dialog'],
    function (ClifeService, Handlebars, livequery, IScroll, jsbridge, CLifeFooter) {

        var cliftService = new ClifeService();
        var jb = new jsbridge();

        var ClifeController = function () {};

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

            if (flag) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }

        });
        Handlebars.registerHelper("addOne", function (index) {
            return index + 1
        });

        ClifeController.prototype = {
            initQy: function () {
                this.listScroll();
                var corpid = Util.getQuery('corpId') || '';

                //shoptype： 1 小店首页
                this.getCouponFun({corpid: corpid, shoptype: '1'})

                //this.setWelfareProductSort({'params': {"shopid": shopid, "types": "3", "shop": "shop"}});

                this.web2PlatformProductDetail();
                if($('.coupon-detail').hasClass('none')){

                }

            },
            init: function () {
                //是否允许发帖（0=不允许，1=允许）
                sessionStorage.removeItem('publishStatus');

                this.registerJsHandler();
                this.setTabNavi();
                this.getLifeInfo();
                this.listScroll();

                //native交互
                this.web2PostsDetail();
                this.web2PostsPublish();
                this.web2PlatformProductDetail();
                this.web2PlatformGroupBuyDetail();
                //this.web4SetContactToolbar();
                CLifeFooter.init($('#footer'));

                jb.topbarHandler('left', 'back', '', 'returnHomePage');
                window.WebViewJavascriptBridge.registerHandler('returnHomePage', function (data, responseCallback) {
                    jb.routerHandler(WEB_CONFIG.nativePage.homeModule.home.id);
                });
            },

            /**
             *  设置tab
             */
            setTabNavi: function () {
                var _this      = this,
                    $nav       = $('.tab-nav'),
                    $firstNavi = $nav.find('.tab-item').first(),
                    $sendPost  = $('.life-posts');

                $nav.delegate('.tab-item', 'click', function (e) {
                    e.stopImmediatePropagation();
                    var status       = 'selected',
                        $this        = $(this),
                        tab          = $this.data('tab'),
                        type         = $this.data('type'),
                        $tabContent  = $('.tab-content'),
                        $tabNavs     = $('.tab-nav').find('.tab-item'),
                        $sendPost    = $('.life-posts'),
                        $underBanner = $('#footer');

                    if ($this.hasClass(status)) return;

                    $tabNavs.filter('.selected').removeClass(status);
                    $this.addClass(status);

                    $tabContent.filter('.selected').removeClass(status);
                    $tabContent.filter('.' + tab).addClass(status);

                    if (type == 3) {
                        $sendPost.addClass('none');
                        $underBanner.removeClass('none');

                    } else if (type == 2) {
                        $underBanner.addClass('none');
                        $sendPost.removeClass('none')
                    } else {
                        $sendPost.addClass('none');
                        $underBanner.addClass('none');
                    }

                    // fetch list

                    _this.switchTabsData({tab: tab, type: type});

                    //refresh scroll

                    window.ListScrollers && (window.ListScrollers['life-content'].selectedItem = 'type' + type);
                    _this.refreshWrapper();

                });

            },

            /**
             * 企业生活首页
             */
            getLifeInfo: function () {

                var _this              = this,
                    tmplCompany        = $("#tmpl-company").html(),
                    tmplCompanyCompier = Handlebars.compile(tmplCompany),
                    $tmplCompany       = $('#company-content');

                //分部视图
                Handlebars.registerPartial("partial-notice", $("#tmpl-notice-partial").html());
                Handlebars.registerPartial("partial-welfare", $("#tmpl-welfare-partial").html());
                Handlebars.registerPartial("partial-welfare-product", $("#tmpl-welfare-product-partial").html());
                Handlebars.registerPartial("partial-partner", $("#tmpl-partner-partial").html());

                var model = {data: {}};

                $.extend(model.data, _this.setDefaultParams());

                jb.addObserver('publishPostFinished', 'postlistUpdate')

                cliftService.getLiftInfo(model)
                    .then(function (result) {

                        if (result.state == 0) {

                            sessionStorage.setItem('publishCorpId', result.data.corpId);

                            $tmplCompany.html(tmplCompanyCompier(result.data));

                        } else {

                            jb.toastHandler(result.msg);

                        }

                        return result.data
                    })
                    .then(function (data) {
                        if (data) {
                            var ops = {
                                noticeStatus: data.noticeStatus,
                                forumStatus: data.forumStatus,
                                wellfareStatus: '1',  //data.wellfareStatus, v3.9版本后都显示为 《商城》
                                corpId: data.corpId

                            }
                            _this.setTabNaviCount(ops)
                            //显示tab内容
                            $('.tab-module').removeClass('none');
                        }

                    })
                    .then(function () {

                        //默认开启图片延迟加载
                        _this.lazyLoad();
                        // _this.clearSessionStorage();
                        _this.closeNoticeTip()
                    })
                    .then(function () {
                        _this.refreshWrapper();
                    });
            },

            /**
             * 设置tab数量
             * @param options
             */
            setTabNaviCount: function (options) {
                // var options = {
                //     "noticeStatus": 1,
                //     "forumStatus": 1,
                //     "wellfareStatus": 1
                // }

                // console.log(options)

                var _this         = this,
                    $nav          = $('.tab-nav'),
                    $navItems     = $nav.find('.tab-item'),
                    $selectedItem = $navItems.filter('.selected'),
                    tab           = $selectedItem.data('tab'),
                    type          = $selectedItem.data('type'),
                    temp          = [],
                    maps          = {
                        noticeStatus: 'status-notice',
                        forumStatus: 'status-partner',
                        wellfareStatus: 'status-welfare'
                    };

                //重置tab数量
                for (var k in options) {

                    if (options[k] == 0) {

                        $navItems.filter('[data-tab="' + maps[k] + '"]').remove();
                    } else {
                        temp.push(k);
                    }
                }

                //$nav.find('.tab-item').css({width: 100 / temp.length + '%'});

                _this.switchTabsData({tab: tab, type: type, corpId: options.corpId});

            },

            //切换首页tab数据
            switchTabsData: function (options) {
                var _this = this;

                var opts = this.setNoticeParams({type: options.type, fetchType: options.fetchType});

                if (opts.$target.attr('id') === 'welfare-list') {

                }

                if ((!opts.$target || opts.$target.children().length > 0) && options.fetchType !== 'pulldown') {

                    //首页“商城”不做处理
                    if (opts.$target.attr('id') !== 'welfare-list') {
                        return
                    }
                }

                switch (options.tab) {

                    //通知、帖子列表
                    case 'status-notice':
                    case 'status-partner':
                        _this.getTopNotice({type: options.type, fetchType: options.fetchType});
                        _this.getNoticeList(opts);

                        break;
                    case 'status-welfare':

                        _this.getCouponFun({
                            corpid: options.corpId || sessionStorage.getItem('publishCorpId'),
                            fetchType: options.fetchType || ''
                        })
                        _this.recieveCoupon();

                        break;
                }
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
                            if (opt.shoptype) {
                                if (res.data.isBindShop != '0') {
                                    _this.setWelfareProductSort({
                                        'params': {
                                            "shopid": res.data.mshopId,
                                            "types": "3",
                                            "shop": "shop"
                                        }
                                    });
                                }
                            } else {
                                if (res.data.isBindShop != '0') {
                                    _this.setWelfareProductSort({
                                        'params': {
                                            "shopid": res.data.shopid,
                                            "types": res.data.isBindShop,
                                            "fetchType": opt.fetchType
                                        }
                                    });
                                }
                            }

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
            /**
             * 企业-福利
             */
            getWelfareInfo: function (options) {
                var _this              = this,
                    tmplWelfare        = $("#tmpl-welfare-partial").html(),
                    tmplWelfareCompier = Handlebars.compile(tmplWelfare),
                    tmplWelfareList    = $('#welfare-list');

                var model = {data: {}};

                // type 1通知，2同事帮

                $.extend(model.data, _this.setDefaultParams());
                // $.extend(model.data, options.params || {});

                window.ListScrollers && (window.ListScrollers['life-content'].fetchStatus = 1);

                cliftService.getWelfareInfo(model)
                    .then(function (result) {

                        if (result.state == 0) {

                            result.data.qs = Util.getQueryString();

                            tmplWelfareList.html(tmplWelfareCompier(result.data));

                        } else {

                            jb.toastHandler(result.msg);

                        }

                        return result.data.goodsList;
                    })
                    .then(function (data) {

                        // console.log(model.data)
                        //、
                        $('.m-carousel').carousel();

                        //_this.setWelfareProductSort();
                        //更新商品列表分页信息
                        _this.updatePageInfo({
                            total: data && data.total || 10000,
                            type: 3,
                            typeName: 'type3',
                            islastPage: data && data.islastPage || 0,
                            pagenum: 1,
                            pagesize: 10
                        })

                    })
                    .then(function () {
                        _this.lazyLoad();
                        _this.refreshWrapper();
                    })
                    .done(function () {
                        window.ListScrollers && (window.ListScrollers['life-content'].fetchStatus = 0);
                        console.log('done')
                    });
            },

            /**
             * 商城-产品列表 绑定小店要请求的接口
             */
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
                console.log(options)

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
            /**
             * 商城-产品列表 绑定企业要求请求的接口
             */
            getWelfareList: function (options) {
                var _this = this;

                var tmplWelfare        = $("#tmpl-welfare-product-partial").html(),
                    tmplWelfareCompier = Handlebars.compile(tmplWelfare),
                    tmplWelfareList    = $('#welfare-list').find('.product-list');

                var model = {data: {}};

                $.extend(model.data, _this.setDefaultParams());
                $.extend(model.data, options.params || {});

                window.ListScrollers && (window.ListScrollers['life-content'].fetchStatus = 1);

                //tab的类型
                var tabType = model.data.type;

                //type 数据类型： 1-小店商品，2-平台商品，默认为1
                //这里固定使用 1-小店商品
                model.data.type = 1;

                if (!options.params.shopid) {
                    return
                }
                cliftService.getCorplifegoodsdetail(model)
                    .then(function (result) {


                        // result={"data":{"flag":-1,"goodsList":[{"goodsId":"2200000000010000011804","goodsInventory":"1000","goodsLogo":"http://img.365hele.com/upload/28347/store/303/ea38d5b7-3812-4398-a063-bcfea7eda5d3.jpg_middle.jpg","goodsName":"加多宝瓶装凉茶500ml","goodsPrice":"4.50","goodsSales":"0","goodsType":"3","shopId":"1","shopLogo":"http://183.62.215.52/upload/2/170118/0/1484704438586535046.jpg","shopName":"董科的店铺1","status":"0"},{"goodsId":"2200000000010000001173","goodsInventory":"49","goodsLogo":"http://183.62.215.52/upload/0/160604/0/1465022131706130844.png","goodsName":"测试地方政府官员","goodsPrice":"0.01","goodsSales":"2","goodsType":"3","shopId":"1","shopLogo":"http://183.62.215.52/upload/2/170118/0/1484704438586535046.jpg","shopName":"董科的店铺1","status":"0"},{"goodsId":"2200000000010000001025","goodsInventory":"19","goodsLogo":"http://183.62.215.52/upload/0/160505/0/1462432063902665061.png","goodsName":"测试版","goodsPrice":"100.00","goodsSales":"1","goodsType":"3","shopId":"1","shopLogo":"http://183.62.215.52/upload/2/170118/0/1484704438586535046.jpg","shopName":"董科的店铺1","status":"0"},{"goodsId":"2200000000010000000800","goodsInventory":"24","goodsLogo":"http://183.62.215.52/upload/0/160428/0/1461818061727495629.png","goodsName":"测试商品","goodsPrice":"10.00","goodsSales":"0","goodsType":"3","shopId":"1","shopLogo":"http://183.62.215.52/upload/2/170118/0/1484704438586535046.jpg","shopName":"董科的店铺1","status":"0"},{"goodsId":"2200000000010000001024","goodsInventory":"18","goodsLogo":"http://183.62.215.52/upload/0/160505/0/1462431702284943937.png","goodsName":"测试库存","goodsPrice":"100.00","goodsSales":"2","goodsType":"3","shopId":"1","shopLogo":"http://183.62.215.52/upload/2/170118/0/1484704438586535046.jpg","shopName":"董科的店铺1","status":"0"},{"goodsId":"2200000000010000011844","goodsInventory":"999","goodsLogo":"http://www.esunny.com/photo/1458099634345.jpg","goodsName":"芬达葡萄300ml","goodsPrice":"0.01","goodsSales":"1","goodsType":"3","shopId":"1","shopLogo":"http://183.62.215.52/upload/2/170118/0/1484704438586535046.jpg","shopName":"董科的店铺1","status":"0"},{"goodsId":"2200000000010000000012","goodsInventory":"10","goodsLogo":"http://172.16.180.76/0/151204/0/1449211840091629440.jpg","goodsName":"条码库4","goodsPrice":"99.00","goodsSales":"2","goodsType":"3","shopId":"1","shopLogo":"http://183.62.215.52/upload/2/170118/0/1484704438586535046.jpg","shopName":"董科的店铺1","status":"0"},{"goodsId":"2200000000010000011803","goodsInventory":"1101","goodsLogo":"http://img.365hele.com/upload/data/24793_2_.jpg_middle.jpg","goodsName":"红星55度二锅头","goodsPrice":"10.00","goodsSales":"0","goodsType":"3","shopId":"1","shopLogo":"http://183.62.215.52/upload/2/170118/0/1484704438586535046.jpg","shopName":"董科的店铺1","status":"0"},{"goodsId":"2200000000010000011805","goodsInventory":"1000","goodsLogo":"http://img.365hele.com/upload/data/20486_1_.jpg_middle.jpg","goodsName":"银鹭牛奶花生370g","goodsPrice":"4.00","goodsSales":"0","goodsType":"3","shopId":"1","shopLogo":"http://183.62.215.52/upload/2/170118/0/1484704438586535046.jpg","shopName":"董科的店铺1","status":"0"},{"goodsId":"2200000000010000011806","goodsInventory":"1000","goodsLogo":"http://img.365hele.com/upload/data/24092_1_.jpg_middle.jpg","goodsName":"娃哈哈营养快线500ml(原味)","goodsPrice":"4.50","goodsSales":"0","goodsType":"3","shopId":"1","shopLogo":"http://183.62.215.52/upload/2/170118/0/1484704438586535046.jpg","shopName":"董科的店铺1","status":"0"}],"isExistGoods":2,"isLastPage":0,"sellsRecommGoodsList":[],"shareInfo":{},"total":8},"msg":"成功","state":0}
                        //
                        //
                        // result.state=0;
                        // result.data.goodsList=result.data.goodsList;
                        //
                        //
                        // console.log(result)

                        if (result.state == 0) {
                            if (result.data.goodsList && options.params.triggerType === 'click') {
                                tmplWelfareList.empty()
                            }
                            if (result.data.goodsList.length > 0) {
                                if (model.data.pagenum == 1) {
                                    tmplWelfareList.html(tmplWelfareCompier(result.data))
                                } else {

                                    tmplWelfareList.append(tmplWelfareCompier(result.data))
                                }
                            } else {
                                $('#welfare-list .product-list').html(Handlebars.compile($('#tmpl-nothing').html()))
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
                                islastPage: data.isLastPage || 0
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

            /**
             * 福利-推荐产品排序
             */
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
                            $($($nav.find('.item')[0]).find('span')[0]).text($(this).text());
                            $($($nav.find('.item')[0]).find('.up')[0]).addClass('none');
                            $($($nav.find('.item')[0]).find('.down')[0]).removeClass('none');
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
                                $sort.removeClass('none');
                                $($(this).find('.down')[0]).addClass('none')
                                $($(this).find('.up')[0]).removeClass('none')
                            } else {
                                $sort.addClass('none')
                                $($(this).find('.up')[0]).addClass('none')
                                $($(this).find('.down')[0]).removeClass('none')
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

            /**
             *  企业-置顶通知
             */
            getTopNotice: function (options) {

                // console.log(options)

                var _this             = this,
                    type              = options.type,
                    tmplNotice        = $("#tmpl-notice-partial").html(),
                    tmplNoticeCompier = Handlebars.compile(tmplNotice),
                    tmplTopNoticeList = $('#notice-toplist-type' + type),
                    $lineDeco         = $('.line-deco');

                var model = {
                    data: {
                        type: type || 1
                    }
                };

                $.extend(model.data, _this.setDefaultParams());

                return cliftService.getTopNotice(model)
                    .then(function (result) {

                        if (result.state == 0) {

                            if (result.data && result.data.list.length) {

                                $.map(result.data.list, function (item) {

                                    var op      = {
                                            date: item.publishDate,
                                            number: item.viewNum
                                        },
                                        fNotice = _this.formatNotice(op);

                                    item.photo = (item.photos || '').split(/,/).shift();
                                    item.publishDate = fNotice.date;
                                    // item.viewNum = fNotice.number;
                                    item.hasThumb = !item.photo ? 'no-img' : '';

                                    //企业通知没有头像
                                    item.kclass = (type == 1) ? 'no-thumb' : '';

                                    return item
                                });

                                result.data.qs = Util.getQueryString();

                                tmplTopNoticeList.html(tmplNoticeCompier(result.data));
                                tmplTopNoticeList.next('.line').removeClass('none');
                                $lineDeco.removeClass('none');
                            }

                        } else {

                            jb.toastHandler(result.msg);

                        }
                    })
                    .then(function () {
                        //默认开启图片延迟加载
                        _this.lazyLoad();
                    })
                    .then(function () {
                        _this.refreshWrapper();
                    });
            },

            /**
             * 企业-通知，同事帮列表
             */
            getNoticeList: function (options) {

                var _this             = this,
                    tmplNotice        = $("#tmpl-notice-partial").html(),
                    tmplNoticeCompier = Handlebars.compile(tmplNotice),
                    tmplNoticeList    = options.$target,
                    $lineDeco         = tmplNoticeList.find('.line-deco');

                var model = {data: {}};

                // type 1通知，2同事帮
                $.extend(model.data, _this.setDefaultParams());
                $.extend(model.data, options.params || {});

                window.ListScrollers && (window.ListScrollers['life-content'].fetchStatus = 1);

                cliftService.getNoticeList(model)
                    .then(function (result) {
                        if (result.state == 0) {

                            if (result.data && result.data.list.length) {

                                $.map(result.data.list, function (item) {

                                    // var op = {
                                    //     date: item.publishDate,
                                    //     number: item.viewNum
                                    // };
                                    //fNotice = _this.formatNotice(op);

                                    item.photo = item.photos.split(/,/).shift();
                                    //item.publishDate = fNotice.date;
                                    // item.viewNum = fNotice.number;
                                    item.hasThumb = !item.photo ? 'no-img' : '';

                                    // item.isRecommend = (item.isRecommend == 1);

                                    //企业通知没有头像
                                    item.kclass = model.data.type == 1 ? 'no-thumb' : '';

                                    return item
                                })

                                result.data.qs = Util.getQueryString();

                                // console.log(result.data)
                                if (ListPages['type' + model.data.type].pagenum == 1) {
                                    tmplNoticeList.html(tmplNoticeCompier(result.data));
                                } else {
                                    tmplNoticeList.append(tmplNoticeCompier(result.data));
                                }

                                $lineDeco.removeClass('none')

                            }

                        } else {

                            jb.toastHandler(result.msg);

                        }

                        return result.data
                    })
                    .then(function (data) {
                        // _this.setPageInfo('type' + options.type);

                        // console.log(data)

                        data && $('#type' + model.data.type)
                            .data('total', data.total)
                            .data('islastPage', data.islastPage);

                        _this.updatePageInfo({
                            total: data && data.total,
                            type: model.data.type,
                            typeName: 'type' + model.data.type,
                            islastPage: (data && data.islastPage) || 0
                        })

                    })
                    .then(function () {

                        //默认开启图片延迟加载
                        _this.lazyLoad();
                        _this.refreshWrapper();

                    })
                    .done(function () {
                        window.ListScrollers && (window.ListScrollers['life-content'].fetchStatus = 0);
                        // console.log('done')
                    });
            },

            /**
             * 设置iscroll
             */
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

                            console.log(cp)
                            // console.log(cs)
                            // var currList = JSON.parse(sessionStorage.getItem('option:tag'));
                            // if(currList.isBindShop == '1'){
                            //     window.ListPages['type' + 3].islastPage
                            // }
                            if (cp.islastPage == 0 && cs.fetchStatus == 0) {


                                // fetch list
                                if (cp.type == 1 || cp.type == 2) {

                                    var options = _this.setNoticeParams({type: cp.type});
                                    options.$target && _this.getNoticeList(options);

                                } else if (cp.type == 3) {

                                    //福利-商品列表

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
                                        console.log(window.ListPages['type' + 3])
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

            /**
             * 领取优惠券
             */
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
             * 企业-通知详情
             */
            getNoticeDetail: function () {

                jb.topbarHandler('left', '', '', 'detailGoback');

                var _this             = this,
                    tmplDetail        = $("#tmpl-notice-detail").html(),
                    tmplDetailCompier = Handlebars.compile(tmplDetail),
                    tmplDetailContent = $('#notice-detail');

                var tmplPhoto        = $("#tmpl-photo").html(),
                    tmplPhotoCompier = Handlebars.compile(tmplPhoto),
                    tmplPhotoContent = $('.lift-photo');

                Handlebars.registerHelper('htmlEscape', function (string) {
                    return new Handlebars.SafeString(string)
                });

                var model = {
                    data: {
                        id: Util.getQuery('noticeid') || 0
                    }
                };

                $.extend(model.data, _this.setDefaultParams());

                return cliftService.getNoticeDetail(model)
                    .then(function (result) {

                        if (result.state == 0) {

                            var data = result.data.detail;

                            data.noticePhotos = data.photos && data.photos.split(',');
                            data.noticeid = model.data.id;
                            // data.clientHeight = (window.screen.height || 736) - 64;

                            //设置页面title
                            //document.title = data.title;
                            jb.topbarHandler('center', '', data.title)

                            tmplDetailContent.html(tmplDetailCompier(data));

                        } else {

                            jb.toastHandler(result.msg);
                        }

                        return result.data
                    })
                    .then(function (data) {

                        // console.log(data)
                        if (data) {
                            tmplPhotoContent.html(tmplPhotoCompier(data.detail));
                        }

                    })
                    .then(function () {
                        $('.m-carousel').carousel();
                        _this.lazyLoad();
                    });
            },

            /**
             * 设置帖子详情 iscroll
             */
            noticeDetailListScroll: function () {
                window.ListScrollers = {};
                window.ListPages = {};
                var _this        = this,
                    scrollers    = [],
                    $wrappers    = $('.wrapper'),
                    $tabContents = $('.tab-content');

                $wrappers.each(function (index) {

                    var _thisScroll = scrollers[index],
                        tid         = $(this).attr('id'),
                        temp        = {};

                    _thisScroll = new IScroll('#' + tid, {
                        mouseWheel: true,
                        click: true,
                        tap: true,
                        eventPassthrough: false,
                        preventDefault: false
                    })
                    ;

                    _thisScroll.on("scrollEnd", function () {

                        _this.lazyLoad();

                        //判断是否上拉加载分页数据
                        var $wrapper = $(this.wrapper),
                            wHeight  = $wrapper.height(),
                            sHeight  = $wrapper.find('.scroller').height();

                        if (this.y < 0 &&
                            this.y < (sHeight - wHeight) &&
                            (wHeight - this.y + 100) > sHeight
                        ) {

                            // console.log(tid)
                            //done
                            var cp = ListPages[ListScrollers[tid].selectedItem];
                            var cs = ListScrollers[tid];

                            // console.log(cp, cs)

                            if (cp.islastPage == 0 && cs.fetchStatus == 0) {

                                _this.getPostsList(cp);

                            } else {
                                //done
                                // Util.dialog.showMessage('已经最后一页了.');
                                jb.toastHandler('已经最后一页了');
                            }
                        } else {

                            _this.refreshDetailWrapper();
                        }
                    });

                    //全局scroller
                    temp[tid] = {
                        scroller: _thisScroll,
                        selectedItem: 'detail',
                        /*ajax请求状态*/
                        fetchStatus: 0
                    }
                    $.extend(window.ListScrollers, temp);

                    //分页信息,默认0开始
                    //temp2[cid] = {total: total, pageNo: 0, pageSize: 10};

                    var obj = {};

                    obj[tid] = {
                        islastPage: $(this).data('islastPage') || 0,
                        total: $(this).data('total') || 10000,
                        pagenum: 1,
                        pagesize: 10,
                        tid: tid
                    }
                    $.extend(window.ListPages, obj);

                    if ($(this).hasClass('selected')) {
                        temp[tid].selectedItem = tid;
                    }

                });

                document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
                _this.refreshDetailWrapper();
            },

            /**
             * 刷新iscroll
             */
            refreshDetailWrapper: function () {

                var _this = this;

                setTimeout(function () {

                    _this.lazyLoad();

                    window.ListScrollers && window.ListScrollers['detail'].scroller.refresh();
                }, 200)

            },

            /**
             * 详情页图片相册
             */
            noticeCarousel: function () {

                var $detail = $('#notice-detail'),
                    $target = $('.lift-photo');

                $detail.delegate('.detail-img', 'click', function (e) {

                    e.preventDefault();
                    e.stopImmediatePropagation();

                    // var index       = $(e.target).data('index'),
                    //     $carousel   = $('.m-carousel'),
                    //     $items      = $carousel.find('.m-item'),
                    //     $inner      = $carousel.find('.m-carousel-inner'),
                    //     $controls   = $carousel.find('.m-carousel-controls a'),
                    //     active      = 'm-active',
                    //     clientWidth = window.screen.width;
                    //
                    // console.log(index)
                    //
                    // $items.removeClass(active).eq(index).addClass(active);
                    // $controls.removeClass(active).eq(index).addClass(active);
                    //
                    // // transform: translate3d(0px, 0px, 0px);
                    // $inner.css({
                    //     transform: 'translate3d(-' + (clientWidth * index) + 'px, 0px, 0px)'
                    // })
                    //
                    // $controls.eq(index).trigger('click');
                    //
                    //
                    // console.log($controls.eq(index))

                    $target.removeClass('none');

                });

                var startX = 0;
                var startY = 0;
                var moveX = 0;
                var moveY = 0;
                var deltaX = 0;
                var deltaY = 0;

                $target.delegate('.m-item', 'touchstart touchmove touchend', function (e) {

                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var type = e.type;

                    if (e.targetTouches.length == 1) {
                        var touch = event.targetTouches[0];

                        if (type == 'touchstart') {
                            startX = touch.pageX;
                            startY = touch.pageY;
                        }

                        if (type == 'touchmove') {
                            moveX = touch.pageX;
                            moveY = touch.pageY;
                            deltaX = moveX - startX;
                            deltaY = moveY - startY;
                        }

                    }

                    if (type == 'touchend') {

                        // console.log(startX, moveX, deltaX, startY, moveY, deltaY)

                        if (Math.abs(deltaX) < 10) {
                            $target.addClass('none');
                        }

                        //reset
                        startX = 0;
                        startY = 0;
                        moveX = 0;
                        moveY = 0;
                        deltaX = 0;
                        deltaY = 0;

                    }
                })

            },

            /**
             * 帖子列表
             */
            getPostsList: function (options) {
                var _this            = this,
                    tmplPosts        = $("#tmpl-notice-posts").html(),
                    tmplPostsCompier = Handlebars.compile(tmplPosts),
                    tmplPostsContent = $('.posts-list');

                Handlebars.registerHelper('htmlEscape', function (string) {
                    return new Handlebars.SafeString(string)
                });

                var model = {
                    data: {
                        id: Util.getQuery('noticeid')
                    }
                };

                // var publisherId = Util.getQuery('publisherid');
                var publisherId = $('input[name="post-info"]').val();

                $.extend(model.data, _this.setDefaultParams());
                $.extend(model.data, options || {pagesize: 10, pagenum: 1});

                // console.log(model)

                //正在fetch data
                window.ListScrollers && ( window.ListScrollers['detail'].fetchStatus = 1);

                return cliftService.getPostsList(model)
                    .then(function (result) {

                        if (result.state == 0) {

                            $.map(result.data.list, function (item) {

                                //有没有回复的节点
                                item.hasParentReply = !!item.parentReply;

                                if (item.parentReply) {

                                    item.parentReply.photoReplace = (item.parentReply.photos || '')
                                        .split(/,/)
                                        .map(function (p) {
                                                return !p ? '' : '[图片]'
                                            }
                                        ).join('');

                                    // console.log(item.parentReply.photos,item.parentReply.photoReplace)
                                }

                                // console.log(item.replierId, publisherId)

                                //有没有删除的节点
                                item.hasDelete = (item.allowDelete == 1);

                                item.hasPhoto = !!item.photos;
                                item.noticePhoto = item.photos && item.photos.split(',').shift();

                                return item;
                            })

                            //通知id
                            result.data.noticeid = model.data.id;

                            tmplPostsContent.append(tmplPostsCompier(result.data));

                        } else {

                            jb.toastHandler(result.msg);
                        }

                        return result.data
                    })
                    .then(function (data) {
                        // _this.setPageInfo('type' + options.type);

                        // console.log(data)

                        tmplPostsContent.prev('h2').removeClass('none')

                        data && $('#detail')
                            .data('total', data.total)
                            .data('islastPage', data.islastPage);

                        _this.updatePageInfo({
                            total: data && data.total,
                            type: 'detail',
                            typeName: 'detail',
                            islastPage: data && data.islastPage
                        })

                    })
                    .then(function () {
                        _this.lazyLoad();
                        _this.refreshDetailWrapper();
                    })
                    .done(function () {
                        window.ListScrollers && (window.ListScrollers['detail'].fetchStatus = 0);
                        console.log('done')
                    });
            },

            /**
             * 团购列表，精彩活动倒计时-需要登录
             */
            getGroupList: function () {

                var _this             = this,
                    tmplGroup         = $("#tmpl-group-list").html(),
                    tmplGroupCompier  = Handlebars.compile(tmplGroup),
                    $tmplGroupContent = $('.life-group');

                var model = {data: {}};

                $.extend(model.data, _this.setDefaultParams());
                $.extend(model.data, {type: 1});

                cliftService.getGroupbuyList(model)
                    .then(function (result) {

                        if (result.state == 0) {

                            // "startTime": "20161020120000"
                            // "endTime": "20161030120000"
                            // result.data.list = result.data.list.slice(0, 1)

                            $.map(result.data.list, function (item) {

                                item.targetConditonJson = JSON.stringify(item.targetConditon)

                                return item;
                            });

                            $tmplGroupContent.html(tmplGroupCompier(result.data));

                        } else {

                            jb.toastHandler(result.msg);
                        }
                    })
                    .then(function () {

                        _this.setGroupCountDown();
                    });
            },

            /**
             * 首页团购列表，精彩活动倒计时-不需要登录
             */
            getHomeADGroupList: function (adtype) {

                var _this             = this,
                    tmplGroup         = $("#tmpl-group-list").html(),
                    tmplGroupCompier  = Handlebars.compile(tmplGroup),
                    $tmplGroupContent = $('.life-group');

                var model = {data: {}};

                //shopId	string	false	店铺ID
                //adtype	string	false	广告类型（1-轮播图，2-今日好货，3-分类，4-近店优惠，为空代表所有广告）

                $.extend(model.data, {adtype: adtype, t_id: +new Date()});

                cliftService.getADList(model)
                    .then(function (result) {

                        if (result.state == 0) {

                            // "startTime": "20161020120000"
                            // "endTime": "20161030120000"
                            // result.data.list = result.data.list.slice(0, 1)

                            $.map(result.data.goodsToday, function (item) {

                                item.targetConditonJson = JSON.stringify(item.targetConditon)

                                return item;
                            });

                            $tmplGroupContent.html(tmplGroupCompier(result.data));

                        } else {
                            jb.toastHandler(result.msg);

                        }
                    })
                    .then(function () {

                        _this.setGroupCountDown();
                    });
            },

            /**
             * 申请开通企业
             */
            setContact: function () {
                var _this          = this,
                    $contactOpator = $('#contact-opator'),
                    $overview      = $('#overview'),//查看示例
                    $form          = $('form'),
                    klass          = 'curr-btn';

                var rules = {
                    name: {
                        // required: true,
                        reg: /^[\d\w\u4e00-\u9fa5]{2,20}$/,
                        msg: '请正确填写您的姓名'
                    },
                    position: {
                        // required: true,
                        reg: /^[\d\w\u4e00-\u9fa5]{2,20}$/,
                        msg: '请填写您在公司的岗位'
                    },
                    phonestr: {
                        // required: true,
                        reg: /^13[0-9]{9}$|14[0-9]{9}|15[0-9]{9}$|18[0-9]{9}$|17[0-9]{9}$/,
                        msg: '请输入正确的手机号码'
                    },
                    company: {
                        // required: true,
                        reg: /^[\d\w\u4e00-\u9fa5]{2,30}$/,
                        msg: '请填写您所在的公司名称'
                    }
                }

                $contactOpator.on('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var $this   = $(this),
                        params  = $form.serializeArray(),
                        model   = {data: {}},
                        exModel = {},
                        //验证状态
                        flag    = true;

                    if (!$this.hasClass(klass)) {
                        return;
                    }

                    for (var i = 0; i < params.length; i++) {
                        var r = _this.validRule(params[i], rules);

                        if (!r.flag) {

                            jb.toastHandler(r.msg);

                            flag = false;
                            break;
                        }

                        exModel[params[i].name] = params[i].value;

                    }

                    $.extend(model.data, _this.setDefaultParams());
                    $.extend(model.data, exModel);

                    return flag && cliftService.setContact(model)
                            .then(function (result) {
                                //Util.dialog.showMessage(result.msg);

                                if (result.state == 0) {

                                    $.dialog({
                                        subtitle: '提交申请成功',
                                        contentHtml: '将有专人联系你，请耐心等待'
                                    })

                                } else {

                                    $.dialog({
                                        subtitle: '提交申请失败',
                                        contentHtml: result.msg
                                    })
                                }
                            })

                });

                $form.delegate('input', 'input', function (e) {
                    var $inputs = $form.find('input'),
                        leg     = $inputs.length,
                        temp    = [];

                    for (var i = 0; i < leg; i++) {
                        if ($.trim($inputs[i].value)) {
                            temp.push($inputs[i].value)
                        }
                    }

                    if (temp.length == leg) {
                        $contactOpator.addClass(klass);
                    } else {
                        $contactOpator.removeClass(klass);
                    }

                });

                ///查看示例
                $overview.on('click', function (e) {

                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var params = {
                        url: location.origin + '/life/assets/pages/qylife/example.html'
                    }

                    console.log(params)

                    jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params), params.url);

                });

            },

            /**
             * 验证表单
             * @param model {name:string, value:string}
             * @returns {flag:boolean,msg:string}
             * @private
             */
            validRule: function (model, rules) {

                var expect = rules[model.name];
                //默认不通过
                var flag = (!expect || !expect.reg) ? true : expect.reg.test(model.value);

                return {
                    name: model.name,
                    flag: flag,
                    msg: flag ? '' : expect.msg
                }

            },

            /**
             * 团购时间倒计时
             * @param options
             * @param $target
             */
            formatGroupTime: function (options, $target) {

                //单位：秒
                // options = {
                //     // "serverTime": "20161024120000",
                //     "startTime": "5",
                //     "endTime": "20"
                // }

                //test
                // options.serverTime =

                //正式线更换

                //服务器时间
                var serverDate = new Date();

                //开始时间
                var startDate = new Date(Util.formatDate2(options.startTime, 'yyyy-MM-dd hh:mm:ss'));
                //结束时间
                var endDate = new Date(Util.formatDate2(options.endTime, 'yyyy-MM-dd hh:mm:ss'));

                var serverTS = serverDate.getTime();
                var startTS = startDate.getTime();
                var endTS = '';

                //385.199 s

                //还没开始
                startTS = serverTS + options.startTime * 1000;
                endTS = serverTS + options.endTime * 1000;

                var duration;
                var timer = setInterval(function () {

                    var statusStr,
                        tempStartTS,
                        tempEndTS;

                    //未开始
                    // if (startTS >= serverTS) {
                    //     statusStr = '距离开始还有';
                    //     duration = countdown(serverTS, startDate);
                    // } else {
                    //     statusStr = '距离结束还剩';
                    //     duration = countdown(serverTS, endDate);
                    // }

                    //未开始
                    if (options.startTime > 0) {
                        statusStr = '距离开始还有';
                        duration = countdown(serverTS, startTS);
                    } else if (options.startTime <= 0) {

                        statusStr = '距离结束还剩';
                        duration = countdown(serverTS, endTS);
                        // console.log('进行中', duration)
                    }

                    // if (duration) {
                    //     tempStartTS = duration.start.getTime();
                    //     tempEndTS = duration.end.getTime();
                    // }

                    // console.log(endTS - serverTS,duration)

                    serverTS += 1000;
                    options.startTime -= 1;

                    var str = '';
                    if (duration.value > 0) {
                        var hh = duration.hours.toString().length == 1 ? '0' + duration.hours : duration.hours,
                            mm = duration.minutes.toString().length == 1 ? '0' + duration.minutes : duration.minutes,
                            ss = duration.seconds.toString().length == 1 ? '0' + duration.seconds : duration.seconds,
                            dd = ((duration.days > 0) ? (duration.days) : '0');

                        str =
                            '<div class="inner">' +
                            '<div class="fr datetime">' +
                            '<span class="hh">' + hh + '</span>:<span class="mm">' + mm + '</span>:<span class="ss">' + ss + '</span>' +
                            '</div>' +
                            '<div class="fr">' + statusStr + (dd == 0 ? '' : '<strong class="dd">' + dd + '</strong>天</div>') +
                            '</div>';

                        // str = (
                        //     (duration.months > 0) ? (duration.months + '月') : '') +
                        //     ((duration.days > 0) ? (duration.days + '天') : '') +
                        //     duration.hours + '小时' +
                        //     duration.minutes + '分' +
                        //     duration.seconds + '秒';

                        // console.log('距离结束还剩 ' + str);

                        $target.html(str);
                    } else {

                        //15:15-24:00
                        clearInterval(timer);
                        $target.html('<div class="fr"><span class="end">已结束</span></div>');
                        console.log('已结束')

                    }
                    //console.log(new Date(serverTS + 1000))
                    // console.log(duration);
                    //con、sole.log(duration.hours, duration.minutes, duration.seconds, duration.value);

                }, 1000);

            },

            /**
             * 格式化
             */
            formatNotice: function (options) {
                //data
                //2016//1/0/ 20: 1:7:
                // var options = {
                //     date: "2016-10-22 08:58:00",
                //     number: 2300
                // }

                //格式化时间
                var now               = new Date(),
                    currentTimeStramp = now.getTime(),
                    origrnTime        = new Date(Util.formatDate2(options.date, 'yyyy-MM-dd hh:mm:ss')),
                    origrnTimeStramp  = origrnTime.getTime(),
                    during            = currentTimeStramp - origrnTimeStramp,
                    baseHour          = 60 * 60 * 1000,
                    s                 = '';

                if (!during) {
                    s = options.date
                } else {
                    if (during < baseHour) {
                        s = Math.floor(during / 60 / 1000) + '分钟前';
                    } else if (during < baseHour * 24) {
                        s = Math.floor(during / 60 / 60 / 1000) + '小时前';
                    }
                    else if (during < baseHour * 24 * 2) {
                        s = '昨天';
                    } else {

                        s = Util.formatDate2(options.date, 'MM-dd')
                    }
                }

                //格式化数字

                var n = parseInt(options.number);

                // if (n > 999) {
                //     n = ( n / 1000).toFixed(2) + 'k';
                // } else if (n > 9999) {
                //     n = ( n / 10000).toFixed(2) + 'w';
                // }
                // console.log(n)

                return {
                    date: s,
                    number: n
                };
            },

            /**
             * 启动团购时间倒计时
             */
            setGroupCountDown: function () {
                var _this = this;

                $('.item').livequery(function () {
                    var $this = $(this);
                    var $target = $this.find('.desc');
                    var options = {
                        startTime: $this.data('starttime').toString(),
                        endTime: $this.data('endtime').toString(),
                    };

                    _this.formatGroupTime(options, $target);
                })

            },

            /**
             * 设置通知列表请求参数
             * @param options
             * @returns {{$target: *, params: *}}
             */
            setNoticeParams: function (options) {

                //tab容器
                var $noticeList        = $('#notice-list'),
                    $partnerNoticeList = $('#partnerNotice-list'),
                    $welfareList       = $('#welfare-list'),
                    $target;

                switch (options.type) {
                    case 1:
                        $target = $noticeList;
                        break;
                    case 2:
                        $target = $partnerNoticeList;
                        break;
                    case 3:
                        $target = $welfareList;
                        break;
                }

                var pageInfo = window.ListPages && window.ListPages['type' + options.type];

                return {
                    $target: $target,
                    params: $.extend({
                        optype: 1,
                        pagesize: pageInfo && pageInfo.pagesize || 10,
                        pagenum: pageInfo && pageInfo.pagenum || 1
                    }, options)
                }
            },

            /**
             * 关闭顶部提示语
             */
            closeNoticeTip: function () {

                var $companyContent = $('#company-content');

                $companyContent.livequery(function () {

                    var $lifeNotice = $(this).find('.life-notice'),
                        $close      = $lifeNotice.find('.close');
                    $close.on('click', function (e) {
                        $lifeNotice.addClass('none');
                    });
                })

            },

            /**
             * 图片延迟加载
             */
            lazyLoad: function () {

                // $(".imgbox img").livequery(function () {
                //
                //
                //     $(this).unveil(200, function () {
                //         $(this).removeClass('unveil-img')
                //     });
                // })
            },

            clearSessionStorage: function (key) {

                !key ? sessionStorage.clear() : sessionStorage.clear(key);
            },

            /**
             * 设置url query
             * @returns {{userid: (*|string|number), token: (*|string|string)}}
             */
            setDefaultParams: function () {
                return {
                    token: WEB_CONFIG.appInfo.token || Util.getQuery('token'),
                    t_id: +new Date()
                }
            },

            /**
             * 隐藏顶部右侧按钮
             */
            hiddenRightBtn: function () {

                jb.topbarHandler('right', '', '', '')
            },

            /**
             * 帖子详情
             */
            web2PostsDetail: function () {

                $('.life-list').livequery(function () {

                    $(this).delegate('li', 'click', function (e) {

                        e.preventDefault();
                        e.stopImmediatePropagation();

                        var publishStatus = $('#publishStatus').val() || 0;
                        //添加fromwhere=list 是为了标识从哪里进来详情页，发完贴进来的详情页没有fromwhere
                        var url = location.origin + '/life/assets/pages/clife/' + $(this).data('href') + '&fromwhere=list&publishstatus=' + publishStatus;
                        var params = {
                            url: url
                        }

                        console.log(params)

                        jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params), url);

                    });
                })

            },

            /**
             * 发帖
             */
            web2PostsPublish: function () {

                $('#publish-posts').livequery('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    //限制发帖
                    var publishStatus = $('#publishStatus').val() || 0;

                    if (publishStatus == -1) {

                        jb.toastHandler('您不是此企业员工，没有权限进行此项操作')

                        return;
                    }

                    if (publishStatus == 0) {

                        jb.toastHandler('你已被禁言，暂无权限发帖或回复')

                        return;
                    }

                    jb.routerHandler(WEB_CONFIG.nativePage.clife.postsPublish.id);

                });

            },

            /**
             * 回复帖子 , 删除回复
             */
            web2PostsReply: function () {

                var _this = this;
                $('.reply-posts').livequery('touchstart', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var $this      = $(this),
                        //回复类型：回复楼主0，普通回复1 -1访客不允许
                        sendtype   = $this.data('sendtype'),
                        allowReply = $('#allow-reply').val() || 0;

                    //
                    _this.refreshDetailWrapper();

                    //限制发帖
                    //是否允许回复  0发帖作者设置不允许，1允许，2禁言不允许，-1访客不允许
                    var msg = '';
                    switch (parseInt(allowReply)) {
                        case -1:
                            msg = '您不是此企业员工，没有权限进行此项操作';
                            break;
                        case 0:
                            msg = '作者设置了不允许回复';
                            break;
                        case 2:
                            msg = '你已被禁言，暂无权限发帖或回复';
                            break;
                    }

                    if (allowReply != 1) {
                        jb.toastHandler(msg)
                        return;
                    }

                    var $postsInfo  = !sendtype ? $('input[name="post-info"]') : $this,
                        //通知id
                        noticeid    = $postsInfo.data('noticeid').toString(),
                        replierId   = $postsInfo.data('replierid').toString(),
                        publishName = $postsInfo.data('publishname') || '',

                        //0 可以发图片，1 不可以发图片
                        replyType   = $postsInfo.data('replytype').toString();

                    var params = {
                        replyMessageID: noticeid,
                        replyMessageName: publishName,
                        replyMessageCommentId: replierId,
                        replyMessagePhotoFlag: replyType
                    }

                    console.log(params)

                    jb.routerHandler(WEB_CONFIG.nativePage.clife.postsReply.id, JSON.stringify(params));

                });

                $('.delete-posts').livequery('touchstart', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    var $this = $(this);
                    var model = {
                        data: {
                            replyid: $this.data('replierid')
                        }
                    };

                    $.extend(model.data, _this.setDefaultParams());
                    //弹出框，请求接口
                    $.dialog({
                        type: 'confirm',
                        contentHtml: '是否确认删除，一经删除，将不能恢复。',
                        onClickOk: function () {
                            cliftService.deleteMyReply(model)
                                .then(function () {
                                    //移除dom
                                    $this.parents('li').remove();
                                    //刷新wraper
                                    window.ListScrollers && window.ListScrollers['detail'].scroller.refresh();
                                })
                        }
                    })

                });

            },

            /**
             * 团购跳转
             */
            web2PlatformGroupBuyDetail: function () {

                //life-welfare
                var $groupbuyList = $('.groupbuy-list');

                $groupbuyList.livequery(function () {
                    $(this).delegate('.groupbuy-item', 'click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        var $this  = $(this),
                            params = $this.data('params');

                        console.log(params)

                        // try {
                        //     params = JSON.parse(params)
                        //
                        // } catch (ex) {
                        //     console.log(ex)
                        //     params = null;
                        // }

                        !!params && jb.routerHandler(params.tm.toString(), params.tp || '', params.tu || '');

                        // jb.routerHandler(WEB_CONFIG.nativePage.clife.platformGroupBuyDetail.id, JSON.stringify(params));
                    })
                });

            },

            /**
             * 平台商品详情页跳转
             */
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

            /**
             * 设置【申请开通】按钮
             */
            web4SetContactToolbar: function () {

                // cc.setTopbar('right', '', "添加", "addCouponJavascriptHandler");

                var qs = Util.getQueryString();

                window.WebViewJavascriptBridge.registerHandler('contactJavascriptHandler', function (data, responseCallback) {

                    location.href = location.origin + '/life/assets/pages/clife/contact.html?' + qs;

                });

                jb.topbarHandler('right', '', '企业加入', 'contactJavascriptHandler')

            },

            /**
             * 设置【员工加入】按钮
             */
            web4SetJoinToolbar: function () {

                // cc.setTopbar('right', '', "添加", "addCouponJavascriptHandler");

                var qs = Util.getQueryString();

                window.WebViewJavascriptBridge.registerHandler('contactJavascriptHandler', function (data, responseCallback) {

                    location.href = location.origin + '/life/assets/pages/qylife/join.html?' + qs;

                });

                jb.topbarHandler('right', '', '员工加入', 'contactJavascriptHandler')

            },

            /**
             * 注册js方法
             */
            registerJsHandler: function () {
                var _this = this;
                //回复帖子后调用js的方法
                window.WebViewJavascriptBridge.registerHandler('replyResult', function (data, responseCallback) {
                    // data = $.parseJSON(data);
                    // {
                    //    "state":0,
                    //    "msg":"ok",
                    //    "data":{
                    //        forumid:"323232" //帖子id
                    //

                    //发帖后执行的操作
                    location.href = location.href;

                });
                //详情页左上角返回的事件
                window.WebViewJavascriptBridge.registerHandler('detailGoback', function (data, responseCallback) {

                    //var $target = $('.lift-photo');
                    // if (!$target.hasClass('none')) {
                    //     $target.addClass('none')
                    // } else {
                    jb.historygoHandler('native');
                    var userinfo = {
                        "fromwhere": Util.getQuery('fromwhere') || ''
                    }
                    // if (!Util.getQuery('fromwhere')) {
                    //     //如果是发完帖子进来的详情页，点击返回通知列表页刷新数据
                    //
                    // }
                    jb.postNotification('publishPostFinished', JSON.stringify(userinfo));

                    // }

                    //
                    // if ($('.lift-photo').css('display') == 'block') {
                    //     $('.lift-photo').hide();
                    // } else {
                    //     jb.historgoHandler('native')
                    // }
                    //
                    //responseCallback("jekejeee")
                });
                //发布帖子后调用js的方法
                window.WebViewJavascriptBridge.registerHandler('postlistUpdate', function (data, responseCallback) {
                    var lScroll = window.ListScrollers['life-content'],
                        lPages  = window.ListPages[lScroll.selectedItem],
                        tab     = $('.tab-nav').find('li').filter('.selected').data('tab');
                    var type = '';
                    lPages.pagenum = 1;
                    lPages.pagesize = 10;

                    if (tab == 'status-partner') {
                        type = 2;
                    } else if (tab == 'status-notice') {
                        type = 1;
                    }

                    _this.switchTabsData({tab: tab, type: type, fetchType: 'pulldown'});
                    // _this.switchTabsData({tab: 'status-partner', type: 2, fetchType: 'pulldown'});

                    if (typeof data == 'string') {
                        data = JSON.parse(data)
                    }

                    if (!data.params.fromwhere) {
                        lScroll.scroller.scrollTo(0, 0);
                    }

                });
            },

            setCropJoin: function () {

                var tmpl        = $("#tmpl-partial").html(),
                    tmplCompier = Handlebars.compile(tmpl),
                    tmplContent = $('#content');

                var data = {
                    qs: Util.getQueryString()

                };

                tmplContent.html(tmplCompier(data));
            },

            /**
             * 卡密激活、邮箱激活
             * @param type
             */
            setCropActive: function (type) {
                var _this          = this,
                    $contactOpator = $('#contact-opator'),
                    $form          = $('form'),
                    klass          = 'curr-btn';

                var rules = {
                    km: {
                        username: {
                            reg: /^[\u4e00-\u9fa5]{1,16}$/,
                            msg: '您输入的姓名格式有误，请重新填写'
                        },
                        corpseckey: {
                            reg: /^[\w\d]{8}$/,
                            msg: '您输入的卡密格式有误，请您仔细检查'
                        }
                    },
                    em: {
                        username: {
                            reg: /^[\u4e00-\u9fa5]{1,16}$/,
                            msg: '您输入的姓名格式有误，请重新填写'
                        },
                        useremail: {
                            reg: /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/,
                            msg: '您输入的邮箱格式有误，请重新输入'
                        }

                    }
                }

                $contactOpator.on('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var $this   = $(this),
                        params  = $form.serializeArray(),
                        model   = {data: {}},
                        exModel = {},
                        //验证状态
                        flag    = true;

                    if (!$this.hasClass(klass)) {
                        return;
                    }

                    for (var i = 0; i < params.length; i++) {
                        var r = _this.validRule(params[i], rules[type]);

                        if (!r.flag) {

                            jb.toastHandler(r.msg);

                            flag = false;
                            break;
                        }

                        exModel[params[i].name] = params[i].value;

                    }

                    var phone = WEB_CONFIG.appInfo.phone || Util.getQuery('phone');

                    if (!phone) {

                        jb.toastHandler('手机号码为空');
                        return
                    }

                    if (!flag) {
                        return
                    }

                    exModel.phone = phone;

                    $.extend(model.data, _this.setDefaultParams());
                    $.extend(model.data, exModel);

                    // console.log(model, params)
                    var dataOrigin = '';//数据源
                    if (type === 'km') {
                        dataOrigin = cliftService.setCardsecActive(model);
                    }
                    if (type === 'em') {
                        dataOrigin = cliftService.setCorpmailActive(model);
                    }

                    return flag && dataOrigin && dataOrigin.then(function (result) {
                            //Util.dialog.showMessage(result.msg);

                            if (result.state == 0) {
                                //卡密激活
                                if (type === 'km') {
                                    // "isAudit": //是否需要管理员审核 1、是  2、否
                                    var url = result.data.isAudit == 1 ? '/life/assets/pages/qylife/success-km.html' : '/life/assets/pages/clife/index.html';
                                    location.href = [
                                        location.origin,
                                        url,
                                        '?',
                                        Util.getQueryString(),
                                        '&name=',
                                        encodeURIComponent(result.data.corpName || ''),
                                        '&type=' + type
                                    ].join('');
                                }

                                if (type === 'em') {
                                    var url = '/life/assets/pages/qylife/success-em.html';
                                    location.href = [
                                        location.origin,
                                        url,
                                        '?',
                                        Util.getQueryString(),
                                        '&name=', encodeURIComponent(result.data.corpName || ''),
                                        '&type=' + type
                                    ].join('');
                                }

                            } else {
                                jb.toastHandler(result.msg);
                            }
                        });

                });

                $form.delegate('input', 'input', function (e) {
                    var $inputs = $form.find('input'),
                        leg     = $inputs.length,
                        temp    = [];

                    for (var i = 0; i < leg; i++) {
                        if ($.trim($inputs[i].value)) {
                            temp.push($inputs[i].value)
                        }
                    }

                    if (temp.length == leg) {
                        $contactOpator.addClass(klass);
                    } else {
                        $contactOpator.removeClass(klass);
                    }

                });

            },

            /**
             * 邮箱激活检验激活(app内打开)
             */
            checkEmailActive: function () {

                var _this = this;
                var $refresh = $('#refresh');
                $refresh.on('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var model   = {data: {}},
                        exModel = {},
                        type    = Util.getQuery('type'),
                        phone   = WEB_CONFIG.appInfo.phone || Util.getQuery('phone'),
                        token   = WEB_CONFIG.appInfo.token || Util.getQuery('token');

                    console.log(WEB_CONFIG.appInfo)

                    if (!phone) {

                        jb.toastHandler('手机号码为空');
                        return
                    }

                    exModel.phone = phone;
                    exModel.token = token;

                    $.extend(model.data, _this.setDefaultParams());
                    $.extend(model.data, exModel);

                    return cliftService.checkEmailActive(model).then(function (result) {

                        if (result.state == 0) {

                            //"isActive": //是否激活 1、是  2、否
                            if (result.data.isActive == 1) {

                                setTimeout(function () {
                                    location.href = [location.origin, '/life/assets/pages/clife/index.html?', Util.getQueryString()].join('');
                                }, 1000)

                                jb.toastHandler('您已成功加入' + (result.data.corpName || '') + '企业生活');
                            }

                        } else {
                            jb.toastHandler(result.msg);
                        }
                    });

                });

            },

            /**
             * 邮箱激活链接(web内打开)
             */
            emailActive: function () {

                var $tips    = $('.tips'),
                    $content = $('.success'),
                    model    = {data: {}},
                    exModel  = {};

                var tmpl        = $("#tmpl-partial").html(),
                    tmplCompier = Handlebars.compile(tmpl),
                    tmplContent = $('#content');

                exModel.randomkey = Util.getQuery('randomkey') || '';

                $.extend(model.data, exModel);

                return cliftService.emailActive(model).then(function (result) {

                    if ($.inArray(result.state, [0, 450723, 450724]) < 0) {
                        //自定义状态码
                        result.state = 999999;
                        console.log(result.msg)
                    }

                    var data = {
                        qs: Util.getQueryString(),
                        state: result.state + ''
                    };

                    console.log(data)

                    tmplContent.html(tmplCompier(data));

                });

            },
            /**
             * 激活成功
             */
            cropActiveSuccess: function () {

                var tmplSuccess        = $("#tmpl-partial").html(),
                    tmplSuccessCompier = Handlebars.compile(tmplSuccess),
                    $content           = $('.succ-cont'),
                    $toHome            = $('#toHome');

                var data = {
                    type: decodeURIComponent(Util.getQuery('type')),
                    corpName: decodeURIComponent(Util.getQuery('name')),
                    url: ['../clife/index.html', '?', Util.getQueryString()].join('')
                };

                $content.html(tmplSuccessCompier(data));

                $toHome.livequery(function () {
                    $(this).on('click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        jb.routerHandler(WEB_CONFIG.nativePage.homeModule.home.id);

                    })
                })

            },
            /**
             * 滑动固定导航栏
             */
            fixedNavbar: function () {

                var $tabWrapper = $('.tab-wrapper');

                $tabWrapper.livequery(function () {

                    //
                    // if($tabWrapper.length){
                    //
                    //     return
                    // }

                    // return

                    //外容器y偏移量
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

                    // console.log('offsetTop: ' + Math.ceil(offsetTop), 'tabNavHeight: ' + tabNavHeight,'contentOffsetTop: '+$contentOffsetTop);

                    var $shop = $('#shop'),
                        $wel = $('#welfare-list'),
                        $coupon = $wel.find('.life-coupon'),
                        $group = $wel.find('.groupbuy-list'),
                        $wap =$('.wrapper');

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
            }

        };

        return ClifeController;
    });
