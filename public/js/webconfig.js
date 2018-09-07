/**
 * Created by jahon on 16/08/30.
 */

'use strict';

var WEB_CONFIG = WEB_CONFIG || {};

;
(function init() {

    function getQuery(name) {
        var matchHash = window.location.hash.match('([\?]).*');
        var qs = [window.location.search, !!matchHash ? matchHash[0].replace(/\?/, '') : ''].join('&')
        var match = RegExp('[?&]' + name + '=([^&]*)').exec(qs);
        return !match ? '' : match[1].replace(/\+/g, ' ');
    }

    var env           = localStorage.getItem('env') || getQuery('env'),
        st            = getQuery('st'),
        entry         = getQuery('entry'),
        API_DOMAIN    = '',
        WEB_PATH      = '',
        H5_DOMAIN     = '',
        UPLOAD_DOMAIN = '',
        //管理后台
        MIN_DOMAIN    = '';

    if (/pre/gi.test(env)) {
        env = 'pre';
    }
    if (/idc/gi.test(env)) {
        env = 'idc';
    }

    switch (env) {
        case 'dev':
            API_DOMAIN = '//api4dev.380star.com';
            H5_DOMAIN = '//h5dev.380star.com:8128';
            WEB_PATH = entry == 2 ? '//f4dev.380star.com' : '//m4dev.380star.com';
            MIN_DOMAIN = '//min4dev.380star.com';
            UPLOAD_DOMAIN = '//up4dev.380star.com';
            break;
        case 'test':
            API_DOMAIN = '//api4test.380star.com';
            H5_DOMAIN = '//h5test.380star.com';
            MIN_DOMAIN = '//min4test.380star.com';
            WEB_PATH = entry == 2 ? '//f4test.380star.com' : '//m4test.380star.com';
            UPLOAD_DOMAIN = '//up4test.380star.com';
            break;

        case 'perf':
            API_DOMAIN = 'http://172.30.7.252:8025';
            H5_DOMAIN = '//h5test.380star.com';
            MIN_DOMAIN = '//min4test.380star.com';
            WEB_PATH = entry == 2 ? '//f4test.380star.com' : '//m4test.380star.com';
            break;

        case 'idc':
            API_DOMAIN = '//api.380star.com';
            H5_DOMAIN = '//h5.380star.com';
            MIN_DOMAIN = '//min.380star.com';
            WEB_PATH = entry == 2 ? '//f.380star.com' : '//m.380star.com';
            MIN_DOMAIN = '//min.380star.com';
            UPLOAD_DOMAIN = '//up.380star.com';
            break;
        case 'pre':
            API_DOMAIN = '//api4pre.380star.com';
            H5_DOMAIN = '//h5pre.380star.com';
            WEB_PATH = '//m4pre.380star.com';
            MIN_DOMAIN = '//min4pre.380star.com';
            UPLOAD_DOMAIN = '//up.380star.com';
            break;
        default:
            //线网
            API_DOMAIN = '//api.380star.com';
            H5_DOMAIN = '//h5.380star.com';
            WEB_PATH = entry == 2 ? '//f.380star.com' : '//m.380star.com';
            MIN_DOMAIN = '//min.380star.com';
            UPLOAD_DOMAIN = '//up.380star.com';

    }

    //debug
    // API_DOMAIN = 'http://127.0.0.1:8089/mock';

    WEB_CONFIG.global = {
        DEBUG: /(test|dev)/i.test(env),
        ENV: env,
        ST: getQuery('st') || !getQuery('appname'),
        ISAPP: !!getQuery('appname') && !getQuery('st'),
        API_DOMAIN: API_DOMAIN,
        WEB_PATH: WEB_PATH,
        H5_DOMAIN: H5_DOMAIN,
        MIN_DOMAIN: MIN_DOMAIN,
        UPLOAD_DOMAIN: UPLOAD_DOMAIN
    }

    window.API_DOMAIN = API_DOMAIN;
    window.WEB_PATH = WEB_PATH;
    window.UPLOAD_DOMAIN = UPLOAD_DOMAIN;

    //
    WEB_CONFIG.getQuery = getQuery;
    WEB_CONFIG.getApi = function (name, domain) {
        if (domain === 'wap') {
            return this.global.WEB_PATH + this.api[name];
        }
        if (domain === 'https') {
            var _domain = this.global.API_DOMAIN.replace('http://', 'https://');
            return _domain + this.api[name];
        }

        //由于后台接口不稳定，因此使用 min.380star.com切换(临时使用)
        if (/(\/newbuyer\/30|eamanage)/.test(this.api[name])) {
            return (this.global.MIN_DOMAIN + this.api[name]).replace(/\/newbuyer\/30/, '');
        }

        return this.global.API_DOMAIN + this.api[name];
    }

})();

WEB_CONFIG.api = {

    //接口转发
    // proxyUrl: 'http://172.30.2.50:8089/api',
    // proxyUrl: 'http://172.30.2.50:8089/mock',

    //商品订单列表
    orderlist: '/buyer/order/myorderlist.do',
    //商品订单详情
    orderDetail: '/buyer/order/myorderdetail.do',
    //订单是否有优惠券券列表赠送
    oderishavecoupon: '/marketing/35/coupon/orderhavecouponinfo.do',
    //充值订单列表
    rechargeOrderlist: '/newbuyer/31/recharge/rechargeOrderList.do',
    //充值订单详情
    rechargeOrderDetail: '/newbuyer/31/recharge/rechargeinfo.do',
    //取消订单
    cancelOrder: '/buyer/order/cancelorder.do',
    //删除订单
    removeorderrecord: '/buyer/order/removeorderrecord.do',
    //立即支付
    payorder: '/buyer/order/payorder.do',
    //确认收货
    comfirmreceipt: '/buyer/order/comfirmreceipt.do',
    //物流信息查询
    deliverflowinfo: '/buyer/order/deliverflowinfo.do',
    //消息列表
    mymsglist: '/buyer/mymsg/msglist.do',
    //设置消息状态（变已读）
    updatemsgstatus: '/buyer/mymsg/updatemsgstatus.do',
    //退货退款列表信息
    searchpostsale: '/buyer/postorder/searchpostsale.do',
    //售后详情信息
    postsaleddetail: '/buyer/postorder/postsaleddetail.do',
    //快递公司列表
    deliverycompanylist: '/buyer/postorder/deliverycompanylist.do',
    //提交退货发货地址
    submitpostsaledaddr: '/buyer/postorder/submitpostsaledaddr.do',
    //客服介入、订单投诉
    //submitmsg2service: '/buyer/postorder/submitmsg2service.do',
    submitmsg2service: '/newbuyer/30/api/saveCustServInterv.do',
    //取消售后申请
    updatepostsale: '/buyer/postorder/updatepostsale.do',
    //退货退款原因列表
    rufundcauselist: '/buyer/postorder/refundcauselist.do',
    //退款申请
    postsaledrecash: '/buyer/postorder/postsaledrecash.do',
    //退货退款申请
    postsaledregoods: '/buyer/postorder/postsaledregoods.do',
    //图片上传
    uploadimg: '/newbuyer/30/upload/file/multiUpload',
    //获取充值商品
    rechargegoods: '/newbuyer/31/recharge/rechargegoods.do',
    //店铺商品批量加入购物车
    batchupdatecartS: '/buyer/zy/cart/batchupdatecart.do',
    //平台商品批量加入购物车
    batchupdatecartP: '/buyer/cart/batchupdatecart.do',
    //获取充值详情
    rechargeinfo: '/newbuyer/31/recharge/rechargeinfo.do',
    //我的余额 mybalance
    mybalance: '/newbuyer/41/balance/mybalance.do',
    //用户余额明细
    recordlist: '/newbuyer/41/balance/recordlist.do',
    //余额详情
    recorddetail: '/newbuyer/41/balance/recorddetail.do',
    //扫描支付获取优惠券信息
    //scanpaycouponinfo: '/newbuyer/33/coupon/scanpaycouponinfo.do',
    //扫描支付领取优惠券
    //scanpayreceivecoupon: '/newbuyer/33/coupon/scanpayreceivecoupon.do',

    //下面是新接口
    //扫描支付获取优惠券信息
    scanpaycouponinfo: '/marketing/35/coupon/scanpaycouponinfo.do',
    //扫描支付领取优惠券
    scanpayreceivecoupon: '/marketing/35/coupon/scanpayreceivecoupon.do',
    //充值
    cardrecharge: '/newbuyer/41/balance/cardrecharge.do',

    //第三方：充值请求
    rechargereq: '/newbuyer/31/recharge/rechargereq.do',

    //福利首页 & 企业生活首页
    corplife: '/buyer/corplife/indexinfo.do',
    //商城首页 & 企业生活首页
    corplifeshoppingindex: '/newbuyer/33/corplife/corplifeshoppingindex.do',
    //商城首页列表
    corplifegoodsdetail: '/newbuyer/33/corplife/findcorplifegoods.do',
    //置顶通知列表
    topNotices: '/newbuyer/33/corplife/topnotices.do',
    //企业通知与帮帖列表
    noticeList: '/newbuyer/33/corplife/noticeforumlist.do',
    //通知与帮帖详情接口
    noticeDetail: '/newbuyer/33/corplife/noticeforumdetail.do',
    //福利首页
    welfareInfo: '/buyer/goods/walfareindex.do',
    //店铺标签商品列表接口
    welfareProductList: '/newbuyer/33/goods/shoptaggoodslist.do',
    //通知帖子列表
    postsList: '/newbuyer/33/corplife/noticeforumreplylist.do',

    //我的帖子删除接口
    deletemyforum: "/newbuyer/33/corplife/deletemyforum.do",

    //我的回复删除接口
    deletemyreply: "/newbuyer/33/corplife/deletemyreply.do",

    //申请开通企业生活
    contact: '/eamanage/corplife/applycorplife.do',
    //contact: '/newbuyer/34/corplife/applycorplife.do',
    //团购列表
    groupbuyList: '/newbuyer/33/goods/groupbuyiconlist.do',

    //购物车列表页
    cartList: '/buyer/cart/listgoods.do',
    //购物车商品更新/删除接口
    updateCart: '/buyer/cart/updatecart.do',
    //购物车结算
    settle: '/buyer/cart/settle.do',
    //购物车删除
    batchDeleteCart: '/buyer/cart/batchdeletecart.do',

    // 卡密激活
    cardsecactive: '/newbuyer/33/corplife/cardsecactive.do',
    // 填写邮箱激活
    corpmailactive: '/newbuyer/33/corplife/corpmailactive.do',
    //邮箱检验激活
    checkcorpmailactive: '/newbuyer/33/corplife/checkcorpmailactive.do',
    //	邮箱激活链接 用于email
    linkemailactive: '/newbuyer/33/corplife/linkemailactive.do',

    //首页广告列表接口
    homeADList: '/newbuyer/33/goods/homead.do ',

    //我的优惠券列表
    //myCouponList: '/newbuyer/33/coupon/getmycouponlist.do',
    //领取优惠券
    //recieveCoupon: '/newbuyer/33/coupon/receivecoupon.do',
    //下面是新接口
    //我的优惠券列表
    myCouponList: '/marketing/35/coupon/getmycouponlist.do',
    //领取优惠券
    recieveCoupon: '/marketing/35/coupon/receivecoupon.do',

    //近店领券优惠券列表
    jdCouponList: '/newbuyer/33/goods/nearbycouponcenter.do',
    //平台领券中心列表
    ptCouponList: '',
    // 新人福利站api
    getCouponForWap: '/marketing/35/coupon/getOutGetCouponForWap.do',
    // 平台优惠券领取
    receiveplatformcoupon: '/marketing/35/coupon/receiveplatformcoupon.do',
    // 一键领取优惠券
    receiveUserGiftCoupon: '/marketing/35/coupon/receiveAllGiftCoupon.do',

    //小店混排商品列表
    mixGoodsList: '/newbuyer/33/goods/mixgoodslist.do',

    //推荐店铺聚合页
    adshoplist: '/newbuyer/33/goods/adshoplist.do',

    //意见反馈
    addfeedback: '/newbuyer/30/help/addFeedback.json',
    //客服中心 问题分类
    questionTypeLists: '/newbuyer/30/help/listQuestionType.json',
    //客服中心 问题详情
    queryQuestions: '/newbuyer/30/help/queryQuestions.shtml',
    //检查位置
    checkuserlbs: '/newbuyer/33/goods/checkuserlbs.do',
    //获取我的反馈列表
    listFeedback: '/newbuyer/30/help/listFeedbacks.json',
    //我的反馈详情
    feedbackDetails: '/newbuyer/30/help/FeedbackDetails.json',
    //我的回复，
    myReply: '/newbuyer/30/help/myReply.json',

    //消息数量【购物车的数量以及消息数量】
    msgnum: '/buyer/mymsg/msgnum.do',
    //查询是否是最后一笔退货子订单(订单详情退货退款、退款使用)
    isSplitLast: '/newbuyer/31/refund/getissplitlast.do',
    //检查是否账期支付
    checkPaymentDaysSupport: '/buyer/balance/checkPaymentDaysSupport.do',
    // 下载链接
    downloadUrl: '/newbuyer/30/help/appdownload.json',

    // 用户查询
    findUser: '/buyer/user/find.do',
    // 账户信息查询
    findReceivableAccount: '/buyer/user/findReceivableAccount.do',
    // 星链卡账户转移校验
    transferCheck: '/newbuyer/41/balance/transferCheck.do',
    // 星链卡账户转移
    transfer: '/newbuyer/41/balance/transfer.do',

    //日志收集
    logcollect: '/common/41/logcollect/starapp',
    // 差旅订单
    travelOrderList: '/newbuyer/71/order/getTravelOrderList',
    // 差旅订单详情
    ctripDetail: '/ctripDetail.do',
    //差旅订单开具发票
    querySettlements:'/newbuyer/71/invoice/querySettlements',
    //发票抬头列表
    getInvoiceHeadList:'/newbuyer/71/invoice/getInvoiceHeadList',
    //发票信息
    invoiceDetail:'/newbuyer/71/invoice/getInvoiceInfoByInvoiceSn',
    //历史发票列表
    getHistoryInvoiceList:'/newbuyer/71/invoice/getHistoryInvoiceList',
    //提交发票
    submitInvoiceApply:'/newbuyer/71/invoice/submitInvoiceApply',
    //所含订单
    getTravelOrderByOrderSn:'/newbuyer/71/order/getTravelOrderByOrderSn',
    //电子发票红冲
    applyEInvoiceRed:'/newbuyer/71/invoice/applyEInvoiceRed',
    //重发电子邮件
    sendInvoiceMail:'/newbuyer/71/invoice/sendInvoiceMail',


};

WEB_CONFIG.nativePage = {
    extModule: {
        extWap: {
            id: "10000"
        }
    },
    homeModule: {
        home: {
            id: '20301'
        }
    },
    startModule: {
        startApp: {
            id: '20102'
        },
        welcome: {
            id: '20101'
        }
    },
    userModule: {
        login: {
            id: '20201'
        },
        register: {
            id: '20202'
        }
    },
    thirdparty: {
        telcharge: {
            id: '22001'
        },
        flowcharge: {
            id: '22002'
        },
        qqcharge: {
            id: '22003'
        },
        customerServiceCenter:{
            id:'22101'
        }
    },
    order: {
        orderlist: {
            id: '20803'
        },
        orderdetail: {
            id: '20804'
        },
        aftersalelist: {
            id: '20808'
        },
        aftersaledetail: {
            id: '20812'
        },
        returnmoney: {
            id: '20807'
        },
        returngoods: {
            id: '20806'
        },
        complain: {
            id: '20813'
        },
        invoic: {
            id: '20814'
        }

    },
    goods: {
        shoppingcart: {
            id: '20606'
        },
        shopgoodsdetial: {
            id: '20602'
        },
        platformgoodsdetial: {
            id: '20601'
        },
        grouponplatformgoodsdetial: {
            id: '20603'
        },
        //平台优惠券商品列表
        couponGoodsList: {
            id: '20608'
        },
        //企业生活商品详情页
        qylifegoodsdetial: {
            id: '20609'
        }
    },

    clife: {
        //企业帖子发布页
        postsDetail: {
            id: "21408"
        },
        //企业帖子发布页
        postsPublish: {
            id: "21410"
        },
        //企业帖子发布页
        postsReply: {
            id: "21409"
        },
        //申请开通
        contact: {
            id: "21403"
        },
        //平台商品详情页
        platformProductDetail: {
            id: "20601"
        },
        //确认订单页:
        confirmOrder: {
            id: '20815'
        },
        //实名认证:
        confirmIdentity: {
            id: '21612'
        },

        //购物车结算:
        cartCheck: {
            id: "20815"
        },
        //店铺商品详情页
        shopProductDetail: {
            id: "20602"
        },
        //平台商品团购详情页（暂时指向平台商品）
        platformGroupBuyDetail: {
            id: "20601"
        },
        //店铺商品团购详情页 （暂时指向店铺普通商品）
        shopGroupBuyDetail: {
            id: "20602"
        },
        qyPlatformgoodsdetial: {
            id: '20609'
        }

    },
    personal: {
        feedback: {
            id: '21607'
        },
        ceter: {
            id: '21601'
        }
    },
    shop: {
        //店铺详情页 店铺商品详情页 20602
        shopDetail: {
            id: "20701"
        },
        //购物车
        shoppingCar: {
            id: "20606"
        },
        //供应商店铺首页
        supplierShop: {
            id: '20708'
        },
        //平台优惠券店铺列表
        couponShopList: {
            id: '20709'
        }
    },

    pay: {
        findPassword: {
            id: '21705'
        }
    },

    wapPage: {
        login: {
            id: '20201'
        },
        ceter: {
            id: '21601'
        },
        //首页
        index: {
            id: '20301'
        },
        // 第三方服务支付，app没有这个页面
        thirdpartPay: {
          id: '21801'
        }
    }

}
WEB_CONFIG.appInfo = {};
WEB_CONFIG.messageBox = {
    service: '亲爱的星链用户，感谢您的反馈，客服将尽快回复，谢谢！',
    appurl_android: 'http://rs.380star.com/app/starlife_v3.4.2_20170511_eascs.apk',
    appurl_ios: 'https://itunes.apple.com/cn/app/keynote/id1033832627'

}
//交易详情页扫描支付去使用地址
WEB_CONFIG.dealDetails = {
    toUseUrl: 'https://h5.380star.com/yms/huodong/90742/assets/pages/index.html?env=idc'
}
