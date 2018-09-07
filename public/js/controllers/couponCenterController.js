/**
 * Created by ou on 2017/12/13.
 */
define('couponCenterController', ['jsbridge', 'couponService', 'handlebars', 'collect'], function (jsbridge, CouponService, Handlebars, collect) {
  var couponService = new CouponService();
  var jsb = new jsbridge();
  var cl = new collect();

  function compileTemplate(id) {
    return Handlebars.compile($('#' + id).html());
  }

  Handlebars.registerHelper('parseLink', function (value) {
    return value || 'javascript:void(0);'
  });
  Handlebars.registerHelper('eq', function (a, b, options) {
    if (a == b) return options.fn(this);
    else return options.inverse(this);
  });
  Handlebars.registerHelper('strFormat', function (value, options) {
    value = value || '';
    value = value.replace(/^(\r\n)+/, '').replace(/(\r\n)+$/, '').replace(/^\n+/g, '').replace(/\n+$/, '');
    value = value.split('\r\n').join('</p><p>');
    value = value.split('\n').join('</p><p>');
    value = '<p>' + value + '</p>';
    value = value.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
    return new Handlebars.SafeString(value);
  });

  var cp = function () {
  };

  cp.prototype = {
    init: function () {
      var _this = this;
      this.renderPage().then(function () {
        _this.setWXShare();
      });
      this.eventBinding();

    },

    renderPage: function () {
      var uniqueCode = Util.getQuery('uniqueCode');
      var _this = this;
      var params = {
        data: {
          uniqueCode: uniqueCode,
          token: _this.getToken()
        }
      };
      var $couponWarp = $('.coupon-wrap');
      var $container = $('.container');

      if (!uniqueCode) {
        jsb.toastHandler('页面唯一编码不能为空');
        return;
      }
      if (Util.isApp()) {
        $('.go-home').show();
      }
      return couponService.getCouponForWap(params)
        .then(function (data) {

          if (data.state !== 0) return jsb.toastHandler(data.msg);
          // $('.header-wrap').append(_this.normalRender('header-partial'), data.data.bean);

          $('title').text(data.bean.couponTitle);
          _this.couponTitle = data.bean.couponTitle;
          if (data.bean.bottomBgValue) $('body').css('background-color', '#' + data.bean.bottomBgValue);
          $container.prepend(_this.normalRender('head-banner-partial', data.bean));
          $couponWarp.append(_this.renderUserCoupon(data.receiveStatus, data.userGiftList));
          $couponWarp.append(_this.renderXQ(data.centerCouponList));
          $couponWarp.append(_this.normalRender('middle-banner-partial', data.bean));
          $couponWarp.append(_this.normalRender('rule-partial', data.bean));
          $container.append(_this.normalRender('copyright-partial', data.bean));
        })
        .then(function () {
          if (_this.getToken() && sessionStorage.getItem('auto_receive') === 'true') _this.receiveBtnClick();
          else sessionStorage.setItem('auto_receive', 'false');
        })
        .fail(function (e) {
          console.log(e);
        })
        .always(function () {
          _this.setWXShare();
        });
    },

    eventBinding: function () {
      var _this = this;
      var $container = $('.container');

      $('.go-back').click(function (e) {
        e.preventDefault();

        var returnUrl = Util.getQuery('returnUrl');
        if (returnUrl) window.location.href = returnUrl;
        else history.go(-1);
      });

      $('.go-home').click(function () {
        jsb.shareHandler(_this.setShareData());
      });

      $container.on('click', '.receive-btn', function (e) {
        e.preventDefault();
        _this.receiveBtnClick()
      });
      $container.on('click', '.coup-items', function (e) {
        e.preventDefault();
        var $this = $(this);
        _this.viewCoupon($this.data('couponid'), $this.data('type'));
      });
      $container.on('click', '.li-right', function (e) {
        e.preventDefault();
        var $item = $(this).parent('li');
        var status = $item.data('status');
        if (status == '1') {
          if (!Util.getCookie('token')) return _this.login();
          _this.receivePhantomCoupon($item.data('couponid'))
            .then(function (data) {

              if (data.state == 4523304) {
                return jsb.toastHandler('您已领取过该优惠券');
              }
              if (data.state == 4523316) {
                return jsb.toastHandler('没有可领取的优惠券');
              }
              if (data.state !== 0) return jsb.toastHandler('领取优惠券失败，请稍后重试');

              jsb.toastHandler('领取成功');
              $item.data('status', 2).find('.li-btn').text('立即使用');
            })
            .fail(function () {
              jsb.toastHandler('领取优惠券失败');
            })
        } else {
          _this.viewCoupon($item.data('couponid'), $item.data('type'));
        }
      });
      $container.on('click', '.li-left', function (e) {
        var $item = $(this).parent('li');
        _this.viewCoupon($item.data('couponid'), $item.data('type'));
      })
    },

    receiveBtnClick: function () {
      var $this = $('.receive-btn');
      var _this = this;
      if (_this.getToken()) {
        sessionStorage.setItem('auto_receive', 'false');
        // 已抢光
        if ($this.hasClass('robout')) {
          return;
        }
        // 已领取
        if ($this.hasClass('received')) {
          return jsb.toastHandler('该礼包仅限新用户领取');
        }
        // 领取
        _this.receiveGifts().then(function (data) {
          if (data.state !== 0) return jsb.toastHandler(data.msg);
          $this.addClass('received');
          jsb.toastHandler('领取成功');
        }).fail(function (e) {
          console.log(e);
          jsb.toastHandler(e);
        });

      } else {
        // 设置url参数，登陆后回来自动领取
        sessionStorage.setItem('auto_receive', 'true');
        _this.login(_this.receiveBtnClick.bind(_this));
      }
    },

    receiveGifts: function () {
      var couponIds = [];
      var _this = this;
      $('.coupon-wrap').find('.coup-items').each(function () {
        var $this = $(this);
        if ($this.hasClass('no-coup') || !$this.data('canreceived')) return;
        couponIds.push($this.data('couponid'));
      });

      if (couponIds.length === 0) {
        return $.Deferred().reject('没有可领取的优惠券');
      }
      cl.setlogcollect(webCTM.setCTM({
        module: 'couponCenterModule/c1',
        index: 0,
        params: {activityid: 80001, couponid: couponIds.join(',')}
      }));
      return couponService.receiveUserGiftCoupon({
        data: {
          couponIds: couponIds.join(','),
          token: _this.getToken()
        }
      });
    },

    receivePhantomCoupon: function (cid) {
      cl.setlogcollect(webCTM.setCTM({
        module: 'couponCenterModule/c2',
        index: 0,
        params: {activityid: 80001, couponid: cid}
      }));
      return couponService.receivePlatformCoupon({
        data: {
          couponid: cid,
          token: this.getToken()
        }
      });
    },

    viewCoupon: function (cid, type) {
      var _tp = {
        'key_coupon_id': cid
      };
      console.log(type)
      jsb.routerHandler(['', WEB_CONFIG.nativePage.goods.couponGoodsList.id, WEB_CONFIG.nativePage.shop.couponShopList.id][type], JSON.stringify(_tp));
    },

    normalRender: function (id, data) {
      var template = compileTemplate(id);
      return template(data);
    },

    renderXQ: function (centerCouponList) {
      if (!centerCouponList.length) return '';
      return this.normalRender('xq-partial', centerCouponList);
    },

    renderUserCoupon: function (receiveStatus, userGiftList) {
      var couponsData = {};
      couponsData.receiveStatus = receiveStatus;
      for (var i = 0; i < userGiftList.length; i++) {
        var item = userGiftList[i];
        // 优惠券能否领取,0: 不能， 1: 可以
        // 已经领取过 或者 未抢光 显示常规状态
        userGiftList[i]['couponStatus'] = item.isRobOut === 2 || receiveStatus === '1';
        userGiftList[i]['canReceived'] = item.isRobOut === 2 && receiveStatus === '0';
      }
      couponsData.couponList = userGiftList;
      return this.normalRender('new-user-coupon-partial', couponsData);
    },
    /**
     * 配置微信
     * @returns {{title: string, desc: string, link: string, imgUrl: string}}
     */
    setShareData: function () {

      var link = [location.protocol, '//', location.host, location.pathname, '?st=wap&' + Util.getQueryString(['appname', 'token'])].join('');
      var imageUrl = location.origin + "/life/assets/images/logo.png";
      var title = this.couponTitle || '新人福利站';
      return {
        link: link, // 分享链接
        imgUrl: imageUrl, // 分享图标
        title: title,
        desc: '新用户专属福利，先领券后下单，优惠不止一点点！'
      }
    },
    /**
     * 设置微信分享
     */
    setWXShare: function () {
      var _this = this;
      //判断是否是微信浏览器
      function isWeiXin() {
        var ua = window.navigator.userAgent.toLowerCase();
        return ua.match(/MicroMessenger/i) == 'micromessenger';
      }

      if (isWeiXin()) {

        $("html").addClass("wx");

        // 微信分享
        var shareData = {
          // title: "年货回家 粤享欢乐", // 分享标题
          // desc: "广东EA年货节", // 分享描述
          type: "link", // 分享类型,music、video或link，不填默认为link
          dataUrl: "", // 如果type是music或video，则要提供数据链接，默认为空
          success: function () {
          }, // 用户确认分享后执行的回调函数
          cancel: function () {
          } //用户取消分享后执行的回调函数
        };
        $.WeiXin($.extend(shareData, _this.setShareData())).share();
      }
    },

    // app可以从querystring获取token，wap只认cookie
    getToken: function () {
      if (Util.isApp()) return Util.getQuery('token') || Util.getCookie('token');
      else return Util.getCookie('token');
    },
    login: function (cb) {
      var _this = this;
      jsb.loginHandler('getTokenHandler');
      // 登陆后刷新券
      window.WebViewJavascriptBridge.registerHandler('getTokenHandler', function (data) {
        data = typeof data == 'string' ? JSON.parse(data) : data;

        if (data.params.token) {
          Util.setCookie('token', data.params.token);

          // 刷新券的状态
          var uniqueCode = Util.getQuery('uniqueCode');
          var param = {
            data: {
              uniqueCode: uniqueCode,
              token: data.params.token
            }
          };
          couponService.getCouponForWap(param)
            .then(function (data) {
              var $userCoupon = $(_this.renderUserCoupon(data.data.receiveStatus, data.data.userGiftList));
              var $xqContent = $(_this.renderXQ(data.data.centerCouponList));
              $('.user-gift').innerHTML($userCoupon.innerHTML);
              $('.xq-list').innerHTML($xqContent.innerHTML);
              cb && cb();
            });
        }
      });
    }
  };

  return cp;
});
