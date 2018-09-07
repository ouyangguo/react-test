/**
 * 我的回复（回复客服的信息）
 * author chenling
 * creat at 2017/05/04
 */
define('helperFeedbackReplyController', ['helperService', 'jsbridge'], function (HelperService, jsbridge) {
    var hs = new HelperService();
    var jb = new jsbridge();
    var flag = true;
    var isIOS = /iphone|ipad|ipod/gi.test(navigator.userAgent);

    var HelperFeedbackReplyController = function () {};

    HelperFeedbackReplyController.prototype = {
        init: function () {

            var _this = this,
	            $qs   = $('#qs');
            if(isIOS){
                setTimeout(function() {
                    $qs.focus();
                }, 600);
            }else{
                $qs.focus();
            }
            $qs.on('input', function () {
                var qsl = $qs.val().length;
                $('.text-num').html(((200 - qsl) < 0 ? 0 : (200 - qsl)) + '字');
            });
	
	        if(!!Util.isApp()){
		        jb.topbarHandler('right', '', '提交', 'jsFeedbackReply');
		        window.WebViewJavascriptBridge.registerHandler('jsFeedbackReply', function (data, responseCallback) {
		            _this.reqestFun();
		        })
	        }else {
		        $('#js-sub').on('click',function (event) {
			        _this.reqestFun();
		        })
            }
        },
	    reqestFun : function () {
            var _this = this,
	            $qs   = $('#qs');
		    if (_this.isCheck() && flag) {
			    jb.loadingHandler();
			    var params = {
				    ticketid: Util.getQuery('ticketid'),
				    token: Util.getToken(),
				    content: $qs.val(),
			    };
			    hs.feedbackReply(params).then(function (data) {
				    if (data.state == '0') {
					    flag = false;
					    jb.loadingHandler('hide');
					    jb.toastHandler('回复成功');
					    setTimeout(function () {
						    //通知上一页回退之后刷新
                            if(!!Util.isApp()){
	                            jb.postNotification('refreshListenFeedbackDetail');
                                jb.historygoHandler('native');
                            }else{
	                            window.history.back();
                            }
					    }, 2000);
				    } else {
					    jb.toastHandler(data.msg || '');
				    }
			    })
		    }
	    },
        isCheck: function () {
            var $form      = $('form'),
                formParams = $form.serializeArray(),
                patt       = /[\ud800-\udbff][\udc00-\udfff]/,
                flag       = true;
            //formParams[0].value = formParams.value.replace(/\s+/g, '');
            var r = this.validRule(formParams[0]);
            if (!r.flag) {
                flag = false;
                $form.find('input[name="]' + r.name + '"]').focus();
                jb.toastHandler(r.msg)
            }
            if (patt.test(formParams[0].value)) {
                flag = false;
                jb.toastHandler('不能输入表情符号')
            }
            return flag;
        },
        validRule: function (model) {
            var rules = {
                content: {
                    required: true,
                    reg: /[^*]{1}/,
                    msg: '请输入回复内容'
                }
            }

            var expect = rules[model.name],
                flag   = false;
            if (!expect) {
                return {
                    flag: true
                }
            }
            if (!expect.required) {
                flag = true;
            }
            if (expect.reg && expect.reg.test(model.value)) {
                return {
                    flag: true
                }
            } else {
                return {
                    name: model.name,
                    flag: false,
                    msg: expect.msg
                }
            }

        }

    }

    return HelperFeedbackReplyController;
});