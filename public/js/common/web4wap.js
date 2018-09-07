/**
 * 兼容wap
 *
 */

/**
 * 获取当前页面URL，encode过
 * @returns {string}
 */
function getCurrentUrl() {
    return encodeURIComponent(location.href)
}

/**
 *
 * @returns {*|string}
 */
function getToken() {

    return localStorage.getItem('token') || Util.getQuery('token')
}

/**
 *
 * @param token
 */
function setToken(token) {
    var t = token || Util.getQuery('token')
    t && localStorage.setItem('token', t)
}

// 'http://m4test.380star.com/goods.do',
// {td: "", tm: "20601", tp: "{"goodsid":"70247","pageTitle":""}", tu: "", tt: ""}
var DEST_CONFIG = {

    //modulename=order
    //transportType   0自营(小店)  1 分销（平台）

    10000: {
        path: '',
        params: {
            qs: []
        },
        mapRules: [
            {
                //符合映射条件
                expect: {},
                //匹配需要映射URL
                from: '/life/assets/pages/order-details.html',
                //映射的目标页面
                to: '/qrqd/orderToDetail.html',
                //目标页面需要的参数列表
                params: {
                    qs: [{
                        name: 'ordersn'
                        // alias: 'ordersn'
                    }, {
                        name: 'token'
                    }],
                    defaults: {
                        returnUrl: getCurrentUrl(),
                    }
                }
            }
        ]
    },
    //登录页 /qrqd/login.html?url=编码后的回跳地址&token=xxx
    20201: {
        //wap页面path
        path: '/login.html',
        params: {
            //参数query
            qs: [],
            //默认参数
            defaults: {
                returnUrl: getCurrentUrl()
            }
        }
    },
    //首页
    20301: {
        origin: 'wap',//wap h5
        // path: '/life/index.html',
        path: '/index.do',
        params: {
            //参数query
            qs: [
                {
                    name: 'token'
                }
            ]
        }
    },

    //有好货首页
    20501: {
        path: '',
        params: {
            qs: [{
                name: 'pageTitle',
            }],
        }
    },
    //热门分类更多（打不开）
    20502: {
        path: '/qrqd/sortIndex.html',
        params: {
            qs: [{
                name: 'pageTitle',
            }],
            //默认参数
            defaults: {
                returnUrl: getCurrentUrl(),
                // token: ''
            }
        }
    },
    //店铺分类列表（打不开）
    20503: {
        path: '/qrqd/sortGoodsList.html',
        params: {
            qs: [{
                name: 'categoryid',
            }, {
                name: 'subcategoryid',
            }, {
                name: 'order',
            }, {
                name: 'pageTitle',
            }],
        }
    },
    // 筛选页
    20504: {
        path: '',
        params: {
            qs: [],
        }
    },
    //抄底秒杀（活动页） 20505
    20505: {
        path: '',
        params: {
            qs: [{
                name: 'pageTitle',
            }, {
                name: 'adid'
            }],
        }
    },
    //元气好礼（活动页） 20506
    20506: {
        path: '/promotion.do',
        params: {
            qs: [{
                name: 'pageTitle',
            }, {
                name: 'promoid',
                alias: 'adid'
            }],
        }
    },
    //供应商店铺聚合列表页(
    20507: {
        path: '/qrqd/starStoreList.html',
        params: {
            qs: [{
                name: 'pageTitle',
            }],
        }
    },
    //公益店聚合列表
    20508: {
        path: '/qrqd/pubserviceList.html',
        params: {
            qs: [{
                name: 'ispubservice',
            }, {
                name: 'pageTitle',
            }],
        }
    },

    //平台商品详情页
    20601: {
        //wap页面path
        path: '/goods.do',
        params: {
            //参数query
            qs: [{
                // tp里面的参数键
                name: 'goodsid',
                // //参数别名
                // alias:'goodsId'
            }],
            //默认参数
            defaults: {
                flag: 0,
                returnUrl: getCurrentUrl(),
            }
        }
    },
    //店铺商品详情页
    20602: {
        path: '/goods.do',
        params: {
            qs: [{
                name: 'goodsid',
            }, {
                name: 'storeid'
            }],
            defaults: {
                flag: 1,
                returnUrl: getCurrentUrl(),
            }
        }
    },
    //平台商品团购详情页
    20603: {
        path: '/grouplist.do',
        params: {
            qs: [{
                name: 'goodsid',
            }],
            defaults: {
                returnUrl: getCurrentUrl()
            }
        }
    },
    // 商品收藏
    20604: {
        path: '',
        params: {
            qs: [{
                name: 'pageTitle',
            }],
        }
    },
    // 商品收藏列表
    20605: {
        path: '',
        params: {
            qs: [{
                name: 'pageTitle',
            }],
        }
    },
    // 购物车
    20606: {
        path: '/qrqd/shoppingCart.html',
        params: {
            qs: [{
                name: 'defaultIndex',
            },{
                name: 'isOne',
            }],
            defaults: {
                returnUrl: getCurrentUrl()
            }
        }
    },
    // 团购商品列表页
    20607: {
        path: '/qrqd/grouplist.html',
        params: {
            qs: []
        }
    },

    // 优惠券商品列表页
    20608: {
        path: '/qrqd/couGoodsList.html',
        params: {
            qs: [{
                name:'couponid',
                alias:'key_coupon_id'
            }]
        }
    },

    //店铺详情(wap需要传 storeid)
    20701: {
        path: '/store.do',
        params: {
            qs: [{
                name: 'storeid',
                alias: 'shopid'
            }, {
                name: 'pageTitle',
            }]
        }
    },
    //店铺分类商品列表
    20702: {
        path: '',
        params: {
            qs: [],
        }
    },
    //店铺名片
    20703: {
        path: '',
        params: {
            qs: [],
        }
    },
    //店铺收藏
    20704: {
        path: '',
        params: {
            qs: [],
        }
    },
    //店铺收藏列表
    20705: {
        path: '',
        params: {
            qs: [],
        }
    },
    //优惠券领取弹窗
    20706: {
        path: '',
        params: {
            qs: [],
        }
    },
    //小店店铺搜索结果
    20707: {
        path: '',
        params: {
            qs: [],
        }
    },
    //供应商店铺详情
    20708: {
        path: '/store.do',
        params: {
            qs: [{
                name: 'storeid',
                alias: 'shopid'
            }, {
                name: 'pageTitle',
            }]
        }
    },
    //优惠券店铺列表页
    20709: {
        path: '/qrqd/couponShop.html',
        params: {
            qs: [{
                name:'couponid',
                alias:'key_coupon_id'
            }]
        }
    },

    // 确认订单页
    20801: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 发票信息
    20802: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 订单列表
    20803: {
        path: '/qrqd/myOrder.html',
        params: {
            qs: [{
              name: 'orderType'
            }],
        }
    },
    // 订单详情
    20804: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 物流跟踪
    20805: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 申请退货退款
    20806: {
        origin: 'h5',//wap h5
        path: '/life/assets/pages/applyreturn.html',
        params: {
            qs: [{
                name: 'goodsid',
            }],
            defaults: {
                returnUrl: getCurrentUrl(),
            }
        }

    },
    // 申请退款
    20807: {
        origin: 'h5',//wap h5
        path: '/life/assets/pages/applyrefund.html',
        params: {
            qs: [{
                name: 'goodsid',
            }],
            defaults: {
                returnUrl: getCurrentUrl(),
            }
        }
    },
    // 售后列表
    20908: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 申请退款成功
    20809: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 客服介入
    20810: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 填写发货信息
    20811: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 售后详情
    20812: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 订单投诉
    20813: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 电子发票
    20814: {
        path: '',
        params: {
            qs: [],
        }
    },

    // 添加/编辑收货地址
    20901: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 收货地址选择页
    20902: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 收货地址列表
    20903: {
        path: '',
        params: {
            qs: [],
        }
    },

    // 扫码页
    21101: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 扫码加入企业 null

    // 通用搜索页
    21201: {
        path: '/qrqd/commonSearch.html',
        params: {
            qs: [{
                name: 'keyword'
            },{
                name:'returnUrl'
            }],
        }
    },
    // 搜索店铺结果页
    21202: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 搜索商品结果页
    21203: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 搜索品牌直达结果页
    21204: {
        path: '',
        params: {
            qs: [],
        }
    },

    // 消息列表 21301
    21301: {
        origin: 'h5',//wap h5
        path: '/life/assets/pages/msg-list.html',
        params: {
            qs: [],
            defaults: {
                returnUrl: getCurrentUrl()
            }
        }
    },

    // 企业生活 21401
    21401: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 未绑定页 21402
    21402: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 申请开通 21403
    21403: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 企业通知详情 21404
    21404: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 企业通知回复 21405
    21405: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 企业通知列表 21406
    21406: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 团购列表 21407
    21407: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 企业活动详情 21408
    21408: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 企业帖子回复 21409
    21409: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 企业帖子发布页 21410
    21410: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 企业帖子列表 21411
    21411: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 大图查看 21412
    21412: {
        path: '',
        params: {
            qs: [],
        }
    },

    // 个人中心首页 21601
    21601: {
        path: '/qrqd/personalCenter.html',
        params: {
            qs: [],
            //默认参数
            defaults: {
                returnUrl: getCurrentUrl()
            }
        }
    },
    // 个人资料设置 21602
    21602: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 操作指引 21603
    21603: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 客服中心 21604
    21604: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 我的帖子 21605
    21605: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 我的优惠券 21606
    21606: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 意见反馈 21607
    21607: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 绑定店铺 21608
    21608: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 绑定店铺搜索中间页 21609
    21609: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 提货人联系方式管理 21610
    21610: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 编辑提货人联系方式 21611
    21611: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 实名认证管理页 21612
    21612: {
        path: '',
        params: {
            qs: [],
        }
    },
    // 找回密码
    21705: {
      path: '/qrqd/forgetPwd.html',
      params: {
        qs: []
      }
    },
    37999: {
        origin: 'h5',
        path: '/life/index.html#/fujin',
        params: {
            qs: [],
        }
    },
    20609: {
        origin: 'h5',
        path: '/life/assets/pages/clife/qyShop.html',
        params: {
            qs: [{
                name: 'storeid',
                alias: 'shopid'
            }],
        }
    },
    // 找回密码
    21705: {
      path: '/qrqd/forgetPwd.html',
      params: {
        qs: []
      }
    },
    // wap支付页面
    21801: {
      path: '/pay/createThirdOrder.shtml',
      params: {
        qs: [{
          name: 'token'
        }, {
          name: 'orderno'
        }, {
          name: 'type'
        }]
      }
    },
    // 携程订单详情页，特殊wap页
    30001: {
      path: '/ctripDetail.do',
      params: {
        qs: [{
          name: 'token'
        }, {
          name: 'orderno'
        }, {
          name: 'orderType'
        }, {
          name: 'callback'
        }]
      }
    }
}


var web4wap = {

    /**
     *
     * @param args native的跳转规则
     * example： {td: "", tm: "20601", tp: "{\"goodsId\":\"58024\",\"pageTitle\":\"测试\"}", tt: "测试", tu: ""}
     * @returns {string}
     * @private
     */
    _parseUrl: function (args) {

        console.log(args)

        var tp     = JSON.parse(args.tp),
            tm     = parseInt(args.tm),
            tu     = args.tu,
            target = DEST_CONFIG[tm],
            host   = (target.origin === 'h5' ? WEB_CONFIG.global.H5_DOMAIN : WEB_CONFIG.global.WEB_PATH),
            page   = tm === 10000 ? (tp.externalUrl || tp.url || tu) : (host + target.path);

        if (!target) {
            return '';
        }

        //处理mapRule URL映射业务
        if (tm === 10000) {
            var parseMap = this._parseMapUrl(page, target);
            target.params = parseMap.params;
            page = parseMap.page;
            tp = parseMap.tp;

            console.log(parseMap)
        }

        //设置URL参数
        var params         = target.params,
            envParams      = (!!WEB_CONFIG.global.ENV && !/env=/i.test(page)) ? {env: WEB_CONFIG.global.ENV} : {},
            defaultsParams = !!params.defaults ? params.defaults : {},
            token          = getToken(),
            exParams       = Util.extend(defaultsParams, Util.extend(envParams, token ? {token: token} : {})),
            qs             = [],
            temp           = {};

        //渠道埋点
        if (!!Util.getQuery('channel')) {
            exParams = Util.extend(exParams, {channel: Util.getQuery('channel')});
        }

        params.qs && params.qs.forEach(function (item) {
            temp[item.name] = tp[item.alias ? item.alias : item.name]
        })

        var paramsAll = Util.extend(temp, exParams);

        for (var k in paramsAll) {
            qs.push(k + '=' + (paramsAll[k] || ''))
        }

        //处理外部URL带有参数情况
        if (tm === 10000) {
            var matchQs   = page.match('([\?]).*') || [''],
                matchPath = page.match('.*[\\?]') || [''],
                tempPath  = (matchPath[0] || page).replace(/\?/gi, ''),
                exqs      = (matchQs[0] || '').replace(/\?/gi, '');

            page = tempPath;
            exqs && qs.push(exqs)
        }

        page += qs.length ? '?' : '';
        page += qs.join('&');
        return page;

    },

    /**
     * 处理URL映射
     * @param page URL
     * @param target 配置规则
     * @returns {{page: *, params: {}, tp: {}}}
     * @private
     */
    _parseMapUrl: function (page, target) {

        var rule       = target.mapRules,
            ruleLength = rule.length,
            path       = '',
            params     = {},
            tp         = {};

        for (var i = 0; i < ruleLength; i++) {

            var reg    = RegExp(rule[i].from),
                expect = rule[i].expect || {},
                temp   = [];

            for (var k in expect) {

                var v1 = Util.getLikeQuery(page, k),
                    v2 = expect[k];

                (v1 !== '' && v2 !== '') && temp.push(v1 == v2)
            }

            if (reg.test(page)) {

                var flag = temp.some(function (item) { return !item});

                if (!flag) {

                    var qsArr  = (page.match('([\?]).*') || [''])[0].split('?').filter(function (item) {
                            return !!item
                        }),
                        qsTemp = {};

                    qsArr && qsArr[0].split('&').forEach(function (item) {

                        var kv = item.split('=')
                        qsTemp[kv[0]] = kv[1];

                    })

                    path = rule[i].to;
                    params = rule[i].params || {};
                    tp = qsTemp;

                    page = path;
                    break;
                }
            }

        }

        if (!/^(https?|\/\/)/.test(page)) {
            page = WEB_CONFIG.global.WEB_PATH + page;
        }

        // console.log(111, page, params, tp)
        return {page: page, params: params, tp: tp};
    },

    /**
     * 页面跳转
     * @param args
     */
    to: function (args) {

        var url = this._parseUrl(args);

        if (!!url) {
            console.log(url)
            location.href = url;
        }
        else {
            console.log('没配置该跳转编码', args)
        }

    },
    setHanderInfo: function (options) {
        //apiName, Icon, Text, Callhandler, Background
        // var _params = {
        //     text: Text || '',
        //     icon: Icon || '',
        //     callhandler: Callhandler || '',
        //     background: Background || ''
        //     align:apiName
        // };
        var header     = $('.header'),
            leftinfo   = $('.header .go-back'),
            rightinfo  = $('.header .go-home'),
            centerinfo = header.find('span');
        if (options.background)
            header.css('background', options.background)
        switch (options.align) {
            case 'left':
                if (options.text)
                    leftinfo.text(options.text);
                if (options.icon)
                    //leftinfo.find('img').attr('src', location.origin + '/life/assets/images/' + options.icon + '.png');
                if (options.callhandler) {

                    leftinfo.click(function () {
                        var leftfun = options.callhandler;
                        eval(leftfun + "()");
                    })
                }
                break;
            case 'center':
                centerinfo.html(options.text);
                break;
            case 'right':
                rightinfo.html(options.text);
                break;
        }

    },
    initial: function () {
        setToken()
    }
}

window.web4wap = web4wap;
