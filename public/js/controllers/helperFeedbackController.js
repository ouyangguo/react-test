/**
 * 我的反馈详情列表
 * author chenling
 * creat at 2017/05/04
 */
define('helperFeedbackController', ['helperService' ,'jsbridge', 'handlebars', 'livequery'],function(HelperService, jsbridge, Handlebars){
	var hs = new HelperService();
	var jb = new jsbridge();
	var isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
	
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
	
	var HelperFeedbackController = function(){};
	
	HelperFeedbackController.prototype ={
		
		init: function(){
			if(!!Util.isApp()){
				jb.topbarHandler('left', '', '', 'jsFeedbackDetail');
				window.WebViewJavascriptBridge.registerHandler('jsFeedbackDetail', function (data, responseCallback) {
					jb.postNotification('refreshListenFeedbackList',JSON.stringify({'tab':'feedbackFlag'}));
					jb.historygoHandler('native');
				});
				
				//注册监听消息
				jb.addObserver('refreshListenFeedbackDetail', 'listRefresh');
				window.WebViewJavascriptBridge.registerHandler('listRefresh', function (data, responseCallback) {
					location.reload(true)
					location.href = location.href;
				});
			}
			hs.getMyFeedbackDetail({'ticketid' : Util.getQuery('ticketid') }) //Util.getQuery('ticketid')
			.then(function(data){
				if(data.state == '0'){
					//处理数据格式
					data.data.created_atFormat = data.data.createdAt.substr(0,16) || data.data.createdAt;
					data.data.isios = isIOS ? true : false;
					$.map(data.data.replies, function (ls, index) {
						ls.replyUserType == 'agent' ? ls.reply_user_typeFlag = true : ls.reply_user_typeFlag = false ;
						ls.reply_created_atFormat = ls.replyCreatedAt && ls.replyCreatedAt.substr(0,16) || ls.replyCreatedAt;
						return ls;
					})
					data.data.replies.reverse();
					handlebarfn('#tmpl_feedbackDetail','#feedbackDetail',data.data,'replace');
				}else {
					jb.toastHandler(data.msg);
				}
			})
			.fail(function () {
				jb.toastHandler('网络开小差，稍后再试');
			}).done(function () {
				
			});
			
			$('#footerBtn').on('click', function(){
				var _params = {
					url: location.origin + '/life/assets/pages/feedback-reply.html?ticketid=' + $('#js-ticketid').data('ticketid')
				};
				jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(_params), _params.url);
			})
		}
		
	}
	
	return HelperFeedbackController;
});