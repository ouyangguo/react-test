/*!
 *
 */

define('inviteService', ['services'], function(Services) {

  var inviteService = function() {

    Services.call(this, '');
  }

  inviteService.prototype = Object.create(Services.prototype);

  var _super = Services.prototype;
  var invite = {
    /**
     * 企业信息
     * @param params
     * @returns {*}
     */
    getDownloadLink: function(params) {
      return _super.getData({
        url: WEB_CONFIG.getApi('downloadUrl'),
        data: params.data || {}
      })
    }

  }

  $.extend(inviteService.prototype, invite);

  return inviteService;
});