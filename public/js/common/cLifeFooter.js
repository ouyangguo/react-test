/**
 * Created by Administrator on 2017/10/13.
 */
define(['livequery','jsbridge'],function(livequery,jsbridge){
	
	var jb = new jsbridge();
	
	var cLifeFooter = {
		
		init: function ($parentEl) {
			var $parentEl = $parentEl || {};
			
			$parentEl.livequery(function () {
				$(this).delegate('li', 'click', function (e) {
					
					e.preventDefault();
					e.stopImmediatePropagation();
					
					if($(this).attr('id')){
						return
					}else{
						
						var params ={
							url : location.origin + '/life/assets/pages/' + $(this).data('link')
						}

						jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params), params.url);
						
						//location.href = location.origin + '/life/assets/pages/' + $(this).data('link')
					}
				});
			})
		}
		
	}
	
	return cLifeFooter
})