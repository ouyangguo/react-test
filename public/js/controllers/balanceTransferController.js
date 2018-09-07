/**
 * Created by ou on 2018/1/18.
 */
define('balanceTransferController', ['walletService', 'handlebars', 'jsbridge', 'md5', 'dialog'],
  function (WalletService, Handlebars, jsbridge, md5, dialog) {
    var ws = new WalletService();
    var jb = new jsbridge();
    var token = Util.getToken();

    if (!token) {
      jb.toastHandler('请先登录');
      return
    }

    var walletController = function () {
    };
    walletController.prototype = {
      // 获取转账账户信息
      getAccount: function (phone) {
        $('.user-tel').text(phone);
        return ws.findReceivableAccount({token: token, phone: phone})
          .always(function (data) {
            if (data.state == 0) {
              $('.user-pic img').prop('src', data.data.userLogo);
              if (data.data.niceName) $('.user-name').text(data.data.niceName);
              else $('.user-name').html('&nbsp;');
              $('.curr-balance span').text(data.data.balance)
            }
            else {
              jb.toastHandler(data.msg);
            }
          })
          .fail(function () {
            jb.toastHandler('获取账户余额失败,请稍后重试');
          });
      },

      validateTransfer: function (phone, balance) {
        return ws.transferCheck({
          token: token,
          to_phone: phone,
          transferBalance: balance
        });
      },

      transfer: function (phone, balance, paypwd) {
        return ws.transfer({
          token: token,
          to_phone: phone,
          transferBalance: balance,
          paypwd: paypwd
        });
      },

      eventBinding: function (phone) {
        var $money = $('.amount-ipt input');
        var $transferBtn = $('.comm-btn');
        var $keyboard = $('.pwd-ipt');
        var _this = this;

        // 限制2位小数
        $money.on('input', function () {
          var value = $money.val();
          if (value && !/^\d+(\.)?(\d{1,2})?$/.test(value)) {
            var m = value.match(/^\d+(\.\d{1,2})?/);
            $money.val(m && m.length > 0 ? m[0] : '');
          }
          if ($money.val()) {
            $transferBtn.removeClass('set-gray').addClass('curr-btn');
          } else {
            $transferBtn.addClass('set-gray').removeClass('curr-btn');
          }
        });

        // 确认转账
        $transferBtn.click(function (e) {
          if ($transferBtn.hasClass('set-gray')) return;
          // 验证转账信息
          _this.validateTransfer(phone, $money.val())
            .then(function (data) {
              if (data.state == 0) {
                $keyboard.removeClass('none');
              } else {
                jb.toastHandler(data.msg);
              }
            })
            .fail(function () {
              jb.toastHandler('交易校验失败，请稍后重试');
            })
        });
        // 点击弹层
        $('.bg-layer').click(function () {
          $keyboard.addClass('none');
          _this.pwd = '';
          renderPassword(_this.pwd);
        });
        // 密码
        _this.pwd = '';
        // 键盘点击
        $('.keyboard-numbers a').on('touchstart', function () {
          var $this = $(this);
          // 取消按钮
          if ($this.hasClass('cancel-key')) {
            _this.pwd = '';
            $keyboard.addClass('none');
          } else if ($this.hasClass('delete-key')) {
            // 删除按钮
            _this.pwd = _this.pwd.slice(0, _this.pwd.length - 1);
          } else {
            _this.pwd += $this.text();
            _this.pwd = _this.pwd.slice(0, 6);
          }

          renderPassword(_this.pwd);
        });
        // 确认支付
        $('.pay-btn').click(function () {
          // jb.paymentHandler()
          if (_this.pwd.length !== 6) {
            return jb.toastHandler('请输入6位支付密码');
          }
          _this.transfer(phone, $money.val(), $.md5($.md5(_this.pwd)))
            .then(function (data) {
              if (data.state == 0) {
                var url = location.origin + '/life/assets/pages/wallet/acc-Balance.html';
                jb.toastHandler('星链卡余额转账成功');
                setTimeout(function () {
                  $keyboard.addClass('none');
                  _this.pwd = '';
                  renderPassword(_this.pwd);
                  jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify({url: url}), url);
                }, 2000);
              } else {
                jb.toastHandler(data.msg);
              }
            })
            .fail(function () {
              jb.toastHandler('服务器繁忙，请稍后重试');
            })
        });
        // 忘记密码
        $('.forget-pwd').click(function () {
          if (/4\.1/.test(Util.getQuery('appname'))) {
            jb.toastHandler('请升级到最新版本app后重试');
          } else {
            jb.routerHandler(WEB_CONFIG.nativePage.pay.findPassword.id, JSON.stringify({channel: '1'}))
          }
        });
        function renderPassword(pwd) {
          var length = pwd.length;
          $('.keyboard-password li i').each(function (index, item) {
            if (index < length) {
              $(item).show();
            } else {
              $(item).hide();
            }
          })
        }
        $('body').on('touchmove', function (e) {
          e.preventDefault();
        })
      },

      initPageOne: function () {
        // 号码输入
        var $btn = $('.comm-btn');
        var $phone = $('.payee-tel');
        var $xbtn = $('.clear-x');
        var _pre_phone = '';
        var isPaste = false;
        $phone.on('input', function (e) {
          var $this = $(this);
          var value = $this.val();

          if (!/^\d+$/.test(value)) {
            value = value.slice(0, value.length - 1);
            $this.val(isPaste ? _pre_phone : value);
          } else if (value.length >= 11) {
            $this.val(value.slice(0, 11));
            $btn.removeClass('set-gray').addClass('curr-btn');
          } else {
            $btn.addClass('set-gray').removeClass('curr-btn');
          }
          if (value.length > 0) $xbtn.removeClass('none');
          else $xbtn.addClass('none');
          _pre_phone = '';
          isPaste = false;
        });
        $phone.on('paste', function (e) {
          _pre_phone = $(this).val();
          isPaste = true;
        });

        $xbtn.click(function () {
          $phone.val('');
          $xbtn.addClass('none');
          $btn.addClass('set-gray').removeClass('curr-btn');
        });

        $('form').on('submit', function (e) {
          e.preventDefault();
          return false;
        });

        // 下一步
        $btn.click(function (e) {
          if ($btn.hasClass('set-gray')) return;
          var phone = $phone.val();
          var url = location.origin + '/life/assets/pages/wallet/balance-transfer-2.html?phone=' + phone;

          ws.findUser({phone: phone})
            .then(function (data) {
              // 用户已经注册,跳转转账页面
              if (data.state == 0 && data.data.isRegist == 1) {
                jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify({url: url}), url);
              } else {
                jb.toastHandler('收款人账号不存在，请重新填写');
              }
            })
            .fail(function () {
              jb.toastHandler('获取收款人信息失败，请稍后重试');
            })
        });
      },

      init: function () {
        var phone = Util.getQuery('phone');
        if (!phone) {
          jb.toastHandler('电话号码不能为空');
          return;
        }

        this.getAccount(phone);
        this.eventBinding(phone);

      }
    };
    return walletController;
  });
