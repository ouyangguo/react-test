/*!
 * description: 业务处理
 * date: 2016/08/30
 * author: Jahon
 */

'use strict';

define('couponService', ['services'], function (Services) {

    var CouponService = function () {

        Services.call(this, '');
    }

    CouponService.prototype = Object.create(Services.prototype);

    var _super = Services.prototype;
    var coupon = {

        getList: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('myCouponList'),
                data: params.data || {}
            });
        },
        getCouponDetail: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('getCouponDetail'),
                data: params.data || {}
            });
        },
        getCarNum: function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('msgnum'),
                data: params.data || {}
            })
        },
        getCouponForWap: function (params) {
          return _super.getData({
            url: WEB_CONFIG.getApi('getCouponForWap'),
            data: params.data || {}
          })
        },
        receivePlatformCoupon: function (params) {
          return _super.getData({
            url: WEB_CONFIG.getApi('receiveplatformcoupon'),
            data: params.data || {}
          })
        },
        receiveUserGiftCoupon: function (params) {
          return _super.getData({
            url: WEB_CONFIG.getApi('receiveUserGiftCoupon'),
            data: params.data || {}
          })
        }
    }

    $.extend(CouponService.prototype, coupon);

    return CouponService

});
