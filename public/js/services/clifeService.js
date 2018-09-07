/*!
 *
 */

define('clifeService', ['services'], function (Services) {

    var ClifeService = function () {

        Services.call(this, '');
    }

    ClifeService.prototype = Object.create(Services.prototype);

    var _super = Services.prototype;
    var clift = {
        /**
         * 企业信息
         * @param params
         * @returns {*}
         */
        getLiftInfo: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('corplife'),
                data: params.data || {}
            })
        },
	    /**
         * 首页信息
	     */
	    getCorplifeshoppingindex: function (params) {
		    return _super.getData({
			    url: WEB_CONFIG.getApi('corplifeshoppingindex'),
			    data: params || {}
		    })
        },
	    /**
         * 商城列表信息
	     */
	    getCorplifegoodsdetail: function(params){
		    return _super.getData({
			    url: WEB_CONFIG.getApi('corplifegoodsdetail'),
			    data: params.data || {}
		    })
        },

        /**
         * 企业-置顶通知
         * @param params
         * @returns {*}
         */
        getTopNotice: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('topNotices'),
                data: params.data || {}
            })
        },

        /**
         * 企业-通知，同事帮列表
         * @param params
         * @returns {*}
         */
        getNoticeList: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('noticeList'),
                data: params.data || {}
            })
        },

        /**
         * 企业-福利
         * @param params
         * @returns {*}
         */
        getWelfareInfo: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('welfareInfo'),
                data: params.data || {}
            })
        },

        /**
         * 福利-产品列表
         * @param params
         * @returns {*}
         */
        welfareProductList: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('welfareProductList'),
                data: params.data || {}
            })
        },

        /**
         * 企业-通知详情
         * @param params
         * @returns {*}
         */
        getNoticeDetail: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('noticeDetail'),
                data: params.data || {}
            })
        },
        /**
         * 通知帖子列表
         * @param params
         * @returns {*}
         */
        getPostsList: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('postsList'),
                data: params.data || {}
            })
        },
        /**
         * 申请开通企业
         * @param params
         * @returns {*}
         */
        setContact: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('contact'),
                data: params.data || {}
            })
        },

        /**
         * 填写卡密激活
         * @param params
         * @returns {*}
         */
        setCardsecActive: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('cardsecactive'),
                data: params.data || {}
            })
        },
        /**
         * 填写邮箱激活
         * @param params
         * @returns {*}
         */
        setCorpmailActive: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('corpmailactive'),
                data: params.data || {}
            })
        },
        /**
         * 邮箱激活检验激活
         * @param params
         * @returns {*}
         */
        checkEmailActive: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('checkcorpmailactive'),
                data: params.data || {}
            })
        },

        /**
         * 邮箱激活链接
         * @param params
         * @returns {*}
         */
        emailActive: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('linkemailactive'),
                data: params.data || {}
            })
        },

        /**
         * 团购列表
         * @param params
         * @returns {*}
         */
        getGroupbuyList: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('groupbuyList'),
                data: params.data || {}
            })
        },

        /**
         * 首页广告列表
         * @param params
         * @returns {*}
         */
        getADList: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('homeADList'),
                data: params.data || {}
            })
        },
        /**
         * 我的回复删除
         * @param params
         * @returns {*}
         */
        deleteMyReply: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('deletemyreply'),
                data: params.data || {}
            })
        },

        /**
         * 领取优惠券
         * @param params
         * @returns {*}
         */
        recieveCoupon: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('recieveCoupon'),
                data: params.data || {}
            })
        },

        /**
         * 购物车列表
         * @param params
         * @returns {*}
         */
        getCartList: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('cartList'),
                data: params.data || {}
            })
        },
        /**
         * 购物车商品更新/删除
         * @param params
         * @returns {*}
         */
        updateCart: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('updateCart'),
                data: params.data || {}
            })
        },
        /**
         * 购物车结算
         * @param params
         * @returns {*}
         */
        settle: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('settle'),
                data: params.data || {}
            })
        },

        /**
         * 购物车删除
         * @param params
         * @returns {*}
         */
        batchDeleteCart: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('batchDeleteCart'),
                data: params.data || {}
            })
        },

    }

    $.extend(ClifeService.prototype, clift);

    return ClifeService;
});
