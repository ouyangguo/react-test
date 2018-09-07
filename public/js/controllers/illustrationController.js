/**
 *换绑功能的说明页面
 * author chenling
 * creat at 2017/5/10
 */
define('illustrationController',['jsbridge'],function (jsbridge) {
	
	var jb = new jsbridge();
	
	var IllustrationController = function () {};
	
	IllustrationController.prototype =  {
		init : function(){
			
			//左侧按钮、
			//jb.topbarHandler('left', '', '', '');
			
			//点击
			$('#footerBtn').on('click',function () {
				var _params = {
					url: location.origin + '/life/assets/pages/feedback.html'
				};
				jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(_params), _params.url);
			})
		}
	};
	
	return IllustrationController;
	
});