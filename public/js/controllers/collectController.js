/**
 *
 */

define('collectController', ['collect'], function (collect) {

    var ls = new collect();
    var collectController = function () {};

    collectController.prototype = {

        init: function () {
            var _this = this;
            $('.js-footer').on('click', function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                var data = {
                    atts: [{
                        n: "abbreviation",
                        v: "THS1"
                    }, {
                        n: "eventname",
                        v: "100014"
                    }, {
                        n: 'index',
                        v: '0'
                    }]
                };
               ls.setlogcollect(data);
            })
        }

    };

    return collectController;
});



