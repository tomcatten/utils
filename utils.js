/**
*
*平时积累的util工具，有很多很实用的方法
*
**/

// 为ie8补全indexOf
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(ele) {
        var i, len = this.length;
        for (i = 0; i < len; i++) {
            if (this[i] == ele)
                return i;
        }
        return -1;
    }
}

// 为ie8补全trim
if (!String.prototype.trim) {
    String.prototype.trim = function() {
        var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
        return this.replace(rtrim, '');
    };
}

// 从array中去掉指定元素
if (!Array.prototype.remove) {
    Array.prototype.remove = function(ele) {
        var i, len = this.length;
        for (i = 0; i < len; i++) {
            if (this[i] == ele) {
                return this.splice(i, 1);
            }
        }
    }
}

//input输入框只允许输入整数的方法
function formatMoney(dom) {
    var regStrs = [
        ['\\D', ''],
        ['^0', ''],
        ['^0(\\d+)$', '$1'] //禁止录入整数部分两位以上，但首位为0
    ];
    for (var i = 0; i < regStrs.length; i++) {
        var reg = new RegExp(regStrs[i][0]);
        dom.value = dom.value.replace(reg, regStrs[i][1]);
    }
}

//判断浏览器是否支持css3
function supportCss3(style) {
    var prefix = ['webkit', 'Moz', 'ms', 'o'],
        i,
        humpString = [],
        htmlStyle = document.documentElement.style,
        _toHumb = function(string) {
            return string.replace(/-(\w)/g, function($0, $1) {
                return $1.toUpperCase();
            });
        };

    for (i in prefix)
        humpString.push(_toHumb(prefix[i] + '-' + style));

    humpString.push(_toHumb(style));

    for (i in humpString)
        if (humpString[i] in htmlStyle) return true;

    return false;
}

//判断浏览器类型
var browser = {
    version: (function() {
        var u = navigator.userAgent,
            app = navigator.appVersion;
        return { //移动终端浏览器版本信息
            trident: (/Trident/i).test(u), //IE内核
            presto: (/Presto/i).test(u), //opera内核
            webKit: (/AppleWebKit/i).test(u), //苹果、谷歌内核
            gecko: (/Gecko/i).test(u) && !(/KHTML/i).test(u), //火狐内核
            mobile: (/AppleWebKit.*Mobile.*/i).test(u), //是否为移动终端
            ios: (/\(i[^;]+;( U;)? CPU.+Mac OS X/i).test(u), //ios终端
            android: (/Android/i).test(u) || (/Linux/i).test(u), //android终端或者uc浏览器
            windowsphone: (/Windows Phone/i).test(u), //Windows Phone
            iPhone: (/iPhone/i).test(u), //是否为iPhone或者QQHD浏览器
            iPad: (/iPad/i).test(u), //是否iPad
            MicroMessenger: (/MicroMessenger/i).test(u), //是否为微信
            webApp: !(/Safari/i).test(u), //是否web应该程序，没有头部与底部
            edge: (/edge/i).test(u)
        };
    })(),
    language: (navigator.browserLanguage || navigator.language).toLowerCase()
};

if (browser.version.mobile || browser.version.ios || browser.version.android || browser.version.windowsphone) {

}

//从url里获取指定的参数值
window.getUrlParam = function(name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)'); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg); //匹配目标参数
    if (r != null) return unescape(r[2]);
    return null; //返回参数值
};

//cookie方法
var __setCookie = function(name, value, days) {
    days = days !== undefined ? days : 365;
    var exp = new Date();
    exp.setTime(exp.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString() + "; path=/; domain=.im9.com";
}

function __GetCookie(cookieName) {
    var theCookie = '' + document.cookie;
    var ind = theCookie.indexOf(cookieName + '=');
    if (ind == -1 || cookieName == '')
        return '';
    var ind1 = theCookie.indexOf(';', ind);
    if (ind1 == -1)
        ind1 = theCookie.length;
    return unescape(theCookie.substring(ind + cookieName.length + 1, ind1));
};

//对时间戳的处理，转换为设定类型
Date.prototype.format = function(fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

function creatDatepicker() {
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    $('#startTime').val(startDate.format('yyyy-MM-dd'));
    $('#endTime').val(endDate.format('yyyy-MM-dd'));
}


//处理js的加减乘除发生的精度丢失问题
var floatObj = function() {
    function isInteger(obj) {
        return Math.floor(obj) === obj
    }

    function toInteger(floatNum) {
        var ret = { times: 1, num: 0 }
        if (isInteger(floatNum)) {
            ret.num = floatNum
            return ret
        }
        var strfi = floatNum + ''
        var dotPos = strfi.indexOf('.')
        var len = strfi.substr(dotPos + 1).length
        var times = Math.pow(10, len)
        var intNum = parseInt(floatNum * times + 0.5, 10)
        ret.times = times
        ret.num = intNum
        return ret
    }

    function operation(a, b, digits, op) {
        var o1 = toInteger(a)
        var o2 = toInteger(b)
        var n1 = o1.num
        var n2 = o2.num
        var t1 = o1.times
        var t2 = o2.times
        var max = t1 > t2 ? t1 : t2
        var result = null
        switch (op) {
            case 'add':
                if (t1 === t2) { // 两个小数位数相同
                    result = n1 + n2
                } else if (t1 > t2) { // o1 小数位 大于 o2
                    result = n1 + n2 * (t1 / t2)
                } else { // o1 小数位 小于 o2
                    result = n1 * (t2 / t1) + n2
                }
                return result / max
            case 'subtract':
                if (t1 === t2) {
                    result = n1 - n2
                } else if (t1 > t2) {
                    result = n1 - n2 * (t1 / t2)
                } else {
                    result = n1 * (t2 / t1) - n2
                }
                return result / max
            case 'multiply':
                result = (n1 * n2) / (t1 * t2)
                return result
            case 'divide':
                result = (n1 / n2) * (t2 / t1)
                return result
        }
    }

    // 加减乘除的四个接口
    function add(a, b, digits) {
        return operation(a, b, digits, 'add')
    }

    function subtract(a, b, digits) {
        return operation(a, b, digits, 'subtract')
    }

    function multiply(a, b, digits) {
        return operation(a, b, digits, 'multiply')
    }

    function divide(a, b, digits) {
        return operation(a, b, digits, 'divide')
    }

    return {
        add: add,
        subtract: subtract,
        multiply: multiply,
        divide: divide
    }
}();
floatObj.divide(100, 100)

//判断是否是小数
function isPointNum(s) {
    var regu = '^([0-9]*[.0-9])$'; // 小数测试
    var re = new RegExp(regu);
    if (('' + s).search(re) != -1) {
        return true;
    } else {
        return false;
    }
}

//自由落体，可以配合jquery的animation
$.extend($.easing, {
    easeInQuad: function(x, t, b, c, d) {
        return c * (t /= d) * t + b;
    },
    easeOutBounce: function(x, t, b, c, d) {
        if ((t /= d) < (1 / 2.75)) {
            return c * (7.5625 * t * t) + b;
        } else if (t < (2 / 2.75)) {
            return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
        } else if (t < (2.5 / 2.75)) {
            return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
        } else {
            return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
        }
    },
    easeInOutBack: function(x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
        return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
    }
});
