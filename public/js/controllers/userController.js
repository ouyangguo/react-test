/**
 * 用户中心
 * Created by jahon on 2016/10/27.
 */

define('userController', ['userService', 'handlebars', 'livequery', 'iscroll', 'jsbridge', 'dialog', 'unveil'],
    function (UserService, Handlebars, livequery, IScroll, jsbridge) {

        var userService = new UserService();
        var jb = new jsbridge();


        var isedit = true;// true=右上角为"编辑  false=右上角为"完成"
        var selectedId = [];
        var UserController = function () {};

        UserController.prototype = {
            init: function () {

                this.setTabNavi();
                this.setDelete();
                this.getList(this.setListParams({stype: 1, type: 2, tid: 'mypost'}))
                this.listScroll();

                this.removeEditStatus();
                //注册刷新事件
                jb.addObserver('publishPostFinished', 'postlistUpdate')
                //设置右上角
                this.registerJsHandler();
                //jb.topbarHandler('right', '', '编辑', 'showMultDelete');
                // this.deletePost4Batch();

            },

            /**
             *  设置tab
             */
            setTabNavi: function () {
                var _this = this,
                    $nav  = $('.tab-nav');

                $nav.delegate('.tab-item', 'click', function (e) {
                    e.stopImmediatePropagation();
                    if (isedit) {

                        _this.removeEditStatus();

                        var status      = 'selected',
                            $this       = $(this),
                            tab         = $this.data('tab'),
                            type        = $this.data('type'),
                            stype       = $this.data('stype'),
                            $tabContent = $('.tab-content'),
                            $tabNavs    = $('.tab-nav').find('.tab-item');

                        if ($this.hasClass(status)) return;

                        $tabNavs.filter('.selected').removeClass(status);
                        $this.addClass(status);

                        $tabContent.filter('.selected').removeClass(status);
                        var tid = $tabContent.filter('.' + tab).addClass(status).attr('id');

                        //重置选择状态
                        _this.resetDeletePop()

                        // fetch list
                        var options = _this.setListParams({type: type, stype: stype, tid: tid});

                        options.$target && options.$target.children().length < 1
                        && _this.getList(options);

                        //refresh scroll

                        window.ListScrollers && (window.ListScrollers[tid].selectedItem = tid);
                        _this.refreshWrapper(tid);
                    }

                });

            },

            /**
             * 绑定删除
             */
            setDelete: function () {

                var _this     = this,
                    $list     = $('.tab-content'),
                    $pop      = $('.pop'),
                    $postWarp = $('.wrapper'),
                    $footer   = $('.footer');
                var hasJoinInCorp = Util.getQuery('isjoined');

                $list.livequery(function () {

                    $(this).delegate('.item', 'click', function (e) {
                        e.preventDefault();
                        //e.stopImmediatePropagation();

                        if ($(e.target).hasClass('other')) {

                            return
                        }

                        //我的帖子跳转到详情页
                        // if ($(this).hasClass('mypost')) {

                        //已加入企业
                        if (hasJoinInCorp == 1) {
                            if (isedit) {
                                _this.web2PostsDetail($(this));

                            }

                        } else {
                            $.dialog({
                                contentHtml: '此功能暂未开通，敬请期待',
                            })

                        }
                        // }

                    });
                    $(this).delegate('.item .other', 'click', function (e) {
                        e.preventDefault();
                        // e.stopImmediatePropagation();

                        //没加入企业
                        if (hasJoinInCorp == 0) {
                            $.dialog({
                                contentHtml: '此功能暂未开通，敬请期待',
                            })

                            return

                        }

                        if (_this.checkEditStatus()) {
                            return
                        }

                        $pop.removeClass('none');

                        _this.setEditStatus();
                        selectedId[0] = $(this).parents('.item').data('noticeid')

                        console.log(selectedId);

                        // _this.refreshWrapper();

                    });
                    //单选
                    $(this).delegate('.item .check-label', 'click', function (e) {

                        e.preventDefault();

                        $(this).toggleClass('selected');

                        var $input    = $(this).next('input'),
                            isChecked = $input.prop('checked'),
                            checked   = 'checked';

                        if (isChecked) {
                            $input.removeProp(checked)
                        } else {
                            $input.prop(checked, checked);
                        }

                    });

                });

                $pop.find('.delete').on('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    //删除单条帖子
                    $pop.addClass('none');
                    $.dialog({
                        type: 'confirm',
                        contentHtml: '是否确认删除？一经删除，<br>将不能恢复。',
                        onClickOk: function () {

                            //批量删除
                            _this.deletePost4Batch(selectedId, $list.filter('.selected'), 'single');
                            _this.removeEditStatus();
                            $pop.addClass('none');

                        },
                        onClickCancel: function () {

                            $pop.addClass('none');
                            //_this.resetDeletePop()
                            _this.removeEditStatus();

                        }
                    })

                    // $postWarp.removeClass('post-list').addClass('edit-list');
                    // $footer.removeClass('none');
                    // $pop.addClass('none');

                });

                $pop.find('.cancel').on('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    $pop.addClass('none');
                    _this.removeEditStatus();

                });

                //全选
                $('#slt-all').on('touchstart', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var selected = 'selected',
                        $labels  = $list.filter('.selected').find('.check-label');

                    if (!$(this).hasClass(selected)) {
                        $(this).addClass(selected);
                        $labels.addClass(selected)
                    } else {
                        $(this).removeClass(selected);
                        $labels.removeClass(selected)
                    }

                });

                //删除操作
                $('.del-btn').on('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    //获取选中的帖子
                    var checkboxies = $list.filter('.selected').find('form').find('.check-label')
                        .filter('.selected')
                        .next('input[type="checkbox"]');

                    var noticeIds = $.map(checkboxies, function (item) {return (item.value)});

                    // console.log(noticeIds)

                    if (!noticeIds.length) {
                        $.dialog({
                            // type: 'confirm',
                            contentHtml: '你还没选中帖子',
                        })

                        return
                    }

                    $.dialog({
                        type: 'confirm',
                        contentHtml: '是否确认删除？一经删除，<br>将不能恢复。',
                        onClickOk: function () {

                            //批量删除
                            _this.deletePost4Batch(noticeIds, $list.filter('.selected'), 'multi');
                            _this.removeEditStatus();

                        },
                        onClickCancel: function () {

                            _this.resetDeletePop()
                            _this.removeEditStatus();

                        }
                    })

                });

            },
            resetDeletePop: function () {

                $('.footer').addClass('none');
                $('.wrapper').addClass('post-list').removeClass('edit-list');

                //重置还原选择
                $('.check-label').removeClass('selected');
            },

            /**
             * 企业-通知，同事帮列表, 帖子列表（合在一起处理）
             */
            getList: function (options) {

                var _this             = this,
                    tmplNotice        = options.$tmpl,
                    tmplNoticeCompier = Handlebars.compile(tmplNotice),
                    tmplNoticeList    = options.$target;

                //分部视图
                Handlebars.registerPartial("partial-bank", $("#tmpl-partial-bank").html());
                Handlebars.registerHelper('htmlEscape', function (string) {
                    return new Handlebars.SafeString(string)
                });

                var model = {data: {}};

                // type 1通知，2同事帮

                $.extend(model.data, _this.setDefaultParams());
                $.extend(model.data, options.params || {});

                if (!tmplNoticeList) {

                    return;
                }

                var originData, msg = '', icon = '', btnName = '';
                switch (options.params.stype) {
                    case 1:
                        originData = userService.getNoticeList(model);

                        btnName = '发表帖子';
                        icon = '../images/icon_bank_notice.png';
                        msg = '生活不止眼前和苟且<br>还有诗和远方';
                        break;
                    case 2:
                        originData = userService.getPostsList(model);

                        btnName = '查看帖子';
                        icon = '../images/icon_bank_reply.png';
                        msg = '我们之间的距离<br>隔着一个回复';
                        break;
                }

                window.ListScrollers && (window.ListScrollers[options.params.tid].fetchStatus = 1);

                originData && originData.then(function (result) {

                    if (result.state == 0) {

                        // result.data.list = [];

                        if (!result.data.list.length) {

                            var tmlpBank = $("#tmpl-partial-bank").html();
                            var tmplBankCompier = Handlebars.compile(tmlpBank);

                            tmplNoticeList.html(tmplBankCompier({
                                message: msg,
                                icon: icon,
                                name: btnName,
                                stype: options.params.stype
                            }));

                            //
                            _this.web2PostsPublish();

                            return;
                        }

                        $.map(result.data.list, function (item) {

                            var op      = {
                                    date: item.publishDate || item.replyDate,
                                    number: item.viewNum
                                },
                                fNotice = _this.formatNotice(op);

                            item.photo = item.photos.split(/,/);
                            item.publishDate = item.publishDate || item.replyDate;
                            // item.viewNum = fNotice.number;
                            item.hasThumb = !!item.photos && (item.photos.length > 0);

                            // console.log()

                            if (item.forumDetail) {
                                item.forumDetail.hasPhoto = true;
                                item.forumDetail.noticePhoto = item.forumDetail.photos && item.forumDetail.photos.split(',').shift();
                            } else {
                                item.forumDetail = {hasPhoto: false}
                            }

                            return item
                        })

                        result.data.qs = Util.getQueryString();

                        // console.log(result)

                        tmplNoticeList.append(tmplNoticeCompier(result.data));

                    } else {
                        // Util.dialog.showMessage(result.msg)

                        jb.toastHandler(result.msg);
                    }

                    return result.data
                })
                    .then(function (data) {

                        data && $('#' + model.data.tid)
                            .data('total', data.total)
                            .data('islastPage', data.islastPage);

                        _this.updatePageInfo({
                            total: (data && data.total) || 1000,
                            tid: model.data.tid,
                            typeName: model.data.tid,
                            islastPage: (data && data.islastPage) || 0
                        })

                    })
                    .then(function () {

                        // console.log(model)
                        // _this.lazyLoad();

                        _this.refreshWrapper(model.data.tid);

                    })
                    .done(function () {

                        window.ListScrollers && (window.ListScrollers[options.params.tid].fetchStatus = 0);
                        console.log('done')
                    });
            },

            listScroll: function () {
                window.ListScrollers = {};
                window.ListPages = {};
                var _this        = this,
                    scrollers    = [],
                    $wrappers    = $('.wrapper'),
                    $tabContents = $('.tab-content');

                $wrappers.each(function (index) {

                    var _thisScroll = scrollers[index],
                        tid         = $(this).attr('id'),
                        // total       = !!$(this).data('total') || 10000,
                        temp        = {},
                        temp2       = {};

                    _thisScroll = new IScroll('#' + tid, {
                        mouseWheel: true,
                        click: true,
                        tap: true,
                        eventPassthrough: false,
                        preventDefault: false
                    })
                    ;

                    _thisScroll.on("scrollEnd", function () {

                        // _this.lazyLoad();

                        //判断是否上拉加载分页数据
                        var $wrapper = $(this.wrapper),
                            wHeight  = $wrapper.height(),
                            sHeight  = $wrapper.find('.scroller').height();

                        if (this.y < 0 &&
                            this.y < (sHeight - wHeight) &&
                            (wHeight - this.y + 100) > sHeight
                        ) {

                            // console.log(tid)
                            //done
                            var cp = ListPages[ListScrollers[tid].selectedItem];
                            var cs = ListScrollers[tid];

                            // console.log(cp, cs)

                            if (cp.islastPage == 0 && cs.fetchStatus == 0) {


                                // fetch list

                                var options = _this.setListParams({type: cp.type, stype: cp.stype, tid: tid});
                                options.$target && _this.getList(options);

                            } else {
                                //done
                                // Util.dialog.showMessage('已经最后一页了.');
                            }
                        } else {
                            _this.refreshWrapper(tid)
                        }
                    });

                    //全局scroller
                    temp[tid] = {
                        scroller: _thisScroll,
                        selectedItem: 'mypost',
                        /*ajax请求状态*/
                        fetchStatus: 0
                    }
                    $.extend(window.ListScrollers, temp);

                    //分页信息,默认0开始
                    //temp2[cid] = {total: total, pageNo: 0, pageSize: 10};

                    //$.each($tabContents, function () {
                    var obj = {};

                    obj[tid] = {
                        islastPage: $(this).data('islastPage') || 0,
                        total: $(this).data('total') || 10000,
                        pagenum: 1,
                        pagesize: 10,
                        type: 2,
                        stype: $(this).data('stype'),
                        tid: tid,
                        typeName: tid,
                        selected: $(this).hasClass('selected')
                    }
                    $.extend(window.ListPages, obj);

                    if ($(this).hasClass('selected')) {
                        temp[tid].selectedItem = tid;
                    }

                    // })

                    // $.extend(window.ListPages, temp2);

                });

                document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

            },
            updatePageInfo: function (options) {

                var pageInfo = window.ListPages && window.ListPages[options.typeName];

                if (pageInfo) {

                    pageInfo.total = options.total;
                    pageInfo.islastPage = options.islastPage;
                    (pageInfo.islastPage == 0) && pageInfo.pagenum++;

                    // (pageInfo.pagenum < (pageInfo.total)) && pageInfo.pagenum++;
                }

                window.ListPages[options.typeName] = pageInfo;
                return pageInfo;
            },

            refreshWrapper: function (tid) {

                window.ListScrollers && window.ListScrollers[tid].scroller.refresh();
            },

            /**
             * 图片延迟加载
             */
            lazyLoad: function () {
                // $(".imgbox img").livequery(function () {
                //
                //     $(this).unveil(200, function () {
                //
                //         $(this).removeClass('unveil-img')
                //     });
                // })
            },

            /**
             * 我的帖子删除
             * @param options
             */
            deletePost: function (options) {
                var _this = this,
                    tabid = options.$list.attr('id'),
                    param = {};

                //forumid
                // options = {
                //     $list: '',
                //     type: 'single',//single,multi
                //     tid: '',
                //     params: {
                //         forumid: 111
                //     }
                // }
                console.log('options=', options);
                var model = {data: {}};

                $.extend(model.data, _this.setDefaultParams(), param);

                var originData = {};
                if (tabid == 'mypost') {
                    model.data.forumid = options.params.forumid;
                    originData = userService.deletePosts(model);
                } else if (tabid == 'myreply') {
                    model.data.replyid = options.params.forumid;

                    originData = userService.deleteMyReply(model);

                }

                return originData && originData
                        .then(function (result) {

                            if (result.state == 0) {

                                //remove dom
                                options.$list.find('.n' + options.params.forumid).remove();

                                if (options.$list.find('.item').length == 0) {
                                    window.location.reload(true)
                                }

                            } else {
                                jb.toastHandler(result.msg);
                            }
                        })
                        .fail(function () {
                            console.log('删除失败', options);
                        })

            },

            /**
             * 批量删除帖子
             * @param ids
             * @param $list
             * @param type
             */
            deletePost4Batch: function (ids, $list, type) {
                var _this = this;
                //
                // var tid, $list, type;
                //
                // var ids         = [132, 3, 4];
                var promiseList = [];

                $.each(ids, function (index, id) {
                    var options = {
                        $list: $list,
                        type: type,//single,multi
                        params: {
                            forumid: id
                        }
                    }
                    promiseList.push(_this.deletePost(options))
                })

                $.when(promiseList).done(function (data) {
                    _this.refreshWrapper($list.attr('id'))
                    _this.resetDeletePop()

                })

            },

            /**
             * 格式化
             */
            formatNotice: function (options) {
                //data
                //2016//1/0/ 20: 1:7:
                // var options = {
                //     date: "2016-10-22 08:58:00",
                //     number: 2300
                // }

                //格式化时间
                var now               = new Date(),
                    currentTimeStramp = now.getTime(),
                    origrnTime        = new Date(Util.formatDate2(options.date, 'yyyy-MM-dd hh:mm:ss')),
                    origrnTimeStramp  = origrnTime.getTime(),
                    during            = currentTimeStramp - origrnTimeStramp,
                    baseHour          = 60 * 60 * 1000,
                    s                 = '';

                if (!during) {
                    s = options.date
                } else {
                    if (during < baseHour) {
                        s = Math.floor(during / 60 / 1000) + '分钟前';
                    } else if (during < baseHour * 24) {
                        s = Math.floor(during / 60 / 60 / 1000) + '小时前';
                    }
                    else if (during < baseHour * 24 * 2) {
                        s = '昨天';
                    } else {

                        s = Util.formatDate2(options.date, 'MM-dd')
                    }
                }

                //格式化数字

                var n = parseInt(options.number);

                if (n > 999) {
                    n = ( n / 1000).toFixed(2) + 'k';
                } else if (n > 9999) {
                    n = ( n / 10000).toFixed(2) + 'w';
                }
                // console.log(n)

                return {
                    date: s,
                    number: n
                };
            },

            /**
             * 检查是否编辑状态
             */
            checkEditStatus: function () {

                return !!sessionStorage.getItem('isEdit');
            },
            setEditStatus: function () {
                sessionStorage.setItem('isEdit', true);
            },
            removeEditStatus: function () {
                sessionStorage.clear('isEdit');
            },

            /**
             * 设置通知列表请求参数
             * @param options
             * @returns {{$target: *, params: *}}
             */
            setListParams: function (options) {

                //tab容器
                var $mynoticeList = $('#mynotice-list'),
                    $myreplyList  = $('#myreply-list'),
                    tmplNotice,
                    $target,
                    tid;

                switch (options.stype) {
                    case 1:
                        tid = 'mypost';
                        $target = $mynoticeList;
                        tmplNotice = $("#tmpl-postlist").html();
                        break;
                    case 2:
                        tid = 'myreply';
                        $target = $myreplyList;
                        tmplNotice = $("#tmpl-replylist").html();
                        break;
                }

                var pageInfo = window.ListPages && window.ListPages[tid];

                return {
                    $target: $target,
                    $tmpl: tmplNotice,
                    params: $.extend({
                        tid: tid,
                        optype: 2,
                        pagesize: pageInfo && pageInfo.pagesize || 10,
                        pagenum: pageInfo && pageInfo.pagenum || 1
                    }, options)
                }
            },

            /**
             * 设置url query
             * @returns {{userid: (*|string|number), token: (*|string|string)}}
             */
            setDefaultParams: function () {
                return {
                    token: Util.getQuery('token'),
                    t_id: +new Date()
                }
            },

            /**
             * 发帖-查看帖子
             */
            web2PostsPublish: function () {

                $('.comm-btn').livequery('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var stype = $(this).data('stype');

                    if (stype == 1) {

                        jb.routerHandler(WEB_CONFIG.nativePage.clife.postsPublish.id);

                    } else if (stype == 2) {

                        var url = location.origin + '/life/assets/pages/clife/index.html?' + Util.getQueryString();
                        var params = {
                            url: url
                        }

                        console.log(params)

                        jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params), url);
                    }

                });

            },

            /**
             * 帖子详情
             */
            web2PostsDetail: function ($target) {

                if (this.checkEditStatus()) {
                    return
                }

                var url = location.origin + '/life/assets/pages/clife/' + $target.data('href');
                var params = {
                    url: url
                }

                console.log(params)

                jb.routerHandler(WEB_CONFIG.nativePage.extModule.extWap.id, JSON.stringify(params), url);

                return false

            },

            /**
             * 注册右上角点击事件
             */
            registerJsHandler: function () {
                var _this = this;

                window.WebViewJavascriptBridge.registerHandler('showMultDelete', function (data, responseCallback) {
                    // data = $.parseJSON(data);
                    //alert(JSON.stringify(data));
                    var $list     = $('.tab-content'),
                        $pop      = $('.pop'),
                        $postWarp = $('.wrapper'),
                        $footer   = $('.footer');
                    if (isedit) {
                        //显示批量删除
                        $postWarp.removeClass('post-list').addClass('edit-list');
                        $footer.removeClass('none');
                        $pop.addClass('none');

                        //设置右上角
                        jb.topbarHandler('right', '', '完成', 'showMultDelete');
                        isedit = false;

                    } else {
                        //隐藏批量删除
                        _this.resetDeletePop()
                        //设置右上角
                        jb.topbarHandler('right', '', '编辑', 'showMultDelete');
                        isedit = true;
                    }
                });
                window.WebViewJavascriptBridge.registerHandler('postlistUpdate', function (data, responseCallback) {
                    location.reload()
                });


            }

        };

        return UserController;
    });