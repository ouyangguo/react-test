/**
 * 意见反馈
 */

define('feedbackController', ['helperService', 'iscroll', 'jsbridge', 'handlebars', 'livequery', 'dialog'],
	function (HelperService, IScroll, jsbridge, Handlebars) {
		var hs = new HelperService();
		var jb = new jsbridge();
		var isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
		var sitetype = Util.getQuery("sitetype") || 0; //0：生活app 1：云店app 2:友店app 3:云商 4：友店wap
		
		function handlebarfn(tmplid, cntid, result, appendtype) {
			var tmplHtml = $(tmplid).html();
			var tmplCompier = Handlebars.compile(tmplHtml);
			var $appendContent = $(cntid);
			if (appendtype) {
				$appendContent.html(tmplCompier(result));
				return
			}
			$appendContent.append(tmplCompier(result));
		}
		
		var FeedbackController = function () {
		};
		FeedbackController.prototype = {
			
			/**
			 * 我的反馈详情
			 * @param  {[type]} type [description]
			 * @return {[type]}      [description]
			 */
			getOrderList: function (type) {
				Util.setScrollerBounce($('.wrapper'));
				var _this = this,
					cp    = window.ListPages['status1'];
				params = {
					pagesize: cp.pageSize || 10,
					pagenum: cp.pageNum || 1,
					token: Util.getToken()
				};
				
				if (cp.islast) {
					//设置状态
					cp.loadingStep = 0;
					//移除loading
					cp.pullUpEl.removeClass('loading');
				}
				//获取反馈列表
				return !cp.islast && hs.getFeedbackList(params)
					.then(function (data) {
						jb.loadingHandler('hide');
						if (data.state == 0) {
							
							if (data.data.feedbackDoList.length > 0) {
								$('#js-show').css('display', 'block');
								
								//获取当前时间
								var nowDate = parseInt( Util.formatDate2(new Date(),'yyMMdd'));
								//处理数据格式
								
								$.map(data.data.feedbackDoList, function (ls, index) {
									ls.readstatusFlag = ls.readstatus !== '1';
									
									var compareTime=parseInt(Util.formatDate2(ls.createTime,'yyMMdd'));
									var fd=(nowDate === compareTime) ? 'hh:mm' : 'MM-dd';
									
									ls.createTimeFormat= Util.formatDate2(ls.createTime,fd);
									
									return ls;
								})
								
								//刷新用html，加载用append
								if (cp.refreshStatus == 0) {
									handlebarfn('#tmpl_showMyFeedback', '#showMyFeedback', data.data, 'replace');
								} else {
									handlebarfn('#tmpl_showMyFeedback', '#showMyFeedback', data.data);
								}
							}
							//更新ListPage
							if (data.data.lastPage === "0") {
								//不是最后一页
								cp.pageNum++;
							} else {
								//没有更多数据
								cp.pullUpL.html('没有更多数据了');
								cp.islast = true;
							}
							
							//移除loading
							cp.pullUpEl.removeClass('loading');
							
						} else {
							//请求数据不成功
							if (typeof data == "string") {
								data = JSON.parse(data);
							}


							if(data.state==10000017||data.state==10000016){
                                if(WEB_CONFIG.global.ST){

                                    //wap
                                    setTimeout(function () {
                                        window.location.href = WEB_CONFIG.global.WEB_PATH + '/login.html?url=' + encodeURIComponent(window.location.href);
                                    }, 800)

								}else{
                                    //app
                                    jb.historygoHandler('native');
                                    setTimeout(function () {
                                        jb.loginHandler();
                                    },350)
								}
							}
							if(data.state==10000016){
                                data.msg='请登录'
							}
							console.log(data.msg);
							jb.toastHandler(data.msg);
						}
						
					})
					.then(function () {
						_this.iscrollRefresh(type);
					})
					.fail(function () {
						jb.toastHandler('网络开小差，稍后再试');
					})
					.done(function () {
						cp.loadingStep = 0;
					})
				
			},
			
			/**
			 * iscroll refresh
			 */
			iscrollRefresh: function (type) {
				setTimeout(function () {
					window.ListPages[type].pullUpEl.hide();
					window.ListScrollers && window.ListScrollers[type].refresh();
				}, 500)
			},
			/**
			 * 下拉刷新
			 */
			refreshList: function (type) {
				var _this = this;
				var cp = window.ListPages[type];
				cp.islast = false;
				cp.refreshStatus = 0;
				//cp.scrollMaxY = 0;
				cp.pageNum = 1;
				cp.pageSize = 10;
				cp.pullDownEl.removeClass('loading');
				cp.pullDownL.html('下拉显示更多...');
				cp.pullDownEl.hide();
				cp.pullUpEl.hide();
				
				_this.getOrderList(type);
			},
			/**
			 * 定义iscroll
			 */
			listScroll: function () {
				window.ListScrollers = {};
				window.ListPages = {};
				var _this     = this,
					$wrappers = $('.wrapper');
				
				var pulldownHtml = '<div class="pullDown"><span class="pullDownIcon"></span><span class="pullDownLabel"></span></div>';
				var pullupHtml = '<div class="pullUp"> <span class="pullUpIcon"></span> <span class="pullUpLabel"></span></div>';
				
				$wrappers.each(function () {
					var cid   = $(this).attr('id'),
						type  = $(this).data('tab'),
						temp  = {},
						temp2 = {};
					
					var _thisScroll = new IScroll('#' + cid, {
						click: true,
						tap: false,
						mouseWheel: true,
						eventPassthrough: false,
						preventDefault: false,
						//snap: true,
						probeType: isIOS ? 3 : 2
					});
					var $thiswrapper = $(_thisScroll.wrapper);
					var wrapItemEl = $thiswrapper.find('.order-wrap');
					$(pulldownHtml).insertBefore(wrapItemEl);
					$(pullupHtml).insertAfter(wrapItemEl);
					
					temp2 = {
						pullDownEl: $thiswrapper.find('.pullDown'),
						pullDownL: $thiswrapper.find('.pullDownLabel'),
						pullUpEl: $thiswrapper.find('.pullUp'),
						pullUpL: $thiswrapper.find('.pullUpLabel'),
						loadingStep: 0, //加载状态0默认，1显示加载状态，2执行加载数据，只有当为0时才能再次加载，这是防止过快拉动刷新
						refreshStatus: 0,//0刷新，1加载更多
						islast: false,
						//scrollMaxY:0,
						pageNum: 1,
						pageSize: 10
					}
					
					_thisScroll.on('scroll', function () {
						if (window.ListPages && window.ListPages[type]) {
							temp2 = window.ListPages[type]
						}
						if (temp2.loadingStep == 0 && !temp2.pullDownEl.attr('class').match('flip|loading') && !temp2.pullUpEl.attr('class').match('flip|loading')) {
							
							if (this.y > 5) {
								//下拉刷新效果
								//this.minScrollY=5;
								temp2.refreshStatus = 0;
								temp2.pullDownEl.show();
								temp2.pullDownEl.addClass('flip');
								temp2.pullDownL.html('准备刷新...');
								temp2.loadingStep = 1;
							} else if (this.y < (this.maxScrollY - 5)) {
								//上拉加载效果
								temp2.refreshStatus = 1;
								temp2.pullUpEl.show();
								temp2.pullUpEl.addClass('flip');
								temp2.pullUpL.html('松开加载...');
								if (temp2.islast) {
									temp2.pullUpL.html('没有更多数据了。');
									
								}
								temp2.loadingStep = 1;
							}
						}
					});
					//滚动完毕
					_thisScroll.on('scrollEnd', function () {
						if (temp2.loadingStep == 1) {
							if (temp2.pullUpEl.attr('class').match('flip|loading')) {
								temp2.pullUpEl.removeClass('flip').addClass('loading');
								temp2.pullUpL.html('Loading...');
								if (temp2.islast) {
									temp2.pullUpL.html('没有更多数据了。');
									// setTimeout(function () {
									temp2.pullUpEl.hide();
									//    window.ListScrollers[type].refresh();
									//     if (type == 'status1') {
									//         window.ListScrollers[type].maxScrollY = window.ListScrollers[type].maxScrollY - 56
									//     }
									// }, 1000)
									
								}
								temp2.loadingStep = 2;
								_this.getOrderList(type);
							} else if (temp2.pullDownEl.attr('class').match('flip|loading')) {
								temp2.pullDownEl.removeClass('flip').addClass('loading');
								temp2.pullDownL.html('Loading...');
								
								temp2.loadingStep = 2;
								
								_this.refreshList(type);
							}
						}
						
					});
					
					//全局scroller
					temp[type] = _thisScroll;
					$.extend(window.ListScrollers, temp);
					
					//分页信息,默认1开始
					var lsp = {}
					lsp[type] = temp2;
					$.extend(window.ListPages, lsp);
					//$.extend(window.ListPages, tmpEl);
					
				});
				
				document.getElementsByClassName('wrapper')[0].addEventListener('touchmove', function (e) {
					e.preventDefault();
				}, false);
			},
			
			init: function () {
				var _this = this,
					$wrapper = $('.wrapper'),
					$no = $('#forno'),
					$yes = $('#foryes'),
					$hasOrdered = $('#js-ordered'),
					$orderNo = $('#orderNo'),
					$pagenum = $('#pagenum'),
					$orderNoType = $('#orderNoType'),
					$orderTypeFlag = $('#orderTypeFlag'),
					$jsShow = $('#js-show'),
					$layer = $('#js-leayer'),
					$qs        = $('#qs'),
					$tel       = $('#tel'),
					phoneNum   = (Util.getQuery('phone') || '').replace(/\s/gi, ''),
					$submitBtn = $('#js_msg2sBtn');
				
				$yes.on('click',function () {
					$(this).addClass('selected').next().attr('checked','checked');
					$no.removeClass('selected').next().removeAttr('checked');
					$orderNoType.val('1');
					$hasOrdered.show();
				});
				$no.on('click',function(){
					$(this).addClass('selected').next().attr('checked','checked');
					$yes.removeClass('selected').next().removeAttr('checked');
					$orderNoType.val('0');
					$hasOrdered.hide();
				});
				$hasOrdered.on('click',function (event) {
					event.preventDefault();
					event.stopImmediatePropagation();
					//点击跳转前存储当前页面的信息
					//如果url是空的，证明是选择订单页面
					var feedbackDatas = localStorage.getItem('feedbackDatas') && JSON.parse(localStorage.getItem('feedbackDatas')) || {};
					var rul = feedbackDatas.returnurl || '';
					var returnurl = Util.getQuery('returnurl') && Util.getQuery('returnurl') || rul;
					var obj = {},
						objs = {'returnurl': returnurl},
						params  = $('form').serializeArray(),
						exModel = {};
					params.forEach(function (item) {exModel[item.name] = item.value});
					$.extend(obj, exModel);
					$.extend(objs, obj);
					
					//保存文本数据
					localStorage.setItem('feedbackDatas', JSON.stringify(objs));
					var _params = {
						url: location.origin + '/life/assets/pages/order-select.html?pageFlag=feedbackHtml&pagenum='+ $pagenum.val() +'&type=status'+ $orderTypeFlag.val() + '&ordersn=' + $orderNo.val() || ''
					};
					jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(_params), _params.url);
				})
				
				//清除缓存
				$('.go-back').on('click',function (event) {
					localStorage.setItem('getkefuInfo', null);
					var feedbackDatas = localStorage.getItem('feedbackDatas') && JSON.parse(localStorage.getItem('feedbackDatas')) || {};
					var _returnurl = feedbackDatas.returnurl || Util.getQuery('returnurl');
					localStorage.setItem('feedbackDatas', null);
					location.href = decodeURIComponent(_returnurl);
				})
				
				jb.topbarHandler('left', '', '', 'goback');
				window.WebViewJavascriptBridge.registerHandler('goback', function (data, responseCallback) {
					// jb.historygoHandler('browser');
					jb.historygoHandler('native');
				});
				
				_this.listScroll();
				//拉取数据
				_this.refreshList('status1');
				
				if(!!Util.isApp()){
					//注册监听消息
					$wrapper.addClass('top2').removeClass('top1');
					jb.addObserver('refreshListenFeedbackList', 'listRefresh');
					window.WebViewJavascriptBridge.registerHandler('listRefresh', function (data, responseCallback) {
						typeof data =='string' && (data = JSON.parse(data));
						data = data.params;
						if(data.tab == 'feedbackFlag'){
							$jsShow.css('display', 'none');
							window.ListPages['status1']['pageNum'] = 1;
							window.ListPages['status1']['islast'] = false;
							_this.getOrderList('status1');
						}else if(data.tab == 'orderFlag'){
							$orderNo.val(data.orderNo || '');
							$pagenum.val(data.pagenum ||　'');
							$orderTypeFlag.val(data.orderType || '');
						}

					});
				}else{
					$wrapper.addClass('top1').removeClass('top2');
					var getkefuInfo = localStorage.getItem('getkefuInfo') && JSON.parse(localStorage.getItem('getkefuInfo')) || '';
					var feedbackDatas = localStorage.getItem('feedbackDatas') && JSON.parse(localStorage.getItem('feedbackDatas')) || '';
					if(getkefuInfo){
						if(getkefuInfo.tab == 'orderFlag'){
							$orderNo.val(getkefuInfo.orderNo || '');
							$pagenum.val(getkefuInfo.pagenum ||　'');
							$orderTypeFlag.val(getkefuInfo.orderType || '');
							
							$yes.addClass('selected').next().attr('checked','checked');
							$no.removeClass('selected').next().removeAttr('checked');
							$orderNoType.val('1');
							$hasOrdered.show();
						}
					}
					if(feedbackDatas){
						var content = $('textarea[name="content"]'),
							contactWay = $('input[name="contactWay"]'),
							feedbackTime = $('input[name="feedbackTime"]');
						content.val(feedbackDatas['content']);
						contactWay.val(feedbackDatas['contactWay']);
						feedbackTime.val(feedbackDatas['feedbackTime']);
						$orderNo.val() && content.val() && contactWay.val() && $submitBtn.removeClass('gray-line');
						
					}
				}
				
				var postParams = {
					siteType : sitetype,
					token : Util.getToken()
				}
				if (phoneNum) {
					//var _phone = Util.mobileFilter(phoneNum);
					$tel.val(phoneNum);
				}
				$qs.on('input', function () {
					var qsl = $qs.val().length;
					$('.text-num').html(((200 - qsl) < 0 ? 0 : (200 - qsl)));
					
					$tel.trigger('input');
				});
				$tel.on('input', function () {
					($qs.val() && $tel.val()) ? $submitBtn.removeClass('gray-line') : $submitBtn.addClass('gray-line');
				});
				
				//点击选择时间
				$('#js-time').on('click',function () {
					$('#chooseDate').addClass('open');
					$layer.removeClass('dn')
				});
				$layer.livequery(function () {
					$(this).on('click',function (event) {
						if($('#chooseDate').hasClass('open')){
							$('#chooseDate').removeClass('open');
							return;
						}
						if($(event.target)[0].localName == 'li'){
							$('#callbackTime').val($(event.target).data('time'));
						}
						$(this).addClass('dn')
					});
				});
				$submitBtn.livequery(function (e) {
					$(this).on('click',function (e) {
						if($submitBtn.hasClass('gray-line')){
							return;
						}
						e.preventDefault();
						e.stopImmediatePropagation();
						
						//提交留言
						if (_this.isCheck()) {
							$(this).addClass('gray-line');
							var params  = $('form').serializeArray(),
								exModel = {};
							
							params.forEach(function (item) {exModel[item.name] = item.value});
							
							$.extend(postParams, exModel);
							//提交到管理后台
							hs.addfeedback(postParams).then(function (data) {
								if (typeof data == "string") {
									data = JSON.parse(data);
								}
								if (data.state == 0) {
									jb.toastHandler('亲爱的星链用户，感谢您的反馈，客服将尽快回复');
									setTimeout(function () {
										location.reload(true);
									}, 2000);
								} else {
									jb.toastHandler(data.msg || '')
								}
								
							}).fail(function () {
								jb.toastHandler('网络开小差，稍后再试');
							})
						}
					})
				})
				
				//点击具体某一条反馈详情
				$('#showMyFeedback').livequery(function () {
					
					$(this).on('click', 'li', function () {
						var _params = {
							url: location.origin + '/life/assets/pages/myFeedback.html?ticketid=' + $(this).data('ticketid')
						};
						jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(_params), _params.url);
					})
				})
			},
			
			isCheck: function () {
				//opt = opt || {};
				var $form      = $('form'),
					$hasOrderSelect = $('#yes'),
					$noOrderSelect = $('#no'),
					$orderNo = $('#orderNo'),
					formParams = $form.serializeArray();
				var patt = /[\ud800-\udbff][\udc00-\udfff]/g;
				var flag = true;
				
				if($hasOrderSelect.attr('checked') && !$orderNo.val()){
					jb.toastHandler('请选择订单');
					return;
				}else{
					$noOrderSelect.attr('checked') &&　$orderNo.val('');
				}
				formParams[3].value = formParams[3].value.replace(/\s+/g, '');
				for (var i = 0; i < formParams.length; i++) {
					var r = this.validRule(formParams[i]);
					if (!r.flag) {
						$form.find('input[name="' + r.name + '"]').focus();
						
						jb.toastHandler(r.msg);
						
						flag = false;
						break;
					}
				}
				if (patt.test(formParams[0].value)) {
					flag = false;
					// $.dialog({
					//     contentHtml: '不能输入表情符号'
					// })
					jb.toastHandler('不能输入表情符号');
					
				}
				return flag;
			},
			
			/**
			 * 验证表单
			 * @param model {name:string, value:string}
			 * @returns {flag:boolean,msg:string}
			 * @private
			 */
			validRule: function (model) {
				
				var rules = {
					content: {
						required: true,
						reg: /[^*]{1}/,
						msg: '请输入您的问题描述'
					},
					
					contactWay: {
						required: true,
						reg: /^1(3[0-9]|4[57]|5[0-35-9]|7[01678]|8[0-9])\d{8}$/,
						msg: '请正确输入手机号码'
					}
				}
				
				var expect = rules[model.name],
					flag   = false;
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
            showheader: function () {
                if (!Util.isApp()) {
                    $('header').removeClass('none');
                }
            }
		}
		return FeedbackController;
	});
