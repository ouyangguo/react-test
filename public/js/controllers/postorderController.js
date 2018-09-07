/*!
 * 客服中心
 */

define('postorderController', ['postorderService','orderService', 'handlebars', 'livequery', 'jsbridge', 'iscroll', 'dialog', 'mobileselect', 'imgzip'],
    function (PostorderService, OrderService,Handlebars, livequery, jsbridge, IScroll, dialog) {
        var ps = new PostorderService();
        var os = new OrderService();
        var jb = new jsbridge();

        var isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
        var tmppostorder = {};

        var params = {
            postsaledsn: Util.getQuery('postsaledsn'),
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

        var clickstatus = true;
        var PostorderController = function () {};
        PostorderController.prototype = {
            /**
             * 获取售后列表
             * @param  type  页面标签data-tab的值
             */
            getPostorderList: function (type) {
                var ot;
                var $cntE = '',
                    $tmpl = '#tmpl_mypostorderlist';
                var cp = window.ListPages[type];
                var noDataText = '';
                switch (type) {
                    case 'postlist':
                        $cntE = '#cnt_postorderlist .listcntItem';
                        noDataText = '暂无内容';
                        break;
                }
                var _this = this;
                var listParams = {
                    pagesize: cp.pageSize || 10,
                    pagenum: cp.pageNum || 1,
                    token: Util.getQuery('token')
                }
                if (cp.islast) {
                    //设置状态
                    cp.loadingStep = 0;
                    //移除loading
                    cp.pullUpEl.removeClass('loading');
                }

                //获取订单列表
                return !cp.islast && ps.getPostorderList(listParams)
                    .then(function (data) {
                        jb.loadingHandler('hide');
                        if (data.state == 0) {

                            //是否空数据 根据total判断 total=0 没数据
                            if (data.data.total == 0) {
                                var tmpObj = {
                                    noDataText: noDataText,
                                    isNodata: true
                                }
                                $.extend(data.data, tmpObj);
                                $('body').css('background', '#ffffff');
                                handlebarfn('#tmpl_nodata', $cntE, data.data, 'replace');
                            } else {
                                //格式化数据

                                //刷新用html，加载用append
                                if (cp.refreshStatus == 0) {
                                    handlebarfn($tmpl, $cntE, data.data, 'replace');
                                } else {
                                    handlebarfn($tmpl, $cntE, data.data);
                                }

                                //绑定事件
                                $('.sec-left-pad').livequery('click', function (e) {
                                    e.preventDefault();
                                    e.stopImmediatePropagation();
                                    var _postsaledSN = $(this).parent().data('postsaledsn');
                                    var _type = $(this).parent().data('posttype');
                                    var url = location.origin + '/life/assets/pages/postorder-detail.html?postsaledsn=' + _postsaledSN + '&type=' + _type + '&' + Util.getQueryString();
                                    console.log(url);
                                    var tmpparams = {
                                        url: url
                                    }
                                    jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);
                                    //window.location.href = './postorder-detail.html?postsaledsn=' + _postsaledSN + '&type=' + _type + '&' + Util.getQueryString();
                                })
                                //更新ListPage
                                if (data.data.isLast == 0) {
                                    //不是最后一页
                                    cp.pageNum++;
                                } else {
                                    //没有更多数据
                                    cp.pullUpL.html('没有更多数据了');
                                    cp.islast = true;
                                }
                                //移除loading
                                cp.pullUpEl.removeClass('loading');
                            }

                        } else {
                            //请求数据不成功
                            if (typeof data == "string") {
                                data = JSON.parse(data);
                            }
                            console.log(data.msg);
                            jb.toastHandler(data.msg);
                        }

                    })
                    .then(function () {
                        _this.iscrollRefresh(type);
                    })
                    .fail(function (data) {
                        if (typeof data == "string") {
                            data = JSON.parse(data);
                        }
                        //if(data.state=='6829201')
                        jb.toastHandler(data.msg);
                        //jb.toastHandler('网络开小差，稍后再试');
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

                _this.getPostorderList(type);
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
                    var wrapItemEl = $thiswrapper.find('.listcntItem');
                    $(pulldownHtml).insertBefore(wrapItemEl);
                    $(pullupHtml).insertAfter(wrapItemEl);

                    temp2 = {
                        pullDownEl: $thiswrapper.find('.pullDown'),
                        pullDownL: $thiswrapper.find('.pullDownLabel'),
                        pullUpEl: $thiswrapper.find('.pullUp'),
                        pullUpL: $thiswrapper.find('.pullUpLabel'),
                        loadingStep: 0, //加载状态0默认，1显示加载状态，2执行加载数据，只有当为0时才能再次加载，这是防止过快拉动刷新
                        refreshStatus: 0, //0刷新，1加载更多
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

                            if (this.y > 15) {
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

                        $(".lazyload-img").trigger("unveil");
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
                                _this.getPostorderList(type);
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

                document.addEventListener('touchmove', function (e) {
                    e.preventDefault();
                }, false);

            },

            /**
             * 获取售后详情
             */
            getPostorderDtail: function () {
                var _this = this;
                _this.registerJsHandler();
                jb.topbarHandler('left', '', '', 'jsHistorygo');

                localStorage.removeItem('postOrderDetailData');

                params.type = Util.getQuery('type') || 1;
                ps.getPostorderDetail(params).then(function (data) {
                    //data = JSON.parse(data);
                    console.log(data);
                    var detailInfo = data.data.detail;
                    detailInfo.operaBtnData = {};
                    if (data.state == 0) {
                        //保存临时信息
                        tmppostorder.postType = detailInfo.postsaleInfo.postType;
                        tmppostorder.ordersn = detailInfo.postsaleInfo.orderSN;
                        tmppostorder.postalordersn = detailInfo.postsaleInfo.postsaledSN;
                        //设置按钮
                        var _status = detailInfo.postsaleInfo.postsaledStatus;
                        _this.setOperationBtn(detailInfo.postsaleInfo.postType, _status, detailInfo.operaBtnData);

                        detailInfo.postsaleInfo.postTypeName = (detailInfo.postsaleInfo.postType == 1) ? '退款' : '退货退款';
                        detailInfo.toHomeName = (detailInfo.toHome == 1) ? '送货上门' : '其他快递方式';
                        detailInfo.aftersalefinish = (detailInfo.postsaleInfo.postType == 7);
                        detailInfo.showReceive = (detailInfo.postsaleInfo.postType == 2 && (_status == 3 || _status == 4 || _status == 7));
                        if (_status == 1 || _status == 2) {
                            //申请中与审核不通过
                            detailInfo.auditAmount = detailInfo.amount;
                        }
                        detailInfo.procTime = Util.formatDate2(detailInfo.procTime, 'yyyy-MM-dd hh:mm:ss');
                        detailInfo.postsaleInfo.createTime = Util.formatDate2(detailInfo.postsaleInfo.createTime, 'yyyy-MM-dd hh:mm:ss');
                        $.map(detailInfo.serviceLogList, function (ls, index) {
                            ls.logtext = ls.log;
                            ls.logDate = Util.formatDate2(ls.logDate, 'yyyy-MM-dd hh:mm');
                            return ls;
                        })

                        localStorage.setItem('postOrderDetailData', JSON.stringify(detailInfo));
                        handlebarfn('#tmpl_postorderdetail', '#cnt_postorderdetail', detailInfo);

                        //绑定按钮点击事件
                        _this.bindOperationFn();
                        _this.preverImg();
                        //设置进度样式
                        var list     = $('.track-process').find('li'),
                            list_len = list.length;
                        if (list_len == 1) {
                            list.addClass('one-len');
                        }
                    } else {
                        if (typeof data == "string") {
                            data = JSON.parse(data);
                        }
                        jb.toastHandler(data.msg);
                    }
                })
                    .done(function () {
                        //console.log('done')
                    });
            },
            /**
             * 提交退货发货地址
             */
            postsaledAddr: function () {

                var _this = this;
                _this.registerJsHandler();
                jb.topbarHandler('left', '', '', 'jsHistorygo');

                var postParams = {
                    ordersn: Util.getQuery('ordersn'),
                    expcompany: ''
                };

                var $form = document.getElementsByTagName('form')[0];
                $form.addEventListener('submit', function (e) {
                    e.preventDefault();
                });

                // 填充快递公司
                ps.getDeliverCompany()
                    .then(function (data) {
                        if (typeof data == 'string') {
                            data = JSON.parse(data);
                        }
                        if (data.state == 0) {

                            handlebarfn('#tmpl_delivercompany', '#cnt_delivercompany', data.data, 'replace');

                        } else {
                            jb.toastHandler(data.msg);
                        }
                    });

                $('#js_submitbtn').on('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var exModel = {
                        expcompany: $("#cnt_delivercompany option").not(function () {
                            return !this.selected
                        }).text(),
                        expcompanysn: $('#cnt_delivercompany').val(),
                        trackingnum: $('#trackingnum').val()
                    };

                    var flag = true;
                    var r = _this.validRule({
                        name: 'trackingnum',
                        value: exModel.trackingnum
                    });
                    if (!exModel.expcompanysn) {
                        jb.toastHandler('请选择快递公司')
                        flag = false
                        return
                    }
                    if (!r.flag) {
                        jb.toastHandler(r.msg)
                        flag = false
                        return
                    }
                    $.extend(params, postParams, exModel);
                    if (flag) {
                        ps.setPostsaledAddr(params)
                            .then(function (data) {
                                if (typeof data == 'string') {
                                    data = JSON.parse(data);
                                }
                                if (data.state == 0) {
                                    var _returnurl = Util.getQuery('returnurl');
                                    location.href = decodeURIComponent(_returnurl);
                                    //window.location.href = './postorder-detail.html?' + Util.getQueryString();
                                    //jb.routerHandler(WEB_CONFIG.nativePage.order.aftersaledetail.id,params.postsaledsn)
                                } else {
                                    jb.toastHandler(data.msg);
                                }
                            })

                    }

                })

            },

            /**
             * 手机号码格式化344
             * 操作：输入及删除
             */
            formatTel: function () {
                var $target         = $('#tel'),
                    isDeleteMode    = false,
                    isPasteMode     = false,
                    currentPosition = 0;

                $target.on('input', function (e) {
                    var $this              = $(this),
                        value              = $this.val().replace(/\s/g, ""),
                        rs                 = formatNumber(value),
                        selectionStartPrev = $this.get(0).selectionStart;

                    $this.val(rs.after)
                    //135 1214 5548
                    var selectionStart = $this.get(0).selectionStart,
                        selectionEnd   = $this.get(0).selectionEnd,
                        delta          = $.inArray(selectionStartPrev, [4, 9]),
                        pos            = selectionEnd;

                    //alert(selectionStart)

                    pos = (delta > -1) ? (selectionStartPrev + ((delta == 0) ? (delta + 1) : delta)) : selectionStartPrev;

                    if (isDeleteMode) {
                        if (delta > -1) {

                            if (delta == 0) {
                                pos = pos - 2;
                            } else {
                                pos = pos - 1;
                            }
                        }

                    }
                    if (isPasteMode) {
                        pos = selectionEnd;
                    }

                    $this.get(0).setSelectionRange(pos, pos);

                    isDeleteMode = false;
                    isPasteMode = false;

                })

                $target.on('keydown', function (event) {

                    var $this          = $(this),
                        selectionStart = $this.get(0).selectionStart;

                    currentPosition = selectionStart;

                    if (event.keyCode === 8) {
                        isDeleteMode = true;
                    }

                })
                $target.on('paste', function (event) {
                    isPasteMode = true;
                })

                function formatNumber(value) {

                    return {
                        before: value,
                        after: value.replace(/(^\d{3}|\d{4}\B)/g, "$1 ")
                    }
                }

            },
            /**
             * 设置title：客服介入、订单投诉
             */
            // setDocumentTitle:function (title) {
            //     var u = navigator.userAgent;
            //     var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
            //     var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
            //     if(isAndroid){
            //         var _title=$('title');
            //         _title.hide();
            //         _title.html(title);
            //         _title.show();
            //     }else{
            //         jb.topbarHandler('center', '', title);
            //     }
            // },
            /**
             * 申请客服介入、订单投诉
             */
            msg2service: function () {
                var _this = this;
                var postParams = {
                    type: Util.getQuery('type') || '2', //1=客服介入,2= 订单投诉
                    phone: Util.getQuery('phone') || '',
                    token: Util.getQuery('token'),
                    order_number: '',
                    title: ''
                };
                if (postParams.type == 1) {
                    jb.topbarHandler('center', '', '客服介入');
                    postParams.title = '客服介入';
                    postParams.order_number = Util.getQuery('postsaledsn');
                    if (!Util.isApp()) {
                        $('.header-wrap .header-title').html('客服介入');
                    }

                }
                if (postParams.type == 2) {
                    jb.topbarHandler('center', '', '订单投诉');
                    postParams.title = '订单投诉';
                    postParams.order_number = Util.getQuery('ordersn');
                    if (!Util.isApp()) {
                        $('.header-wrap .header-title').html('订单投诉');
                    }
                    ;
                }
                var $qs      = $('#qs'),
                    $tel     = $('#tel'),
                    phoneNum = (Util.getQuery('phone') || '').replace(/\s/gi, '');

                if (Util.getQuery('phone')) {
                    //var _phone = Util.mobileFilter(Util.getQuery('phone'));
                    $tel.val(phoneNum);
                }
                $qs.on('input', function () {
                    var qsl = $qs.val().length;
                    $('.text-num').html(200 - qsl);
                });
                // var u    = window.navigator.userAgent,
                //     myua = u.substr(u.indexOf('Android') + 8, 3);
                // if (myua <= 4.3) {
                //     $tel.attr('maxlength', '11')
                // } else {
                //     $tel.on('keydown', function (e) {
                //         var tv = $(this).val(),
                //             tl = tv.length;
                //         if (e.keyCode == 8) {
                //             if (tl == 4 || tl == 9) {
                //                 $tel.val(tv.substring(0, tv.length - 2));
                //             } else {
                //                 $tel.val(tv.substring(0, tv.length - 1));
                //             }
                //             return false;
                //         }
                //     })
                //     $tel.on('input', function () {
                //         var tv = $(this).val();
                //         tv = tv.replace(/\s/g, "");
                //         $(this).val(Util.mobileFilter(tv))
                //     });
                // }

                //电话号码输入控制
                //_this.formatTel();

                $('#js_msg2sBtn').on('tap', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    //验证状态
                    //

                    var $form      = $('form'),
                        formParams = $form.serializeArray(),
                        exModel    = {},
                        env        = Util.getQuery('env');

                    var patt = /[\ud800-\udbff][\udc00-\udfff]/g;
                    var flag = true;
                    formParams[1].value = formParams[1].value.replace(/\s+/g, '');
                    for (var i = 0; i < formParams.length; i++) {
                        var r = _this.validRule(formParams[i]);
                        if (!r.flag) {
                            $form.find('input[name="' + r.name + '"]').focus();
                            //Util.dialog.showMessage(r.msg);

                            jb.toastHandler(r.msg);

                            flag = false;
                            break;
                        }

                        exModel[formParams[i].name] = formParams[i].value;
                    }
                    if (patt.test(formParams[0].value)) {
                        flag = false;

                        // $.dialog({
                        //     contentHtml: '不能输入表情符号'
                        // })

                        jb.toastHandler('不能输入表情符号');
                    }

                    $.extend(postParams, exModel);

                    if (flag) {
                        if (clickstatus) {

                            ps.setMsg2service(postParams).then(function (data) {
                                console.log(data);
                                if (typeof data === "string") {
                                    data = JSON.parse(data);
                                }

                                if (data.state == 0) {

                                    var msg = WEB_CONFIG.messageBox.service;
                                    jb.toastHandler(msg);

                                    if (!Util.isApp()) {

                                        setTimeout(function () {
                                            window.history.go(-1)
                                        }, 1500)

                                    } else {

                                        jb.historygoHandler('native');
                                    }

                                } else {
                                    jb.toastHandler('留言失败，请重新提交')
                                }

                            })

                        }

                        clickstatus = false;
                        setTimeout(function () {
                            clickstatus = true;
                        }, 1000)
                    }

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
                    expcompanysn: {
                        required: true,
                        reg: /[\d\w]{1,}/ig,
                        msg: '请选择快递公司'
                    },
                    trackingnum: {
                        required: true,
                        reg: /[\d\w]{1,}/ig,
                        msg: '请正确输入快递单号'
                    },

                    msg: {
                        required: true,
                        reg: /[^*]{1}/,
                        msg: '请输入您的问题描述'
                    },

                    phone: {
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
            /**
             * 根据订单状态设置操作按钮
             * status:状态
             * resultObj：填充到页面的json对象
             */
            setOperationBtn: function (postType, status, resultObj) {
                //根据订单状态设置显示的图标以及按钮的文字 status
                //状态说明====》1：申请中 2：审核不通过:3：审核通过 4：买家已发货 6：退款处理中 7：退款成功 8：退款关闭
                //按钮说明====》1：取消申请；2：客服介入；3：修改申请；4：填写发货信息
                //
                //状态对应的大icon
                //operaBtnData.orderStatusIcon
                //状态对应第一个按钮的id 和名字
                //operaBtnData.optId  & operaBtnData.optText
                //是否是着色按钮
                //operaBtnData.orderBaseInfo.hasCurr
                //状态对应着色按钮的id 和名字
                //operaBtnData.optCurrId  & operaBtnData.optCurrText
                var operaBtnData = {
                    orderStatusIcon: '../images/common_icon_pass@3x.png',
                    optId: '',
                    optText: '',
                    hasBtn: false,
                    hasCurr: false,
                    optCurrId: '',
                    optCurrText: ''
                }
                switch (status) {
                    case '1': //申请中
                        operaBtnData.hasBtn = true;
                        //第一个按钮
                        operaBtnData.optId = 1;
                        operaBtnData.optText = '取消申请';
                        break;
                    case '2': //审核不通过
                        operaBtnData.orderStatusIcon = '../images/common_icon_no_pass@3x.png';
                        operaBtnData.hasBtn = false;
                        //第一个按钮
                        operaBtnData.optId = 2;
                        operaBtnData.optText = '客服介入';
                        //第二个按钮
                        // operaBtnData.hasCurr = true;
                        // operaBtnData.optCurrId = 3;
                        // operaBtnData.optCurrText = '修改申请';
                        break;
                    case '3': //审核通过
                        operaBtnData.hasBtn = true;
                        //operaBtnData.orderStatusIcon = '../images/icon_oder_delivery@3x.png';
                        operaBtnData.orderStatusIcon = '../images/common_icon_pass@3x.png';
                        //第一个按钮
                        operaBtnData.optId = 4;
                        operaBtnData.optText = '填写发货信息';
                        break;
                    case '4': //买家已发货
                        break;
                    case '5':
                        break;
                    case '6': //退款处理中
                        break;
                    case '7': //退款完成
                        operaBtnData.orderStatusIcon = '../images/icon_oder_successful@3x.png';
                        break;
                    case '8': //退款关闭
                        operaBtnData.orderStatusIcon = '../images/icon_oder_close@3x.png';
                        break;

                }
                $.extend(resultObj, operaBtnData);
            },
            /**
             * 绑定操作按钮事件
             */
            bindOperationFn: function () {
                var _this = this;
                var dataStr = localStorage.getItem('postOrderDetailData');
                var detailInfo = JSON.parse(dataStr);
                console.log('detailInfo from btnfun=', detailInfo);
                $('.opera-wrap .comm-btn').livequery('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    var $this = $(this);
                    var opraId = $this.data('type');
                    if (clickstatus) {
                        if (opraId == 1) {
                            //取消申请
                            if (tmppostorder.postType == 1) {
                                tmppostorder.action = 3;
                            } else {
                                tmppostorder.action = 4;
                            }
                            console.log(tmppostorder);
                            $.extend(tmppostorder, params);

                            ps.cancelService(tmppostorder)
                                .then(function (data) {
                                    console.log(data);
                                    if (data.state == 0) {
                                        jb.toastHandler('取消售后申请成功');
                                        //Util.dialog.showTips("取消售后申请成功");
                                        location.reload(true);
                                    } else {
                                        data = JSON.parse(data);
                                        jb.toastHandler(data.msg);
                                    }
                                })
                        }
                        if (opraId == 2) {
                            //客服介入
                            var url = location.origin + '/life/assets/pages/service-in.html?type=1&phone=' + detailInfo.receiverPhone + '&' + Util.getQueryString(['type']);
                            console.log(url);
                            var tmpparams = {
                                url: url
                            }
                            jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(tmpparams), url);
                            //window.location.href = './service-in.html?type=1&phone=' + detailInfo.receiverPhone + '&' + Util.getQueryString(['type']);
                            //jb.routerHandler('1012', '', '/life/assets/pages/order-complaint.html?type=1&postsaledsn=' + tmppostorder.postalordersn + '&phone=')
                        }
                        if (opraId == 3) {
                            //修改申请
                            //跳app
                            var _tp = {};
                            if (detailInfo.postsaleInfo.postType == 1) {
                                //退款
                                _tp = {
                                    ordersn: detailInfo.postsaleInfo.orderSN.toString(), //订单号
                                    totalAmount: detailInfo.amount, //退款审核金额
                                    postalordersn: detailInfo.postsaleInfo.postsaledSN, //售后单号
                                    type: 'customertype' //来自售后标识
                                };
                                jb.routerHandler(WEB_CONFIG.nativePage.order.returnmoney.id, JSON.stringify(_tp))

                            } else {
                                var getGoodsList = function (info) {
                                    var goodsList = [];
                                    info.goodsList.forEach(function (item) {
                                        var goods = {
                                            goodsId: item.goodsId,
                                            price: item.goods.price,
                                            name: item.goodsName,
                                            productId: '',
                                            smallLogoUrl: item.logoUrl,
                                            specId: item.specId,
                                            specName: item.specName,
                                            count: info.isReshipQuantity
                                        };
                                        goodsList.push(goods);
                                    });
                                    return goodsList
                                };
                                //退货
                                _tp = {
                                    ordersn: orderSn + '',                                // 订单号
                                    isReshipQuantity: detailInfo.postsaleInfo.goodsList[0].goodsCount + '',  // 可退货数量
                                    postalordersn: detailInfo.postsaleInfo.postsaledSN,	 //售后单号
                                    goodsList: getGoodsList(detailInfo.postsaleInfo),    // 商品列表
                                    perGoodsRefund: '',                                  // 单商品可退金额
                                    maxGoodsRefund:  '',                                 // 最大可退货金额
                                    goodsDelivery:  '',                                  // 运费
                                    combineInfoId: '',                                   // 组合商品id
                                    voucher: '',                                         // voucher  是否使用星券，0:否(默认) 1:是
                                    type: 'customertype'                                 // 来自售后标识
                                };
                                jb.routerHandler(WEB_CONFIG.nativePage.order.returngoods.id, JSON.stringify(_tp))
                            }
                        }
                        if (opraId == 4) {
                            //填写发货信息
                            var returnUrl = encodeURIComponent(location.href);

                            window.location.href = location.origin + '/life/assets/pages/submitaddr.html?ordersn=' + detailInfo.postsaleInfo.orderSN + '&' + Util.getQueryString() + '&returnurl=' + returnUrl;
                        }
                    }
                    jb.postNotification('refreshListenindetail');
                    clickstatus = false;
                    setTimeout(function () {
                        clickstatus = true;
                    }, 1000)
                });
            },
            /**
             * 图片放大
             */
            preverImg: function () {
                var $pop = $('.pop');
                $('.img-list img').click(function (e) {
                    $pop.removeClass('none').find('img').attr('src', $(this).attr('src'));
                });
                $('.pop').click(function (e) {
                    $pop.addClass('none');
                });
            },
            /**
             * 注册native调用函数
             * @return {[type]} [description]
             */
            registerJsHandler: function () {
                window.WebViewJavascriptBridge.registerHandler('jsHistorygo', function (data, responseCallback) {
                    // data = $.parseJSON(data);

                    jb.historygoHandler('native');

                    var responseData = {
                        'state': 0,
                        'msg': 'ok'
                    };
                    responseCallback(responseData)
                });
            },

            /**
             * 获取退款退货原因列表
             * @param refundtype
             * @param valueElmentID
             * @param popID
             */
            getRefundCauseList: function (refundtype, valueElmentID, popID) {
                var model = {
                    refundtype: refundtype || 1
                };
                ps.refundCause(model).then(function (data) {
                    var cause = data.data && data.data.list ? data.data.list : [];
                    //handlebarfn('#tmpl_applyrefund', '#cnt_applyrefund', cause);
                    var cau = $('#' + valueElmentID).val();
                    var id = '';
                    if (data.state == 0) {
                        $('#' + valueElmentID).mobileAreaSelect({
                            id: popID || 'res',
                            data: cause,
                            separator: ' ',
                            isMaskClose: true,
                            code: 'id',
                            name: "caption",
                            level: 1,
                            value: [id],
                            isDefault: true,
                            onChange: function (cause) {
                                cau = this.text.join('');
                                id = this.value[0] != '0' ? this.value[0] : '';
                            }
                        })
                    } else {
                        Util.dialog.showTips(data.msg)
                    }
                });
            },
            /**
             * 上传图片
             */

            picupload: function (upimgvlueID, imgformData) {

                var _this = this;
                var count = 0;
                var imgarr = [];
                $('#upload').on('change', function () {
                    var formData1 = $("#upload")[0].files[0];

                    // 创建一个压缩对象，该构造函数接收file
                    var mpImg = new MegaPixImage(formData1);

                    var $target = $('<div class="item-pic"><a href="javascript:;" class="btnX"><img src="../images/common_eidt_btn_photo_delate@2x.png" alt=""></a></div>')
                        .appendTo($('#imgall'));

                    var imgNew = document.createElement("img");
                    imgNew.name = 'a';
                    imgNew.id = 'img' + (+new Date())
                    imgNew.className = "previmg";

                    mpImg.render(imgNew, {
                        maxWidth: 1080,
                        maxHeight: 1080,
                        quality: 0.5
                    }, function (targetImg) {
                        $(targetImg).appendTo($target)
                    });
                    count++;
                    if (count >= 3) {
                        $('#uploadForm').hide();
                    } else {
                        $('#uploadForm').show();
                    }
                    console.log(count)
                    var t = setTimeout(function () {
                        var urlNew = imgNew.name;
                        var blob = _this.dataURLtoBlob(urlNew);
                        imgformData.append("image", blob, "image" + count + ".png");

                        console.log(imgformData.get('image'))
                    }, 500);

                });
                $('#txt').on('input', function () {
                    var reg = /^\d+(\.)?(\d{1,2})?$/;
                    if (!reg.test($(this).val())) {
                        var _val = $(this).val()
                        var inputval = _val.match(/\d+(\.)?(\d{1,2})?/)
                        inputval = inputval && inputval[0] || '';
                        $(this).val(inputval);
                    }
                })
                $('#imgall').on('click', '.btnX', function () {
                    $(this).parent().remove();
                    $('#uploadForm').show();
                    var delImgsrc = $(this).parent().find('.previmg').attr('src')
                    $.map(imgarr, function (item, index) {
                        if (delImgsrc.indexOf(item) > -1) {
                            imgarr.splice(index, 1)
                            imgformData.get('image').splice(index, 1);
                        }
                    })
                    console.log(imgformData.get('image'))
                    $('#' + upimgvlueID).val(imgarr.join(','));
                    count--;
                })
            },
            dataURLtoBlob: function (dataurl) {
                var arr   = dataurl.split(','),
                    mime  = arr[0].match(/:(.*?);/)[1],
                    bstr  = atob(arr[1]),
                    n     = bstr.length,
                    u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new Blob([u8arr], {
                    type: mime
                });
            },
            txtAreaCount: function () {
                $('#area').on('keyup focus blur', function () {
                    var userAgent = window.navigator.userAgent,
                        ios       = userAgent.match(/(iPad|iPhone|iPod)\s+OS\s([\d_\.]+)/),
                        ios5below = ios && ios[2] && (parseInt(ios[2].replace(/_/g, '.'), 10) < 5),
                        operaMini = /Opera Mini/i.test(userAgent),
                        body      = document.body,
                        div, isFixed;

                    div = document.createElement('div');
                    div.style.cssText = 'display:none;position:fixed;z-index:100;';
                    body.appendChild(div);
                    isFixed = window.getComputedStyle(div).position != 'fixed'; //不支持fixed的会设置成absolute
                    body.removeChild(div);
                    div = null;

                    return !!(isFixed || ios5below || operaMini);
                });
                $('#area').on('input', function (obj) {
                    obj.target.nextElementSibling.innerHTML = 50 - obj.target.value.length;
                })
            },

            /**
             * 退款申请
             */
            applyrefundinit: function () {

                //mock
                // var _mock = {
                //     ordersn: '205455',
                //     totalAmount: '20.00',
                //     deliveryFee: '10.00'
                // }
                // localStorage.setItem('applyrefundinfo', JSON.stringify(_mock))
                var orderData = {
                    ordersn: Util.getQuery('ordersn') + '',
                    totalAmount: Util.getQuery('maxorderfefund') + '',
                    type: 'ordertype'
                }
                var imgarr = [];
                var imgformData = new FormData();
                if (!orderData.ordersn) {
                    jb.toastHandler('无数据')
                    return
                }
                handlebarfn('#tmpl_applyrefund', '#cnt_applyrefund', orderData);
                this.getRefundCauseList(1, 'result');
                this.txtAreaCount();

                this.picupload('imgpaths', imgformData);

                $('.apply').on('click', function (e) {
                    $.ajax({
                        url: UPLOAD_DOMAIN + '/upload/file/multiUpload',
                        type: 'POST',
                        data: imgformData,
                        async: true,
                        cache: false,
                        contentType: false,
                        processData: false,
                        beforeSend: function () {
                            Util.dialog.showLoading();
                        },
                        success: function (data) {

                            if (data.state == 0) {

                                //图片路径
                                data.data.uploadResultList.forEach(function (item) {
                                    imgarr.push(item.materialId);
                                })

                                $('#imgpaths').val(imgarr.join(','))
                            }

                            var _params = {
                                ordersn: orderData.ordersn,
                                reasonid: $('#result').data('value'),
                                memo: $('#area').val(),
                                postsaledsn: orderData.postsaledsn,
                                reason: $('#result').data('text'),
                                picids: $('#imgpaths').val()
                            }
                            if (!_params.reasonid) {
                                jb.toastHandler('请选择退款原因')
                                return
                            }

                            ps.postsaledreCash(_params).then(function (result) {
                                if (typeof result == 'string') {
                                    result = JSON.parse(result)
                                }
                                if (result.state == 0) {
                                    //提交成功
                                    window.location.href = './applysuccess.html?postsaledsn=' + result.data.serviceSn + '&type=1&ordersn=' + orderData.ordersn;
                                } else {
                                    jb.toastHandler(result.msg)
                                }
                            }).fail(function () {
                                jb.toastHandler("请求接口不成功")
                            })

                        },
                        error: function (returndata) {

                        },
                        complete: function () {
                            Util.dialog.hideLoading();
                        }
                    });

                })

            },

            /**
             * 退货退款
             */
            applyreturninit: function () {
                // ordersn	string	true	订单编号
                // goodsid	string	true	商品Id
                // specid	string	false	规格Id，当产品是多规格时必须提供。V1.2增加
                // memo	string	false	问题描述 ( 退货退款时必须 V3.6修改)
                // picids	string	true	文件上传返回的fullfilename列表，用逗号隔开。
                // postsaledsn	string	false	退货售后单编号。如果是重新申请退货，则必填。
                // goodsquantity	string	true	退货数量 (兼容旧版本)
                // reasonid	string	true	退款原因编码；编码通过“退款原因列表获取接口”获取的值。 （V3.6 新增）
                // reason	string	true	退款原因 （V3.6 新增）
                // returntype	string	true	退货退款类型，0：退货退款，1：仅退款（V3.6 新增）
                // goodsstatus	string	false	货物状态，1：已收到货，2：未收到货 ,returntype=1 时必填（V3.6 新增）
                // applyamount	string	false	退款金额（V3.6 新增）
                //mock

                // ordersn: detailobj.orderBaseInfo.orderSN + '', //订单号
                // goodsId: goodsid + '', //商品id
                // specId: goodsinfo[0].goods.specId + '', //规格id
                // specName: goodsinfo[0].goods.specName,
                // goodsName: goodsinfo[0].goods.name, //商品名称
                // goodsCount: goodsinfo[0].count + '', //商品数量
                // logoUrl: goodsinfo[0].goods.smallLogoUrl, //商品图片
                // goodsPrice: goodsinfo[0].goods.price, //商品单价
                // isReshipQuantity: goodsinfo[0].isReshipQuantity + '', //可退货数量
                // maxGoodsRefund: goodsinfo[0].maxGoodsRefund + '', //商品最大可退金额
                // perGoodsRefund: goodsinfo[0].perGoodsRefund + '', //单个商品可退金额
                // goodsDelivery: goodsinfo[0].goodsDelivery + '',   //商品可退运费
                //     // type: 'ordertype' //来自订单标识
                // var _mock = {
                //     ordersn: '', //订单号
                //     goodsId: '', //商品id
                //     specId: '', //规格id
                //     specName: '',
                //     goodsName: '', //商品名称
                //     goodsCount: '', //商品数量
                //     logoUrl: '', //商品图片
                //     goodsPrice: '', //商品单价
                //     isReshipQuantity: '', //可退货数量
                //     maxGoodsRefund: '15.00', //商品最大可退金额
                //     perGoodsRefund: '', //单个商品可退金额
                //     goodsDelivery: '3.00',   //商品可退运费
                //     type: 'ordertype' //来自订单标识
                // }
                // localStorage.setItem('applyreturninfo', JSON.stringify(_mock))

                var orderData = {
                    ordersn: Util.getQuery('ordersn') + '', //订单号
                    goodsId: Util.getQuery('goodsid') + '', //商品id
                    specId: Util.getQuery('specid') + '', //规格id
                    isReshipQuantity: Util.getQuery('isreshipquantity') + '', //可退货数量
                    maxGoodsRefund: Util.getQuery('maxorderfefund') + '', //商品最大可退金额
                    goodsDelivery: Util.getQuery('goodsdelivery') + '', //商品可退运费
                    type: 'ordertype' //来自订单标识
                };
                var imgarr = [];

                var $this = this;
                var _returntype = 1;
                var status = [{
                    id: '2',
                    name: '未收到货'
                },
                    {
                        id: '1',
                        name: '已收到货'
                    }
                ];
                var state = $('#sta').val();
                var id = '';
                var imgformData = new FormData();
                console.log(state)
                if (!orderData.ordersn) {
                    jb.toastHandler('无数据')
                    return
                }
                handlebarfn('#tmpl_applyreturn', '#cnt_applyreturn', orderData);

                var params = {
                    ordersn: Util.getQuery('ordersn'),
                    token: Util.getToken()
                };
                os.getOrderDetail(params)
                    .then(function (data) {

                        jb.loadingHandler('hide');

                        data = (typeof data === 'string') ? JSON.parse(data) : data;

                        if (data.state == 0) {

                            if (!Util.getQuery('combineInfoId')) {//非组合商品过滤

                                data.data.orderInfo.orderBaseInfo.goodsList  = data.data.orderInfo.orderBaseInfo.goodsList.filter(function (item) {

                                    return item.goods.goodsId == orderData.goodsId && item.goods.specId == orderData.specId;
                                });
                            }

                            var orderInfo = data.data.orderInfo.orderBaseInfo;

                            handlebarfn('#tmpl_goodsdetail', '#cnt_goodsdetail', orderInfo, 'replace');

                        }
                        else {
                            jb.toastHandler(data.msg)
                        }
                    }).done(function () {
                });

                this.txtAreaCount();
                $('#sta').mobileAreaSelect({
                    id: 'asd',
                    data: status,
                    separator: ' ',
                    isMaskClose: true,
                    code: 'id',
                    name: "name",
                    level: 1,
                    value: [id],
                    isDefault: true,
                    onChange: function () {
                        state = this.text.join('');
                        id = this.value[0];
                    }
                });
                $this.getRefundCauseList(2, 'result', 'retrungoods');

                $('.cont_l0').on('click', '.no', function (e) {
                    e.stopImmediatePropagation()
                    e.preventDefault();
                    if ($('#res').length) {
                        $('#res').remove();
                    }
                    var _thisRadio = $(this);
                    _returntype = _thisRadio.data('value');
                    console.log(_returntype)
                    $('#result').mobileAreaSelect = null;
                    if (_returntype == 0) {
                        $('.returngoodsrequire').removeClass('none')
                        $('.recivestatus').addClass('none');
                        $('.js-goodsDetails').removeClass('none')
                        $this.getRefundCauseList(3, 'result', 'retrungoods');
                    }
                    if (_returntype == 1) {
                        $('.returngoodsrequire').addClass('none')
                        $('.recivestatus').removeClass('none')
                        $('.js-goodsDetails').addClass('none')
                        $this.getRefundCauseList(2, 'result', 'returnmoney');
                    }
                    _thisRadio.parent().parent().find('.no').removeClass('yes');
                    _thisRadio.addClass('yes');

                })

                var patt = /[\ud800-\udbff][\udc00-\udfff]/g;

                this.picupload('imgpaths', imgformData);
                $('.apply').on('click', function (e) {

                    var _selecttype = $('.cont_l0').find('.yes').data('value')
                    var _params = {
                        ordersn: orderData.ordersn,
                        reasonid: $('#result').data('value'),
                        memo: $('#area').val(),
                        postsaledsn: orderData.postsaledsn || '',
                        reason: $('#result').data('text'),
                        picids: $('#imgpaths').val(),
                        goodsid: orderData.goodsId,
                        specid: orderData.specid,
                        goodsquantity: orderData.isReshipQuantity,
                        returntype: _selecttype,
                        goodsstatus: $('#sta').data('value'),
                        applyamount: $('#txt').val()
                    }
                    if (!!Util.getQuery('combineInfoId')) _params.combineInfoId = Util.getQuery('combineInfoId');
                    console.log(_params)

                    if (!_params.goodsstatus && _selecttype == 1) {
                        jb.toastHandler('请选货物状态')
                        return;
                    }
                    if (!_params.reasonid) {
                        jb.toastHandler('请选择退款原因')
                        return;
                    }
                    if (!_params.applyamount) {
                        jb.toastHandler('请输入退款金额')
                        return;
                    }
                    if (parseFloat(_params.applyamount) > parseFloat(orderData.maxGoodsRefund)) {
                        jb.toastHandler('申请退款金额太大')
                        return;
                    }
                    if (_params.memo == "" && _params.returntype == 0) {
                        jb.toastHandler('描述说明不能为空')
                        return;
                    }
                    if (patt.test(_params.memo)) {
                        jb.toastHandler('不能输入表情符号')
                        return;
                    }
                    if ($('.previmg').length == 0 && _params.returntype == 0) {
                        jb.toastHandler('请上传凭证')
                        return;
                    }

                    $.ajax({
                        url: UPLOAD_DOMAIN + '/upload/file/multiUpload',
                        type: 'POST',
                        data: imgformData,
                        async: true,
                        cache: false,
                        contentType: false,
                        processData: false,
                        beforeSend: function () {
                            Util.dialog.showLoading();
                        },
                        success: function (data) {
                            if (data.state == 0) {

                                //图片路径
                                data.data.uploadResultList.forEach(function (item) {
                                    imgarr.push(item.materialId);
                                })

                                $('#imgpaths').val(imgarr.join(','))
                            }

                            _params.picids = $('#imgpaths').val();

                            ps.postsaledreGoods(_params).then(function (result) {
                                if (typeof result == 'string') {
                                    result = JSON.parse(result)
                                }
                                if (result.state == 0) {
                                    //提交成功
                                    window.location.href = './applysuccess.html?postsaledsn=' + result.data.serviceSn + '&ordersn=' + result.data.orderSn + '&isToHome=' + Util.getQuery('isToHome') + '&type=2';
                                } else {
                                    jb.toastHandler(result.msg)
                                }
                            }).fail(function () {
                                jb.toastHandler("请求接口不成功")
                            })

                        },
                        error: function (returndata) {

                        },
                        complete: function () {
                            Util.dialog.hideLoading();
                        }
                    });

                })

            },
            applysuccess: function () {

                var _type = Util.getQuery('type');
                var _ordersn = Util.getQuery('ordersn');
                if (_type == 1) {
                    $('.header span').html('申请退款');
                }
                if (_type == 2) {
                    $('.header span').html('申请退货退款');
                }
                $('.go-back').click(function () {
                    // isToHome 是否店铺订单  0 否 1是
                    var isToHome = Util.getQuery('isToHome');
                    if (isToHome == 1) { //小店订单详情
                        window.location.href = WEB_CONFIG.global.WEB_PATH + '/qrqd/orderDetailTohome.html?ordersn=' + _ordersn;
                    } else if (isToHome == 0) { //平台订单详情
                        window.location.href = WEB_CONFIG.global.WEB_PATH + '/qrqd/orderDetailOnline.html?ordersn=' + _ordersn;
                    }
                });
                $('.look').click(function () {
                    window.location.href = './postorder-detail.html?postsaledsn=' + Util.getQuery('postsaledsn') + '&type=' + Util.getQuery('type');
                });
                $('.back').click(function () {
                    window.location.href = WEB_CONFIG.global.H5_DOMAIN + '/life/index.html?env=' + WEB_CONFIG.global.ENV;
                });
            },
            /**
             * wap显示头部导航

             */

            /**
             * 初始化
             */
            init: function () {
                this.listScroll();
                this.getPostorderList('postlist');
            }
        }
        return PostorderController;
    });
