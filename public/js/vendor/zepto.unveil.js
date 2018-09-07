;(function (t) {
    t.fn.unveil = function (i, e) {
        var n = t(window), r = i || 0, o = window.devicePixelRatio > 1, u = o ? "data-src-retina" : "data-src", s = this, l;
        this.one("unveil", function () {
            var t = this.getAttribute(u);
            t = t || this.getAttribute("data-src");
            if (t) {
                this.setAttribute("src", t);
                if (typeof e === "function")e.call(this)
            }
        });
        function a() {
            var i = s.filter(function () {
                var i = t(this);
                if (i.is(":hidden"))return;
                var e = n.scrollTop(), o = e + n.height(), u = i.offset().top, s = u + i.height();
                return s >= e - r && u <= o + r
            });
            l = i.trigger("unveil");
            s = s.not(l)
        }

        n.on("scroll.unveil resize.unveil lookup.unveil", a);
        a();
        return this
    }
})(window.jQuery || window.Zepto);