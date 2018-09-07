/**
 * 日志采集
 * Created by jahon on 2017/7/4.
 */

//商品_商品规格_商品类型_店铺_店铺类型
var RULES = {
    //商品级别规则
    PRODUCT: ['goodsId', 'specId', 'goodsType', 'shopId', 'shopType'],
    //店铺级别规则
    SHOP: ['shopId', 'shopType'],
    ORDER: ['orderSN'],
    // 无门槛页
    COUPONCENTER: ['couponid', 'activityid']
};

var CTM_CONFIG = {
    //首页模块
    homeModule: {
        h1: {
            name: 'HM01_轮播图广告',
            id: [100013],
            rule: []
        },
        h2: {
            name: 'HM02_第三方服务',
            id: [100014, 100015, 100016, 100017, 100018],
            rule: ['abbreviation']
        },
        h3: {
            name: 'HM03_星宝快报',
            id: [100019],
            rule: []
        },
        h4: {
            name: 'HM05_天天秒杀',
            id: [100020],
            rule: RULES.PRODUCT
        },
        h5_1: {
            name: 'HM12_超级拼团_更多',
            id: [100021],
            rule: []
        },
        h5_2: {
            name: 'HM12_超级拼团_商品',
            id: [100022],
            rule: RULES.PRODUCT
        },
        h6: {
            name: 'HM04_今日好货',
            id: [100023],
            rule: []
        },
        h7: {
            name: 'HM06_品牌闪购',
            id: [100024],
            rule: []
        },
        h8_1: {
            name: 'HM07_主题秒杀_更多',
            id: [100025, 100027, 100029],
            rule: []
        },
        h8_2: {
            name: 'HM07_主题秒杀_商品',
            id: [100026, 100028, 100030],
            rule: RULES.PRODUCT
        },
        h9_1: {
            name: 'HM08_明星旗舰馆_更多',
            id: [100031],
            rule: []
        },
        h9_2: {
            name: 'HM08_明星旗舰馆_商品',
            id: [100032],
            rule: []
        },
        h10: {
            name: 'HM11_楼层广告',
            id: [100033],
            rule: []
        },
        h11_1: {
            name: 'HM08_热门分类_更多',
            id: [100035],
            rule: []
        },
        h11_2: {
            name: 'HM08_热门分类_商品',
            id: [100034],
            rule: []
        },
        h12: {
            name: 'HM13_企业生活',
            id: [100037],
            rule: []
        },
        h13: {
            name: 'HM14_推荐',
            id: [100036],
            rule: []
        }
    },
    //店铺模块
    shopModule: {
        s1: {
            name: 'SH01_轮播图广告',
            id: [100040],
            rule: RULES.SHOP
        },
        s2: {
            name: 'SY01_轮播图广告',
            id: [100042],
            rule: RULES.SHOP
        },
        s3: {
            name: '收藏',
            id: [100041],
            rule: RULES.SHOP
        },
        s4: {
            name: '本店商品',
            id: [100043],
            rule: RULES.SHOP
        },
        s5: {
            name: '星链商品',
            id: [100044],
            rule: RULES.SHOP
        },
        s6: {
            name: '我的故事',
            id: [100052],
            rule: RULES.SHOP
        },
        s7_1: {
            name: '店主推荐_更多',
            id: [100045],
            rule: RULES.SHOP
        },
        s7_2: {
            name: '店主推荐_商品',
            id: [100046],
            rule: RULES.PRODUCT
        },
        s8: {
            name: '楼层广告',
            id: [100047],
            rule: RULES.SHOP
        },
        s9_1: {
            name: '本店上新_更多',
            id: [100048],
            rule: RULES.SHOP
        },
        s9_2: {
            name: '本店上新_商品',
            id: [100049],
            rule: RULES.PRODUCT
        },
        s10_1: {
            name: '本店热卖_更多',
            id: [100050],
            rule: RULES.SHOP
        },
        s10_2: {
            name: '本店热卖_商品',
            id: [100051],
            rule: RULES.PRODUCT
        },
        s11: {
            name: '店铺首页',
            id: [100052],
            rule: RULES.SHOP
        }
    },
    //订单模块
    orderModule: {
        o1: {
            name: '立即付款',
            id: [100010],
            rule: RULES.ORDER
        },
        o2: {
            name: '取消订单',
            id: [100011],
            rule: RULES.ORDER
        },
        o3: {
            name: '再次购买',
            id: [100012],
            rule: RULES.ORDER
        }
    },
    //商品详情
    goodsDetailsModule: {
        g1: {
            name: '立即付款',
            id: [100061],
            rule: RULES.SHOP
        },
        g2: {
            name: '取消订单',
            id: [100062],
            rule: RULES.SHOP
        }
    },
    //优惠券模块埋点
    couponCenterModule: {
      c1: {
        name: '无门槛领券页_新人礼包',
        id: [100102],
        rule: RULES.COUPONCENTER
      },
      c2: {
        name: '无门槛领券页_星券',
        id: [100103],
        rule: RULES.COUPONCENTER
      }
    }
}

var webCTM = {

    /**
     * 设置日志采集规范数据(点击逻辑使用)
     * @param ctm
     *      module 模块名称，用'/'区分多级节点
     *      index  模块索引
     *      params 业务参数
     *      example: {"module":"homeModule/h1","index":0,"params":{"type":"THS1"}}
     *
     * @returns {{atts: Array}}
     *      n key
     *      v value
     *      example: [{"n":"type","v":"THS1"},{"n":"eventname","v":"100013"}]
     */
    setCTM: function (ctm) {

        if (!ctm.module) {
            return {atts: []}
        }

        var module = ctm.module.split(/\//),
            index  = ctm.index || 0,
            params = ctm.params || {},
            target = CTM_CONFIG[module[0]][module[1]];

        params.eventname = (target.id[index] || target.id[0]) + '';
        params.index = index + '';

        //植入渠道埋点
        var channelName = Util.getQuery('channel');
        if (!!channelName) {
            params.channel = channelName;
        }


        // console.log(ctm.module, params.eventname, params.index)

        var temp = [];

        for (var k in params) {
            var t = {}
            t['n'] = k.toLowerCase()
            t['v'] = params[k]
            temp.push(t)
        }

        return {
            atts: temp
        }

    },

    /**
     * 设置ctm参数（模板绑定使用）
     * @param module String
     * @param index Number
     * @param ruleType String
     * @param data Object
     * @param exData Object
     */
    setCTMParams: function (module, index, ruleType, data, exData) {

        var rs   = RULES[ruleType],
            temp = {};

        if (!ruleType) {
            var md = module.split(/\//);
            var tg = CTM_CONFIG[md[0]][md[1]];
            rs = tg.rule;
        }
        if (!data) {
            data = {}
        }

        if (exData) {
            for (var key in exData) {
                data[key] = exData[key];
            }
        }

        data && rs.forEach(function (item) {temp[item] = (data[item] || '')});

        return JSON.stringify({
            module: module,
            index: index || 0,
            params: temp
        })
    },

    /**
     * 日志采集
     * http://172.30.2.36/wiki/UploadLogHandler/click#uploadLogHandler
     * @param jsb jsBridge实例
     * @param ctm 日志内容 {atts:[{n:String,v:String}]}
     * @private
     */

    ctm: function (jsb, ctm) {

        var data = this.setCTM(ctm);

        setTimeout(function () {data.atts.length && jsb.ctmClick(data)}, 50)

    }
}

window.webCTM = webCTM;

