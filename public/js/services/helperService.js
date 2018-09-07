define( 'helperService', ['services', 'jsbridge'],
    function (Services,jsbridge) {
        var helperService = function () {

            Services.call(this, '');
        }
        var jb = new jsbridge();

        helperService.prototype = Object.create(Services.prototype);

        var _super = Services.prototype;

        helperService.prototype.getQuestionTypeLists = function (params) {

            return _super.getData({
                url: WEB_CONFIG.getApi('questionTypeLists'),
                type:'GET',
                data: params || {}
            })
        };
        helperService.prototype.getQuestionDetails = function (params) {

            return _super.getData({
                url: WEB_CONFIG.getApi('queryQuestions'),
                data: params || {}
            })
        };

        helperService.prototype.addfeedback = function (params) {
            return _super.getData({
                url: WEB_CONFIG.getApi('addfeedback'),
                data: params || {}
            })
        };
        
        helperService.prototype.getFeedbackList = function(params){
            jb.loadingHandler('show')
            return _super.getData({
                url: WEB_CONFIG.getApi('listFeedback'),
                data: params
            })
        };
        
        helperService.prototype.getMyFeedbackDetail = function(params){
            return _super.getData({
                url: WEB_CONFIG.getApi('feedbackDetails'),
                data: params
            })
        };
        
        helperService.prototype.feedbackReply = function(params){
            return _super.getData({
                url: WEB_CONFIG.getApi('myReply'),
                data: params
            })
        };
        

        return helperService
    });
