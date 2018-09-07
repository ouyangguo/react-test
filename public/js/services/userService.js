/**
 * Created by jahon on 2016/10/27.
 */


define('userService', ['services'], function (Services) {

    var UserService = function () {

        Services.call(this, '');
    }

    UserService.prototype = Object.create(Services.prototype);

    var _super = Services.prototype;
    var user = {

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
         * 我的帖子删除
         * @param params
         * @returns {*}
         */
        deletePosts: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('deletemyforum'),
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
        }

    }

    $.extend(UserService.prototype, user);

    return UserService;
});
