/**
 * Created by Administrator on 2017/8/17.
 */

define('collect', ['collectService', 'md5'], function (collectService) {

  var cs = new collectService();
  var collect = function () {
  };

  // GUID 生成器
  var guidGenerator = function () {

    var S4 = function () {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
  }

  collect.prototype = {

    setlogcollect: function (data, eventName) {

      if (!data) {
        console.log('缺少日志信息')
        return
      }

      //判断是否是微信浏览器
      function isWeiXin() {

        return /MicroMessenger/gi.test(window.navigator.userAgent);
      }

      var tid = $.md5("36" + guidGenerator());
      var tm = Util.formatDate2(new Date(), 'yyyy-MM-dd hh:mm:ss.S');

      var options = {
        "OS": "",                     //客户端的OS"
        "DVUA": navigator.userAgent,  //客户端的UA
        "APPNAME": "",                //客户端的appname，APP或者wap
        "LIT": Util.getQuery('longitude'),                    //经度
        "LAT": Util.getQuery('latitude'),                    // 纬度
        "CITY": "",       //所在城市
        "IP": "",        // IP
        "DVID": Util.getCookie('CusID'),                   //请求头的DVID
        "nm": eventName || "A_CLICK",              //登录、绑定、注册事 件"
        "tm": tm, //"事件发生时间格式YYYY-MM-DDhh24:mm:ss.sss"
        "tid": tid || '', //客户端请求头中的TID或者本次业务的TID"
        "atts": [],
        "TK": Util.getQuery('token') || '' //token
      };
      if (isWeiXin()) {
        options.APPNAME = "_wx_";
      } else {
        options.APPNAME = Util.getQuery('appname') || "_h5_";
      }

      if ("undefined" != typeof window.returnCitySN) {
        options.CITY = window.returnCitySN["cname"];
        options.IP = window.returnCitySN["cip"];
        if (!options.DVID) {
          options.DVID = window.returnCitySN["cip"];
        }
      }

      Util.extend(options, data);

      var params = {
        EVS: []
      };
      params.EVS.push(options);

      return cs.getLogcollect(JSON.stringify(params)).then(function (data) {
        data = (typeof data == 'string') ? JSON.parse(data) : data;
        if (data.state == 0) {
          console.log(data.msg)
        }
      });
    }

  };

  return collect
});




