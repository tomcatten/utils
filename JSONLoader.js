/**
 * Lazy JSON Loader 包含 Cache 和请求锁功能的JSON加载器
 * 请求锁用于处理某JSON请求还没返回，就再次请求的问题
 */

var LazyJSONLoader = function() {}

LazyJSONLoader.prototype = {
    cache: {},
    queue: {},

    /**
     * Get JSON Data
     * 获取JSON数据
     *
     * Parameter
     *      url: JSON URL地址
     *      cb: Callback 函数参数
     */

    getJSON: function(url, cb, errorCallback) {
        var self = this;
        if (typeof(this.cache[url]) != "undefined") {
            cb(this.cache[url]);
        } else {
            if (typeof(self.queue[url]) == "undefined") self.queue[url] = [];
            self.queue[url].push(cb);

            if (self.queue[url].length > 1) {
                return false;
            } else {
                $.getJSON(url, function(data) {
                    self.cache[url] = data;
                    for (var cb; cb = self.queue[url].shift();) {
                        cb(data);
                    }
                }).error(function() {
                    self.queue[url] = [];
                    if (typeof errorCallback != "undefined") {
                        errorCallback();
                    }
                });
            }
        }
    }
};