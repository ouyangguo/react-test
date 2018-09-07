/**
 * requirejs 配置
 */

require.config({
    // baseUrl:'http://192.168.1.105:8089/life/assets/js/',
    baseUrl: [(typeof STATIC_PATH !== "undefined" ? STATIC_PATH : "../"), "js"].join(""),
    paths: {
        zepto: 'vendor/zepto',
        livequery: 'vendor/zepto.livequery',
        handlebars: "vendor/handlebars",
        vue: 'vendor/vue',
        fastclick: 'vendor/fastclick',
        webviewBridgeLib: 'vendor/WebViewJavascriptBridge',
        iscroll: 'vendor/iscroll',
        util: 'common/util',
        webCTM: 'common/webCTM',
        web4wap:'common/web4wap',
        config: 'webconfig',
        countdown: 'vendor/countdown',
        unveil: 'vendor/zepto.unveil',
        md5: 'vendor/zepto.md5',
        dialog: 'vendor/zepto.dialog',
        carousel: 'vendor/carousel',
        mobileselect:'vendor/mobileAreaSelect',
        imgzip:'vendor/imgzip',
        wx: 'vendor/wx',
        jsbridge: 'common/jsbridge',
        listscroller: 'common/listscroller',

        services: 'services/services',
        // productController: 'controllers/productController',
        // productService: 'services/productService',

        couponController: 'controllers/couponController',
        couponService: 'services/couponService',

        orderController: 'controllers/orderController',
        orderPayEndController: 'controllers/orderPayEndController',
        orderService: 'services/orderService',

        mymsgService: 'services/mymsgService',
        mymsgController: 'controllers/mymsgController',

        postorderController: 'controllers/postorderController',
        postorderService: 'services/postorderService',

        walletService: 'services/walletService',
        walletController: 'controllers/walletController',

        rechargeService: 'services/rechargeService',
        rechargeController: 'controllers/rechargeController',

        helperService: 'services/helperService',
        helperController: 'controllers/helperController',
        feedbackController: 'controllers/feedbackController',
        shopController: 'controllers/shopController',
        helperFeedbackController: 'controllers/helperFeedbackController',
        helperFeedbackReplyController: 'controllers/helperFeedbackReplyController',

        clifeService: 'services/clifeService',
        clifeController: 'controllers/clifeController',
        qyShopController: 'controllers/qyShopController',
        cartController: 'controllers/cartController',
        qyOrderController: 'controllers/qyOrderController',
        qyOrderService: 'services/qyOrderService',

        userService: 'services/userService',
        userController: 'controllers/userController',

        storeService: 'services/storeService',
        storeController: 'controllers/storeController',

        productService: 'services/productService',
        productController: 'controllers/productController',

        inviteController: 'controllers/inviteController',
        illustrationController: 'controllers/illustrationController',
        inviteService: 'services/inviteService',

        mockdata: 'data/mockdata',

        collectService: 'services/collectService',
        collect: 'common/webCollect',
        collectController: 'controllers/collectController',

	      cLifeFooter: 'common/cLifeFooter',
        // 领券wap页
        couponCenterController: 'controllers/couponCenterController',

        //转账页面
        balanceTransferController: 'controllers/balanceTransferController',

        // 发票页面
        billController: 'controllers/billController',
        tripOrderService: 'services/tripOrderService',

        otherController: 'controllers/otherController',
    },
    shim: {
        zepto: {
            exports: 'zepto'
        },
        util: {
            deps: ['zepto'],
            exports: 'util'
        },
        webCTM: {
            exports: 'webCTM'
        },
        web4wap:{
            exports:'web4wap'
        },
        livequery: {
            deps: ['zepto'],
            exports: 'livequery'
        },
        fastclick: {
            deps: ['zepto'],
            exports: 'fastclick'
        },
        carousel: {
            deps: ['zepto'],
            exports: 'carousel'
        },
        unveil: {
            deps: ['zepto'],
            exports: 'unveil'
        },
        mobileselect:{
            deps: ['zepto'],
            exports: 'mobileAreaSelect'
        },
        imgzip:{
            deps: ['zepto'],
            exports: 'MegaPixImage'
        },
        jsbridge: {
            deps: ['webviewBridgeLib'],
            exports: 'jsbridge'
        },
        md5: {
            deps: ['zepto'],
            exports: 'md5'
        },
        wx: {
            deps: ['zepto'],
            exports: 'wx'
        },
        dialog: {
            deps: ['zepto'],
            exports: 'dialog'
        },
        listscroller: {
            deps: ['zepto', 'iscroll'],
            exports: 'listScroller'
        },
        handlebars: {
            exports: "Handlebars"
        },
        services: {
            deps: ['util', 'config', 'jsbridge'],
            exports: 'services'
        },
        mockdata: {
            deps: ['config'],
            exports: 'mockdata'
        },

        productService: {
            deps: ['services'],
            exports: 'productService'
        },
        productController: {
            deps: ['productService'],
            exports: 'productController'
        },
        postorderController: {
            deps: ['postorderService', 'jsbridge'],
            exports: 'postorderController'
        },
        walletService: {
            deps: ['services'],
            exports: 'walletService'
        },
        walletController: {
            deps: ['walletService', 'jsbridge'],
            exports: 'walletController'
        },
        mymsgController: {
            deps: ['mymsgService', 'jsbridge'],
            exports: 'mymsgController'
        },
        orderService: {
            deps: ['services'],
            exports: 'orderService'
        },
        orderController: {
            deps: ['orderService', 'jsbridge', 'countdown'],
            exports: 'orderController'
        },
        orderPayEndController: {
            deps: ['orderService', 'jsbridge'],
            exports: 'orderPayEndController'
        },
        shopController: {
            deps: ['jsbridge'],
            exports: 'shopController'
        },
        rechargeController: {

            deps: ['rechargeService', 'jsbridge'],
            exports: 'rechargeController'
        },
        helperController: {
            deps: ['jsbridge', 'vue'],
            exports: 'helperController'
        },
        guideController: {
            deps: ['jsbridge'],
            exports: 'guideController'
        },
        couponService: {
            deps: ['services'],
            exports: 'couponService'
        },
        couponController: {
            deps: ['couponService'],
            exports: 'couponController'
        },
        couponCenterController: {
          deps: ['wx'],
          exports: 'couponCenterController'
        },
        clifeService: {
            deps: ['services'],
            exports: 'clifeService'
        },
        collectService:{
            deps: ['services'],
            exports: 'collectService'
        },
        clifeController: {
            deps: ['clifeService', 'jsbridge'],
            exports: 'clifeController'
        },
        qyShopController: {
            deps: ['clifeService', 'jsbridge'],
            exports: 'qyShopController'
        },
        cartController: {
            deps: ['clifeService', 'jsbridge'],
            exports: 'cartController'
        },
        userService: {
            deps: ['services'],
            exports: 'userService'
        },
        userController: {
            deps: ['userService'],
            exports: 'userController'
        },
        storeService: {
            deps: ['services'],
            exports: 'storeService'
        },
        storeController: {
            deps: ['storeService'],
            exports: 'storeController'
        },
        inviteController: {
            deps: ['vue', 'wx', 'inviteService'],
            exports: 'inviteController'
        },
        feedbackController: {
            deps: ['helperService', 'jsbridge'],
            exports: 'feedbackController'
        },
        helperFeedbackController: {
            deps: ['helperService', 'jsbridge'],
            exports: 'helperFeedbackController'
        },
        helperFeedbackReplyController: {
            deps: ['helperService', 'jsbridge'],
            exports: 'helperFeedbackReplyController'
        },
        illustrationController: {
            deps: ['jsbridge'],
            exports: 'illustrationController'
        },
        collect: {
            deps: ['collectService'],
            exports: 'collect'
        },
        qyOrderController: {
            deps: ['qyOrderService', 'jsbridge', 'countdown'],
            exports: 'qyOrderController'
        },
        cLifeFooter:{
          deps:['zepto'],
          exports: 'cLifeFooter'
        },
        billController: {
          deps: [],
          export: 'billController'
        },
        tripOrderService: {
          deps: ['services'],
          exports: 'tripOrderService'
        }
    }
    // ,
    // urlArgs: "v=" + (new Date()).getTime()
    // urlArgs: "v=201611231130"
});

require(['zepto', 'util', 'config', 'jsbridge', 'webCTM','web4wap'], function ($, util, config) {

    //debug
    // WEB_CONFIG.global.DEBUG && require(['babel']);

    Util.getAppInfo();
    // Util.showheader();

    // console.log(FastClick)
    // FastClick.attach(document.body);




});
