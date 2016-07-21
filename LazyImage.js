/**
 * 图片lazyload
 */
var LazyImage = (function() {

    function LazyImage(config) {
        this.config = {
            distance: 200,
            defaultImg: 'http://static.hdslb.com/images/v3images/img_loading.png',
            mode: 'wrap'
        };
        for (var key in this.config) {
            if (config && config.hasOwnProperty(key)) {
                this.config[key] = config[key];
            }
        }
        this.covers = [];
        this._selector = '[data-img]';
        this.wrapper = '<div class="img-loading"></div>';
        this.init();
    };

    LazyImage.prototype.lazy = function(container, callback) {
        var self = this;
        $(container).find(this._selector).each(function(i, e) {
            var ele = $(e);
            if (typeof ele.attr('loaded') == 'undefined' || ele.attr('loaded') == null) {
                self.covers.push({
                    element: ele,
                    callback: callback
                });
            }
        });
        this.show();
    };

    LazyImage.prototype.init = function() {
        var self = this;
        $(window).on('scroll.lazyimage', function() {
            self.show();
        });
    };

    LazyImage.prototype.show = function() {
        var self = this;
        for (var i = 0; i < this.covers.length; i++) {
            var cover = this.covers[i],
                ele = cover.element,
                callback = cover.callback;
            if (ele.attr('loaded')) continue;
            if (this.config.mode == 'wrap' && !ele.parent('.img-loading').length) {
                ele.attr('src', 'http://static.hdslb.com/images/transparent.gif');
                ele.wrap(this.wrapper).parent().css({
                    background: '#f5f5f5 url(http://static.hdslb.com/images/v3images/img_loading.png) center center no-repeat',
                    height: '100%'
                });
            } else if (this.config.mode != 'wrap') {
                ele.attr('src', this.config.defaultImg);
            }
            if (this._inViewRange(ele)) {
                this.load(ele, callback);
                this.covers.splice(i, 1);
                i--;
            }
        }
    };

    LazyImage.prototype.load = function(ele, callback) {
        var self = this,
            img = $('<img />'),
            src = ele.attr('data-img'),
            start = new Date(),
            _retry = 0,
            _maxRetry = 2;
        img.on('load', function() {
            var end = new Date();
            var duration = end - start < 200 ? 0 : 200;
            self.unwrap(ele);
            ele.attr({
                'src': src,
                'data-img': ''
            });
            if (ele.attr('data-alt')) {
                ele.attr('alt', ele.attr('data-alt'));
                ele.removeAttr('data-alt');
            }
            if (callback && typeof callback == "function") {
                callback(ele);
            }
            ele.css('opacity', 0).animate({
                "opacity": 1
            }, duration);
        });
        img.attr('src', src);
        if (ele.attr('alt')) {
            ele.attr('data-alt', ele.attr('alt'));
            ele.removeAttr('alt');
        }
        ele.attr('loaded', 'loaded');

        img.error(function() {
            _retry++;
            if (_retry <= _maxRetry) {
                img.attr('src', src);
            } else {
                self.unwrap(ele);
            }
        });
    };
    LazyImage.prototype.unwrap = function(ele) {
        if (this.config.mode == 'wrap' && ele.parent('.img-loading').length) {
            ele.unwrap(this.wrapper);
        }
    };

    LazyImage.prototype._inViewRange = function(ele) {
        return ele.offset().top + ele.outerHeight(true) > $(window).scrollTop() - this.config.distance && ele.offset().top < $(window).scrollTop() + $(window).height() + this.config.distance && ele.offset().left + ele.outerWidth(true) >= $(window).scrollLeft() - this.config.distance && ele.offset().left <= $(window).scrollLeft() + $(window).width() + this.config.distance;
    };

    return LazyImage;
})();