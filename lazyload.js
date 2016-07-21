var lazyLoadContents = [];

function LazyLoad(options) {
    if (typeof(options.render) == "undefined") return;
    var obj = {
        /**
         *  url: string                         数据加载地址 以&page=结尾
         *  xhrParams: function() { return object; }    返回数据加载ajax参数
         *  target: string(jQuery selector)     目标数据Container
         *  offsetTop: int/function() { return int; } 相对于滚动条所属容器（默认window）的offsetTop
         *  distance: int                       离底部多少距离开始load下一批数据
         *  autoLoad: Boolean or int             是否随滚动条自动加载 or 自动加载n次后开始手动加载
         *  showPageAfter: int                  加载n次后显示分页
         *  render: function(data) : String(html)
         *  renderCallback: function(object, data)      渲染后回调
         *  onInit                              初始化完成后回调
         *  beforeLoad                          加载数据前触发的回调
         *  onScroll: function() : Boolean      判定是否允许读取数据
         *  onComplete: function(data)          完成后回调
         *  onData: function() : Boolean        判定是否仍有数据
         *  state: string(jQuery selector)      加载状态Container
         *  noDataPrompt: string                无更多数据提示信息
         *  onShowPage: function                显示分页时的回调
         */
        options: {
            url: null,
            xhrParams: {},
            wrapper: options.wrapper || $(window),
            target: null,
            offsetTop: 0,
            distance: 50,
            autoLoad: true,
            showPageAfter: null,
            pageContainer: null,
            onInit: function() {},
            render: function(data) {},
            onScroll: function() {
                return false;
            },
            renderCallback: function(object, data) {},
            beforeLoad: function() {},
            onComplete: function(data) {},
            onData: null,
            state: null,
            noDataPrompt: null,
            onShowPage: null
        },
        page: 0,
        num: 0, //当前分页加载了n次数据
        autoNum: 0,
        totalPage: 1,
        showPages: 1,
        totalResults: 0,
        manualLoad: false,
        waitManualOperate: false,
        xhrParams: function() {
            return {};
        },
        _busying: false,
        _debug: false,
        _destroyed: false,
        setOption: function(key, value) {
            if(typeof key == 'object') {
                return $.extend(true, this.options, key);
            } else if (this.options[key] !== undefined) {
                this.options[key] = value;
            }
        },
        init: function() {
            var _this = this;
            if (typeof options != 'object') {
                return;
            }
            for (var k in this.options) {
                if (options.hasOwnProperty(k)) {
                    this.options[k] = options[k];
                }
            }
            this.options._super = this;
            this.options.onData = this.options.onData || function() {
                return _this.page < _this.totalPage;
            };
            this.target = this.options.target = $(this.options.target);
            this.options.wrapper = $(this.options.wrapper);
            this.options.state = $(this.options.state);
            if (!this.options.state.parent().length) {
                this.options.state.appendTo(this.options.target);
            }
            if (this._debug) {
                console.log("lazyLoad: add lazyLoader " + this.options.xhrParams.url, "current counts: ", lazyLoadContents.length);
            }
            if (this.options.autoLoad !== false) {
                this.options.wrapper.on("scroll", function() {
                    _this.scroll();
                });
                if (typeof this.options.autoLoad == 'number') {
                    this.options.state.on('click', function() {
                        if (_this.autoNum >= _this.options.autoLoad) {
                            _this.autoNum = 0;
                        }
                        _this.load();
                    });
                } else {
                    this.options.state.on('click', function() {
                        _this.load();
                    });
                }
            } else {
                this.waitManualOperate = true;
                this.options.state.on('click', function() {
                    _this.load();
                });
            }
            this.options.onInit.call(this);
        },
        empty: function() {
            this.options.target.empty();
            if (!this.options.state.parent().length) {
                this.options.state.appendTo(this.options.target);
            }
        },
        abort: function() {
            this.ajaxRequest && this.ajaxRequest.abort();
            this._busying = false;
        },
        free: function() {
            this.abort();
            this._destroyed = true;
            for (var i = 0; i < lazyLoadContents.length; i++) {
                if (lazyLoadContents[i] == this) {
                    lazyLoadContents.splice(i, 1);
                    break;
                }
            }
        },
        reload: function() {
            this.abort();
            this.page = 0;
            this.load();
        },
        load: function() {
            var _this = this;
            var options = this.options;
            if (this._busying) return;
            if (this._destroyed) return;

            //console.log("Show page",this.page,"/",this.totalPage,"/",Math.ceil(this.page/options.showPageAfter));

            if (typeof(options.showPageAfter) != "undefined" &&
                ((this.showPages > 1 && this.page >= options.showPageAfter) || (options.showPageAfter === 1 && this.totalPage > 1))) {
                if (this.page % options.showPageAfter == 0 && this.page != 0 && !this.manualLoad) {
                    this.waitManualOperate = true;
                    options.state.hide();
                    return;
                }
            }

            this.manualLoad = false;
            this.waitManualOperate = options.autoLoad === false ? true : false;
            this._busying = true;

            options.beforeLoad.call(this);

            this.page++;
            this.num++;
            this.autoNum++;
            if (this._debug) {
                console.log("loading page: " + this.page + " (URL: " + options.xhrParams.url + this.page + ")");
            }
            var xhrParams = $.extend(true, this.xhrParams.call(this), this.options.xhrParams);
            if (xhrParams) {
                var success = xhrParams.success,
                    error = xhrParams.error;
                xhrParams.success = function(data) {
                    _this._busying = false;
                    if (success) {
                        success.call(_this, data);
                    }
                    if (typeof options.autoLoad == 'number' && _this.autoNum >= options.autoLoad) {
                        _this.waitManualOperate = true;
                    }
                    options.onComplete.call(_this, data);
                };
                xhrParams.error = function(jqXHR, textStatus) {
                    if (error) {
                        error.call(_this, jqXHR, textStatus);
                    }
                };
            }
            this.ajaxRequest = $.ajax(xhrParams);
        },
        render: function(data) {
            var options = this.options;
            for (var i in data) {
                if (typeof(data[i]) != "object" || !i.match(/^[0-9]+$/)) continue;
                var rendObj = $(options.render(data[i]));
                if (options.target[0] == options.state.parent()[0]) {
                    rendObj.insertBefore(options.state);
                } else {
                    rendObj.appendTo(options.target);
                }
                if (typeof(options.renderCallback) != "undefined") {
                    options.renderCallback(rendObj, data[i]);
                }
            }
        },
        scroll: function() {
            if (this.waitManualOperate) {
                return false;
            }
            var offsetTop;
            if (typeof this.options.offsetTop == 'function') {
                offsetTop = this.options.offsetTop.call(this);
            } else {
                offsetTop = this.options.offsetTop;
            }
            if (this.options.target.css('display') != 'none' && this.options.wrapper.scrollTop() + this.options.distance >= offsetTop + this.options.target.height() - this.options.wrapper.height() && !this._busying && !this.finish) {
                if (this.options.onScroll.call(this)) {
                    if (this.options.onData.call(this)) {
                        this.load();
                    }
                }
            }
        },
        showPage: function() {
            var _this = this;
            var options = this.options;
            var curPage = Math.ceil(this.page / options.showPageAfter);
            if (this._debug) {
                console.log("Current show page: " + curPage + "  data page: " + this.page);
            }
            this._trigger('onShowPage', $(options.pageContainer), curPage, Math.ceil(this.totalPage / options.showPageAfter), this.totalResults, function(_page) {
                _this.num = 0;
                _this.autoNum = 0;
                _this.manualLoad = true;
                _this.page = (_page - 1) * options.showPageAfter;
                _this.empty();
                _this.load();
            });
        },
        _trigger: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            var handler = args.shift();
            if (this.options[handler]) {
                return this.options[handler].apply(this, args);
            }
        }
    };
    lazyLoadContents.push(obj);
    return obj;
}