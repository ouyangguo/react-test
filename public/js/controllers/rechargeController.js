/**
 * 手机充值
 *
 */

define('rechargeController', ['rechargeService', 'handlebars', 'livequery', 'jsbridge', 'iscroll', 'dialog'],
	function (RechargeService, Handlebars, livequery, jsbridge, IScroll, dialog) {
		var rs = new RechargeService();
		var jb = new jsbridge();
		
		var tmpObj = {
			type: 0,
			tel: '',
			//request status
			status: 0
		}
		var params = {
			token: Util.getQuery('token')
		}
		
		function handlebarfn(tmplid, cntid, result, appendtype) {
			var tmplHtml = $(tmplid).html();
			Handlebars.registerPartial("partialnotice", $("#tmpl_nodata").html());
			var tmplCompier = Handlebars.compile(tmplHtml);
			var $appendContent = $(cntid);
			if (appendtype) {
				$appendContent.html(tmplCompier(result));
				return
			}
			$appendContent.append(tmplCompier(result));
		}
		
		//检测落后的Android版本
		var isBadAndroid = false,//对Android<4.3版本兼容处理
			ua = window.navigator.userAgent;
			// myua = ua.substr(ua.indexOf('Android') + 8, 3);

		if(/Android/.test(ua)){
			isBadAndroid = true;
		}
		
		var rechargeController = function () {
		};
		var clickstatus = true;
		rechargeController.prototype = {
			/**
			 * 获取充值产品（话费）
			 * @param type 充值类型
			 * @param mobile 手机号或qq
			 */
			getRechargegoods: function (type, mobile) {
				var _this = this;
				var exModel = {
					type: type,
					mobile: mobile || ''
				}
				$.extend(exModel, params);
				
				//doing
				tmpObj.status = 1;
				
				//jb.loadingHandler('show');
				
				rs.getRechargegoods(exModel)
				.then(function (data) {
					
					tmpObj.type = type;
					tmpObj.tel = mobile;
					tmpObj.status = 2;
					if (data.state == 0 && data.data.result.length > 0) {
						data.data.telok = true;
						if (type == 2) {
							$.map(data.data.result, function (ls, index) {
								var tmp = ls.name.match(/\d+/);
								if (tmp) {
									tmp = tmp.join('') + '个';
								}
								ls.name = tmp;
								
								return ls;
							})
						}
						(type == 1  || type==2) ? handlebarfn('#tmpl_rechargegoods', '#cnt_rechargegoods', data.data, 'replace') :
							handlebarfn('#tmpl_rechargegoods_flow', '#cnt_rechargegoods_flow', data.data, 'replace') ;
						
					} else {
						$('#js_theme').addClass('gray-theme');
						
						jb.toastHandler(data.msg)
						// jb.toastHandler('无法获取充值产品')
					}
				})
				.then(function (data) {
					tmpObj.status = 0;
					//tmpObj.tel='';
					
					console.log('done')
					//jb.loadingHandler('hide');
				});
			},
			/**
			 * 获取充值单号
			 * @param listparam
			 */
			getOrdersnToPay: function (listparam) {
				
				jb.loadingHandler('show');
				// console.log(listparam)
				rs.regRecharge(listparam)
				.then(function (data) {
					// console.log(data)
					// console.log('充值单号：' + data.data.orderNo);
					
					jb.loadingHandler('hide');
					//
					switch (parseInt(data.state)) {
						
						case 0:
							
							var tradeno = data.data.orderNo;
							
							setTimeout(function () {
								clickstatus = true;
							}, 800);
							
							if (WEB_CONFIG.global.ST) {
								window.location.href = WEB_CONFIG.global.WEB_PATH
									+ '/pay/createThirdOrder.shtml?orderno=' + tradeno
									+ '&type=' + listparam.type
									+ '&token=' + ( Util.getCookie('token') || '')
                                    + '&entry=' + ( Util.getQuery('entry') || '')
									+ '&openid=' + ((Util.getCookie('openid')|| Util.getQuery('openid'))|| '');
							} else {
								jb.externalPayment(tradeno, 'paymentresult', tradeno, listparam.type);
							}
							break;
						
						case 3820114:
						case 3820115:
						case 3829201:
							clickstatus = true;
							
							WEB_CONFIG.global.ST && setTimeout(function () {
								window.location.href = WEB_CONFIG.global.WEB_PATH + '/login.html?url=' + encodeURIComponent(window.location.href);
							}, 1000)
							
							jb.loginHandler('getTokenHandlerForRcharge');
							
							break;
						default:
							jb.toastHandler(data.msg);
							clickstatus = true;
						
					}
					
				})
				.then(function () {
					console.log('get sn done.')
				})
			},
			
			/**
			 * 验证表单
			 * @param model {name:string, value:string}
			 * @returns {flag:boolean,msg:string}
			 * @private
			 */
			validRule: function (model) {
				
				var rules = {
					tel: {
						required: true,
						reg: /^1(3[0-9]|4[57]|5[0-35-9]|7[01678]|8[0-9])\d{8}$/,
						msg: '请正确输入手机号码'
					},
					qq: {
						required: true,
						reg: /^\d{5,13}$/,
						msg: '请输入充值号码'
					}
				};
				
				var expect = rules[model.name],
					flag = false;
				//value = rules[model.value];
				if (!expect) {
					return {
						flag: true
					}
				}
				if (!expect.required) {
					flag = true
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
			},
			/**
			 *充值说明
			 * @return {[type]} [description]
			 */
			rechartExplain: function () {
				//左上角返回事件
				// window.WebViewJavascriptBridge.registerHandler('historygobackbrower', function (data) {
				// 	jb.historygoHandler("browser")
				// });
				// jb.topbarHandler('left', '', '', 'historygobackbrower');
                //左上角返回事件
                window.WebViewJavascriptBridge.registerHandler('historygoback', function (data) {
                    jb.historygoHandler()
                });

				$('#js_tofeedback').on('click', function (e) {
					e.preventDefault();
					if (WEB_CONFIG.global.ST) {

							//当前版本小于3.7.1
							// jb.toastHandler('此功能仅能在星链生活APP使用')
							//==============todo: 兼容wap后把下面代码注释拿掉，上面一行代码去掉
							var token = Util.getCookie('token') || Util.getQuery('token') || '';
							if(!!token){
				
                                if(Util.getQuery('entry')==2){
                                    location.href = WEB_PATH+'/youdian/dist/bundle/assets/pages/feedback.html?st=wap&sitetype=4';
                                }else{
	                                location.href = '../feedback.html?' + Util.getQueryString() + '&returnurl='+ location.href
	
                                }
							}else{
                                var _params = {};

                                jb.routerHandler(WEB_CONFIG.nativePage.wapPage.login.id, JSON.stringify(_params));
							}

					} else {

						Util.getAppInfo();

						if(WEB_CONFIG.appInfo.token){
							jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, '', location.origin + '/life/assets/pages/feedback.html');
                        }else{
							jb.loginHandler();
						}
					}
				});
				
				$('.go-back').on('click',function () {
					var rechargefrom = localStorage.getItem('rechargefrom') && JSON.parse(localStorage.getItem('rechargefrom')) || {};
					var _returnurl = '';
					
                    switch (rechargefrom.come){
                        case 'qq':
                            _returnurl = 'recharge_qq.html';
                            break;
                        case 'tel':
                            _returnurl = 'recharge_tel.html';
                            break;
						case 'traffictel':
                            _returnurl = 'recharge_traffic.html';
							break;
                        case 'phone':
                            _returnurl = 'recharge_traffic.html';
                            break;
						default:
							break;
					}
					// var _returnurl = rechargefrom.come.includes('qq') ? 'recharge_qq.html' :'recharge.html';
					var url = location.origin + '/life/assets/pages/recharge/' + _returnurl;
					localStorage.setItem('rechargefrom',null);
					window.location.href = url + '?' + Util.getQueryString();
				})
			},
			
			/**
			 * native支付完成调用的函数
			 * @return {[type]} [description]
			 */
			registerJsHandler: function () {
				window.WebViewJavascriptBridge.registerHandler('paymentresult', function (data, responseCallback) {
					// data = $.parseJSON(data)
					// data=JSON.stringify(data);
					// alert(data)
					// return
					if (typeof data == "string") {
						data = JSON.parse(data);
					}
					//兼容
					var _state, _callbackstr;
					if (data.hasOwnProperty('apiName')) {
						_state = data.params.state;
						_callbackstr = data.params.data.callbackstr;
					} else {
						_state = data.state;
						_callbackstr = data.callbackstr;
					}
					if (_state == 3) {
						$('#cnt_rechargegoods li').find('.chosen').removeClass('chosen');
					} else {
						var _orderSn = _callbackstr;
						var url = location.origin + '/life/assets/pages/deal-details.html?orderno=' + _orderSn + '&type=1' + '&' + Util.getQueryString();
						var tmpparams = {
							url: url
						}
						jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);
					}
					var responseData = {'state': 0, 'msg': 'ok'};
					responseCallback(responseData)
				});
				//获取登录后token
				window.WebViewJavascriptBridge.registerHandler('getTokenHandlerForRcharge', function (data) {
					// if (typeof data != "string"){
					//
					//     data=JSON.stringify(data);
					// }
					// jb.toastHandler(data)
					// return
					//alert(JSON.stringify(data))
					if (typeof data == 'string') {
						data = JSON.parse(data)
					}
					if (data.params.token) {
						params.token = data.params.token;
						localStorage.setItem('token', data.params.token);
					} else if (data.token) {
						params.token = data.token;
						localStorage.setItem('token', data.token);
					} else {
						jb.toastHandler('登录失败');
					}
					//jb.toastHandler(params.token)
					
				});
				//左上角返回事件
				window.WebViewJavascriptBridge.registerHandler('historygoback', function (data) {
					jb.historygoHandler('native')
				});
				
			},
			/**
			 * qq充值
			 * @return {[type]} [description]
			 */
			rechartQQ: function () {

				this.registerJsHandler();
				// this.addfix();
				var chargetype = 2;
				var _this = this;
				var localStoragetel = localStorage.getItem('qq');
                var qqnumber = Util.getQuery('qqnumber');

                if(!!qqnumber){

                    $('#qq').val(qqnumber);
                    var _qq;
                    _qq = qqnumber.replace(/\s+/g, '');
                    _this.getRechargegoods(chargetype, _qq);
                    //$('#js_theme').removeClass('gray-theme');
                    $('.recharge form .warn').removeClass('none');
                }else if (localStoragetel) {
					$('#qq').val(localStoragetel);
					var _qq;
					_qq = localStoragetel.replace(/\s+/g, '');
					_this.getRechargegoods(chargetype, _qq);
					//$('#js_theme').removeClass('gray-theme');
					$('.recharge form .warn').removeClass('none');
				} else {
					$('.recharge form .warn').addClass('none');
					_this.getRechargegoods(chargetype, '');
				}
				var $form = $('form');
				//输入监控
				var $qq = $('#qq');
				$qq.on('input', function (e) {
					var formParams = $form.serializeArray();
					
					var r = _this.validRule(formParams[0]);
					if (!r.flag) {
						$('.recharge form .warn').addClass('none');
						$('#js_theme').addClass('gray-theme');
					} else {
						console.log('qq is right');
						//$('#js_theme').removeClass('gray-theme');
						localStorage.setItem('qq', $qq.val());
						$('.recharge form .warn').removeClass('none');
					}
				});
				_this.clickFun();
				//兼容wap 设置查看说明url
				$('#explainBtn').livequery('click',function(e){
					e.preventDefault();
					e.stopImmediatePropagation();
                    var url = location.origin + '/life/assets/pages/recharge/recharge-explain_qq.html';

                    if(WEB_CONFIG.global.ST){
	                    localStorage.setItem('rechargefrom',JSON.stringify({'come':'qq'}));

						window.location.href = url + '?' + Util.getQueryString();

					}else{
						var params = {
							url: url
						}
                        jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params),url);
                    }
				})
				// if (WEB_CONFIG.global.ST) {
				// 	$('#explainBtn').attr('href', 'recharge-explain_qq.html?' + Util.getQueryString())
				// }
				$('.go-back').on('click',function () {
					//返回首页
					jb.routerHandler(WEB_CONFIG.nativePage.wapPage.index.id,JSON.stringify({}));
				})
			},
			/**
			 * 手机充值：话费
			 * @return {[type]} [description]
			 */
			rechartTel: function () {

				this.registerJsHandler();
				jb.topbarHandler('left', '', '', 'historygoback');
				var chargetype = 1;
				var _this = this;
				handlebarfn('#tmpl_rechargegoods', '#cnt_rechargegoods', '', 'replace');
				
				var localStoragetel = localStorage.getItem('tel');

				if (localStoragetel) {
					$('#tel').val(localStoragetel);
					var _tel;
					_tel = localStoragetel.replace(/\s+/g, '');
					_this.getRechargegoods(chargetype, _tel);
					//$('#js_theme').removeClass('gray-theme');
					$('.recharge form .warn').removeClass('none');
				} else {
					$('.recharge form .warn').addClass('none');
				}
				
				var $form = $('form');
				
				//输入监控
				var $tel = $('#tel'),
					//捕捉是否是按删除键
					isDeleteMode = false,
					//对不能捕获keydown事件的手机做兼容处理
					isSupportKeyEvent = false;
				
				
				var ilength = [],
					ipreValue = '',
					ilastValue = '',
					isdeletestate = true;
				
				function getCursortPosition(ctrl) {//获取光标位置函数
					var CaretPos = 0;    // IE Support
					if (document.selection) {
						ctrl.focus();
						var Sel = document.selection.createRange();
						Sel.moveStart('character', -ctrl.value.length);
						CaretPos = Sel.text.length;
					}
					// Firefox support
					else if (ctrl.selectionStart || ctrl.selectionStart == '0')
						CaretPos = ctrl.selectionStart;
					//重新给光标定位
					if ((isDeleteMode || !isSupportKeyEvent) && !isBadAndroid) {
						
						if (isdeletestate) {
							CaretPos = CaretPos == 4 ? 3 : CaretPos;
							CaretPos = CaretPos == 9 ? 8 : CaretPos;
						} else {
							CaretPos = CaretPos == 4 ? 5 : CaretPos;
							CaretPos = CaretPos == 9 ? 10 : CaretPos;
						}
					}
					
					return (CaretPos);
				}
				
				function setCaretPosition(ctrl, pos) {//设置光标位置函数
					if (ctrl.setSelectionRange) {
						ctrl.focus();
						ctrl.setSelectionRange(pos, pos);
					}
					else if (ctrl.createTextRange) {
						var range = ctrl.createTextRange();
						range.collapse(true);
						range.moveEnd('character', pos);
						range.moveStart('character', pos);
						range.select();
					}
				}
				
				$tel.on('input', function (e) {
					
					//alert('input' + myua)
					var tv = $(this).val(),
						tvr = tv.replace(/[^\d]*/g, ""),
						rv = tvr.slice(0, 13).replace(/(^\d{3}|\d{4})/g, "$1 "),
						tvl = tv.length;
					
					if (ilength.length < 3) {
						ilength.unshift(tvl);
						ilastValue = ilength[0];
						ipreValue = ilength[1];
						ilength.length = 2;
					}
					// console.log(ipreValue,ilastValue)
					
					isdeletestate = ipreValue > ilastValue ? true : false;
					
					if (ipreValue == ilastValue && ilastValue < 13) {
						isdeletestate = true;
					}
					// console.log(isdeletestate)
					var pos = getCursortPosition(this);
					
					if (tvl == 13 || (isBadAndroid && tvl == 11)) {
						
						//$('#js_theme').removeClass('gray-theme');
					} else {
						$('#js_theme').addClass('gray-theme');
						$('.chosen').removeClass('chosen');
					}
					
					if ((isDeleteMode || !isSupportKeyEvent) && !isBadAndroid) {
						
						rv = tv.replace(/[^\d]*/g, "").slice(0, 13)
						
						if (tvl > 8) {
							rv = rv.replace(/(^\d{3}|\d{4})/g, "$1 ");
						} else if (tvl > 3) {
							rv = rv.replace(/(^\d{3})/g, "$1 ");
						}
						
					} else {
						rv = tv.slice(0, 11);
					}
					
					$(this).val(rv.substring(0, 13));
					//重新给光标定位
					setCaretPosition(this, pos);
					
					
					isDeleteMode = false;
					isSupportKeyEvent = false;
					
					var formParams = $form.serializeArray();
					
					formParams[0].value = formParams[0].value.replace(/\s+/g, '');
					
					var r = _this.validRule(formParams[0]);
					
					if (!r.flag) {
						$('#js_theme').addClass('gray-theme');
						$('.chosen').removeClass('chosen');
						$('.recharge form .warn').addClass('none');
					} else {
						console.log('tel is right');
						if (tmpObj.status == 2 || tmpObj.status == 0) {
							//$('#js_theme').removeClass('gray-theme');
							//tmpObj.status=0;
							// if (tmpObj.type != chargetype) {
							_this.getRechargegoods(chargetype, formParams[0].value)
							// }
						}
						localStorage.setItem('tel', $tel.val());
						$('.recharge form .warn').removeClass('none');
					}
					
				});
				
				$tel.on('keydown', function (e) {
					//alert('keydown' + e.keyCode)
					
					if (e.keyCode == 8) {
						isDeleteMode = true;
						isSupportKeyEvent = true;
					}
					
				});
				
				//流量话费切换
				$('#js_changeBtn').on('click', function (event) {
					event.preventDefault();
					if (WEB_CONFIG.global.ST) {
						location.href = 'recharge_traffic.html?' + Util.getQueryString();
					} else {
						window.location.href = './recharge_traffic.html?' + Util.getQueryString();
						//jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, '', location.origin + '/life/assets/pages/recharge/recharge_traffic.html');
					}
					//window.location.href = './recharge_traffic.html?' + Util.getQueryString();
				});
				
				_this.clickFun();
				
				//兼容wap 设置查看说明url
                $('#explainBtn').livequery('click',function(e){
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    var url = location.origin + '/life/assets/pages/recharge/recharge-explain.html';

                    if(WEB_CONFIG.global.ST){

                        localStorage.setItem('rechargefrom',JSON.stringify({'come':'tel'}));

                        window.location.href = url + '?' + Util.getQueryString();

                    }else{
                        var params = {
                            url: url
                        }
                        jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params),url);
                    }
                })
				// if (WEB_CONFIG.global.ST) {
				// 	$('#explainBtn').attr('href', 'recharge-explain.html?' + Util.getQueryString())
				// }
			},
			/**
			 * 手机充值：流量
			 * @return {[type]} [description]
			 */
			rechartTraffic: function () {

				this.registerJsHandler();
				jb.topbarHandler('left', '', '', 'historygoback');
				var chargetype = 3;
				var _this = this;
				handlebarfn('#tmpl_rechargegoods_flow', '#cnt_rechargegoods_flow', '', 'replace');
				var localStoragetel = localStorage.getItem('traffictel');
				
				if (localStoragetel) {
					$('#tel').val(localStoragetel);
					var _tel;
					_tel = localStoragetel.replace(/\s+/g, '');
					_this.getRechargegoods(chargetype, _tel);
					//$('#js_theme').removeClass('gray-theme');
					$('.recharge form .warn').removeClass('none');
				} else {
					$('.recharge form .warn').addClass('none');
				}
				var $form = $('form');
				
				//输入监控
				var $tel = $('#tel'),
					//捕捉是否是按删除键
					isDeleteMode = false,
					//对不能捕获keydown事件的手机做兼容处理
					isSupportKeyEvent = false;
				
				var ilength = [],
					ipreValue = '',
					ilastValue = '',
					isdeletestate = true;
				
				function getCursortPosition(ctrl) {//获取光标位置函数
					var CaretPos = 0;    // IE Support
					if (document.selection) {
						ctrl.focus();
						var Sel = document.selection.createRange();
						Sel.moveStart('character', -ctrl.value.length);
						CaretPos = Sel.text.length;
					}
					// Firefox support
					else if (ctrl.selectionStart || ctrl.selectionStart == '0')
						CaretPos = ctrl.selectionStart;
					
					if ((isDeleteMode || !isSupportKeyEvent) && !isBadAndroid) {
						
						if (isdeletestate) {
							CaretPos = CaretPos == 4 ? 3 : CaretPos;
							CaretPos = CaretPos == 9 ? 8 : CaretPos;
						} else {
							CaretPos = CaretPos == 4 ? 5 : CaretPos;
							CaretPos = CaretPos == 9 ? 10 : CaretPos;
						}
					}
					return (CaretPos);
				}
				
				function setCaretPosition(ctrl, pos) {//设置光标位置函数
					
					if (ctrl.setSelectionRange) {
						ctrl.focus();
						ctrl.setSelectionRange(pos, pos);
					}
					else if (ctrl.createTextRange) {
						var range = ctrl.createTextRange();
						range.collapse(true);
						range.moveEnd('character', pos);
						range.moveStart('character', pos);
						range.select();
					}
				}
				
				$tel.on('input', function () {
					
					// console.log('input')
					var tv = $(this).val(),
						tvr = tv.replace(/[^\d]*/g, ""),
						rv = tvr.slice(0, 13).replace(/(^\d{3}|\d{4})/g, "$1 "),
						tvl = tv.length;
					
					
					if (ilength.length < 3) {
						ilength.unshift(tvl);
						ilastValue = ilength[0];
						ipreValue = ilength[1];
						ilength.length = 2;
					}
					isdeletestate = ipreValue > ilastValue ? true : false;
					
					if (ipreValue == ilastValue && ilastValue < 13) {
						isdeletestate = true;
					}
					
					var pos = getCursortPosition(this);
					
					if (tvl == 13 || (isBadAndroid && tvl == 11)) {
						//$('#js_theme').addClass('gray-theme');
					} else {
						$('#js_theme').addClass('gray-theme');
						$('.chosen').removeClass('chosen');
					}
					
					if ((isDeleteMode || !isSupportKeyEvent) && !isBadAndroid) {
						rv = tv.replace(/[^\d]*/g, "").slice(0, 13)
						
						if (tvl > 8) {
							rv = rv.replace(/(^\d{3}|\d{4})/g, "$1 ");
						} else if (tvl > 3) {
							rv = rv.replace(/(^\d{3})/g, "$1 ");
						}
					} else {
						rv = tv.slice(0, 11);
					}
					
					$(this).val(rv.substring(0, 13));
					//重新给光标定位
					setCaretPosition(this, pos);
					
					isDeleteMode = false;
					isSupportKeyEvent = false;
					
					var formParams = $form.serializeArray();
					formParams[0].value = formParams[0].value.replace(/\s+/g, '');
					var r = _this.validRule(formParams[0]);
					if (!r.flag) {
						$('#js_theme').addClass('gray-theme');
						$('.chosen').removeClass('chosen');
						$('.recharge form .warn').addClass('none');
					} else {
						console.log('tel is right');
						if (tmpObj.status === 2 || tmpObj.status === 0) {
							//$('#js_theme').addClass('gray-theme');
							//tmpObj.status=0;
							//if (tmpObj.type != chargetype) {
							_this.getRechargegoods(chargetype, formParams[0].value)
							//}
						}
						localStorage.setItem('traffictel', $tel.val());
						$('.recharge form .warn').removeClass('none');
					}
					
				});
				
				$tel.on('keydown', function (e) {
					// console.log('keydown', e)
					
					// keydown比input事件先触发，因此监听长度为10
					if (isBadAndroid && $(e.target).val().length >= 10) {
						//$('#js_theme').addClass('gray-theme');
					}
					if (e.keyCode == 8) {
						isDeleteMode = true;
						isSupportKeyEvent = true;
					}
					
				});
				_this.clickFun();
				//流量话费切换
				$('#js_changeBtn').on('click', function (event) {
					event.preventDefault();
					if (WEB_CONFIG.global.ST) {
						location.href = 'recharge_tel.html?' + Util.getQueryString();
					} else {
						window.location.href = './recharge_tel.html?' + Util.getQueryString();
						//jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, '', location.origin + '/life/assets/pages/recharge/recharge_tel.html');
					}
					//window.location.href = './recharge_tel.html?' + Util.getQueryString();
				});
				
				//兼容wap 设置查看说明url
                $('#explainBtn').livequery('click',function(e){
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    var url = location.origin + '/life/assets/pages/recharge/recharge-explain.html';

                    if(WEB_CONFIG.global.ST){

                        localStorage.setItem('rechargefrom',JSON.stringify({'come':'traffictel'}));

                        window.location.href = url + '?' + Util.getQueryString();

                    }else{
                        var params = {
                            url: url
                        }
                        jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params),url);
                    }
                })
				// if (WEB_CONFIG.global.ST) {
				// 	$('#explainBtn').attr('href', 'recharge-explain.html?' + Util.getQueryString())
				// }
			},
			
			/**
			 * 3.6需求
			 * 手机充值：话费 & 流量
			 * @return {[type]} [description]
			 */
			rechartInit: function () {

				this.registerJsHandler();
				jb.topbarHandler('left', '', '', 'historygoback');
				//var chargetype = 1;
				var _this = this;
				handlebarfn('#tmpl_rechargegoods', '#cnt_rechargegoods', '', 'replace');
				handlebarfn('#tmpl_rechargegoods_flow', '#cnt_rechargegoods_flow', '', 'replace');
				
				var localStoragetel = localStorage.getItem('tel');
				var phonenumber = Util.getQuery('phonenumber'),
					themeEl = $('#js_theme'),
					themeFlowEl = $('#js_theme_flow');
				if(!!phonenumber){
                    $('#tel').val(phonenumber);
                    
                    var _tel;
                    _tel = phonenumber.replace(/\s+/g, '');
					themeEl.addClass('gray-theme');
					themeFlowEl.addClass('gray-theme');
                    //话费充值
                    _this.getRechargegoods('1', _tel);
                    //流量充值
                    _this.getRechargegoods('3', _tel);
                    //$('#js_theme').removeClass('gray-theme');
                    $('.recharge form .warn').removeClass('none');
				}else if (localStoragetel) {
					$('#tel').val(localStoragetel);
					var _tel;
					_tel = localStoragetel.replace(/\s+/g, '');
					themeEl.addClass('gray-theme');
					themeFlowEl.addClass('gray-theme');
					//话费充值
					_this.getRechargegoods('1', _tel);
					//流量充值
					_this.getRechargegoods('3', _tel);
					//$('#js_theme').removeClass('gray-theme');
					$('.recharge form .warn').removeClass('none');
				} else {
					$('.recharge form .warn').addClass('none');
				}
				
				var $form = $('form');
				
				//输入监控
				var $tel = $('#tel'),
					//捕捉是否是按删除键
					isDeleteMode = false,
					//对不能捕获keydown事件的手机做兼容处理
					isSupportKeyEvent = false;
				
				
				var ilength = [],
					ipreValue = '',
					ilastValue = '',
					isdeletestate = true;
				
				function getCursortPosition(ctrl) {//获取光标位置函数
					var CaretPos = 0;    // IE Support
					if (document.selection) {
						ctrl.focus();
						var Sel = document.selection.createRange();
						Sel.moveStart('character', -ctrl.value.length);
						CaretPos = Sel.text.length;
					}
					// Firefox support
					else if (ctrl.selectionStart || ctrl.selectionStart == '0')
						CaretPos = ctrl.selectionStart;
					//重新给光标定位
					if ((isDeleteMode || !isSupportKeyEvent) && !isBadAndroid) {
						
						if (isdeletestate) {
							CaretPos = CaretPos == 4 ? 3 : CaretPos;
							CaretPos = CaretPos == 9 ? 8 : CaretPos;
						} else {
							CaretPos = CaretPos == 4 ? 5 : CaretPos;
							CaretPos = CaretPos == 9 ? 10 : CaretPos;
						}
					}
					
					return (CaretPos);
				}
				
				function setCaretPosition(ctrl, pos) {//设置光标位置函数
					if (ctrl.setSelectionRange) {
						ctrl.focus();
						ctrl.setSelectionRange(pos, pos);
					}
					else if (ctrl.createTextRange) {
						var range = ctrl.createTextRange();
						range.collapse(true);
						range.moveEnd('character', pos);
						range.moveStart('character', pos);
						range.select();
					}
				}
				
				$tel.on('input', function (e) {
					
					//alert('input' + myua)
					var tv = $(this).val(),
						tvr = tv.replace(/[^\d]*/g, ""),
						rv = tvr.slice(0, 13).replace(/(^\d{3}|\d{4})/g, "$1 "),
						tvl = tv.length;
					
					if (ilength.length < 3) {
						ilength.unshift(tvl);
						ilastValue = ilength[0];
						ipreValue = ilength[1];
						ilength.length = 2;
					}
					// console.log(ipreValue,ilastValue)
					
					isdeletestate = ipreValue > ilastValue ? true : false;
					
					if (ipreValue == ilastValue && ilastValue < 13) {
						isdeletestate = true;
					}
					// console.log(isdeletestate)
					var pos = getCursortPosition(this);
					
					if (tvl == 13 || (isBadAndroid && tvl == 11)) {
						
						//$('#js_theme').removeClass('gray-theme');
					} else {
						$('.chosen').removeClass('chosen');
					}
					
					if ((isDeleteMode || !isSupportKeyEvent) && !isBadAndroid) {
						
						rv = tv.replace(/[^\d]*/g, "").slice(0, 13)
						
						if (tvl > 8) {
							rv = rv.replace(/(^\d{3}|\d{4})/g, "$1 ");
						} else if (tvl > 3) {
							rv = rv.replace(/(^\d{3})/g, "$1 ");
						}
						
					} else {
						rv = tv.slice(0, 11);
					}
					
					$(this).val(rv.substring(0, 13));
					//重新给光标定位
					setCaretPosition(this, pos);
					
					
					isDeleteMode = false;
					isSupportKeyEvent = false;
					
					var formParams = $form.serializeArray();
					
					formParams[0].value = formParams[0].value.replace(/\s+/g, '');
					
					var r = _this.validRule(formParams[0]);
					
					if (!r.flag) {
						themeEl.removeClass('gray-theme');
						themeFlowEl.removeClass('gray-theme');
						$('.chosen').removeClass('chosen');
						$('.recharge form .warn').addClass('none');
					} else {
						console.log('tel is right');
						themeEl.addClass('gray-theme');
						themeFlowEl.addClass('gray-theme');
						if (tmpObj.status == 2 || tmpObj.status == 0) {
							//话费充值
							_this.getRechargegoods('1', formParams[0].value);
							//流量充值
							_this.getRechargegoods('3', formParams[0].value);
						}
						localStorage.setItem('tel', $tel.val());
						$('.recharge form .warn').removeClass('none');
					}
					
				});
				
				$tel.on('keydown', function (e) {
					//alert('keydown' + e.keyCode)
					
					if (e.keyCode == 8) {
						isDeleteMode = true;
						isSupportKeyEvent = true;
					}
					
				});
				
				_this.clickFun();
				
				//兼容wap 设置查看说明url
                $('#explainBtn').livequery('click',function(e){
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    var url = location.origin + '/life/assets/pages/recharge/recharge-explain.html';

                    if(WEB_CONFIG.global.ST){
	                    localStorage.setItem('rechargefrom',JSON.stringify({'come':'phone'}));
                        window.location.href = url + '?' + Util.getQueryString();

                    }else{
                        var params = {
                            url: url
                        }
                        jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params),url);
                    }
                })
				// if (WEB_CONFIG.global.ST) {
				// 	$('#explainBtn').attr('href', 'recharge-explain.html?' + Util.getQueryString())
				// }
				
				
				if(!Util.isApp()){
                	$('.go-back').on('click',function () {
                		//var url = location.origin + '/life/assets/pages/index.html?token='+Util.getQuery('token')+'&env'+Util.getQuery('env');
		                //返回首页
		                jb.routerHandler(WEB_CONFIG.nativePage.wapPage.index.id,JSON.stringify({}));
	                })
				}
			},

			/**
			 * 点击充值
			 */
			clickFun : function () {
				var _this = this;
				$('.js-click').livequery(function () {
					
					$(this).delegate('li', 'click', function (e) {
						var type = $(this).hasClass('js-tel') ? '1' : $(this).hasClass('js-flow') ? '3' : '2',
							$val = type == 2 ? $('#qq').val() : $('#tel').val(),
							formParams = $('form').serializeArray();
						formParams[0].value = formParams[0].value.replace(/\s+/g, '');
						var r = _this.validRule(formParams[0]);
						
						//if(!r.flag || !$(this).data('id')){jb.toastHandler(r.msg); return };
						if(!r.flag){
                            jb.toastHandler(r.msg); return
                        }
                        if(!$(this).data('id')){
                            jb.toastHandler('暂时无法充值,请稍后'); return
						}

						e.preventDefault();
						e.stopImmediatePropagation();
						
						var $this = $(this);
						//jb.loadingHandler('hide');
						
						var telstr = '';
						
						if ($('#tel').val()) {
							telstr = $('#tel').val().toString().replace(/\s+/g, '');
						}
						$(this).addClass('chosen').siblings().removeClass('chosen');
						$($(this).parents('div').siblings()).find('li').removeClass('chosen');
						var tmpModel = {
							mobile: telstr || '',
							proid: $(this).data('id'),
							type: type
						};
						
						$.extend(tmpModel, params);
						if (tmpModel.type == 2) {
							tmpModel.mobile = $('#qq').val();
						}
						// exModel.token = params.token;
						// if (WEB_CONFIG.global.ST) {
						// 	exModel.token = Util.getQuery('token')
						// }
						_this.getOrdersnToPay(tmpModel);
						
					})
				})
			}
		};
		return rechargeController;
	}
);
