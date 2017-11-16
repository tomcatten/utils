//api地址  http://api-doc.yit.com/
var ajaxMode = null;
if (!ajaxMode && (ajaxMode = /^http:\/\/boss\.(\w+)\.yit\.com/.exec(window.location.href))) {
    ajaxMode = ajaxMode[1];
}
var api = {
    ajaxUrl: (function() {
        if (window.abp) {
            return abp.webapiDomain + '/';
        } else if (ajaxMode) {
            return 'http://api.boss.' + ajaxMode + '.yit.com/';
        } else {
            return 'http://api.boss.stage.yit.com/';
        }
    })(),
    /*操作localstorage: 
    	yit.local('key','value');	//存
    	yit.local('key');			//取
    	yit.local('key',null);		//删
    	yit.local('key',{k:'v'});	//存对象
     */
    local: function() {
        var prefix = "yit_"; //加上前缀 , 不可更改！！！ 因为涉及到外包的页面，也会从localstorage里面取值，外包并不知道前缀
        var args = Array.prototype.slice.call(arguments);
        var key, value;
        key = prefix + args[0];
        if (args.length == 1) {
            return window.localStorage.getItem(key);
        }
        if (args.length == 2) {

            value = args[1];

            if ($.type(value) == 'null') {
                return window.localStorage.removeItem(key);
            }

            if ($.type(value) === 'object' || $.type(value) === 'array') {
                value = JSON.stringify(value);
            }
            try {
                return window.localStorage.setItem(key, value);
            } catch (e) {
                alert('您开启了秘密浏览或无痕浏览模式，请关闭');
            }
        }
    },
    //设置cookie
    setCookie: function(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    },
    //删除cookie
    delCookie: function(name) {
        this.setCookie(name, '', -1);
    },
    //获取cookie
    getCookie: function(sName) {
        var aCookie = document.cookie.split("; ");
        for (var i = 0; i < aCookie.length; i++) {
            var aCrumb = aCookie[i].split("=");
            if (sName == aCrumb[0])
                return unescape(aCrumb[1]);
        }
        return null;
    },
    /*
    	如果当前地址是："https://gist.github.com/send.php?name=jikey&age=30&lan=js"
    	console.log(api.query()       // {name: "jikey", age: "30", lan: "js"}
    	console.log(api.query().name)  // jikey
    	console.log(api.query("https://gist.github.com/send.php?name=jikey&age=&lan=js",'age'));
     */
    query: function(url, param) {
        var _urlSearch;
        _urlSearch = window.location.search.substring(1);

        if (url) {
            var a = document.createElement('a');
            a.href = url;
            _urlSearch = a.search.substring(1);
        }

        var result, arr, aItem;
        result = {};

        if (!_urlSearch) {
            return result;
        }
        arr = _urlSearch.split('&');
        // console.log('url参数', arr);
        for (var i in arr) {
            aItem = arr[i].split('=');
            result[aItem[0]] = aItem[1];
        }
        //console.log('url参数', result);
        if (param) {
            return result[param];
        }
        return result;
    },
    //获取用户名
    getUserName: function() {
        var currentUser = "";
        var arr = document.cookie.match(new RegExp("(^| )yituser=([^;]*)(;|$)"));
        if (arr !== null && arr.length >= 3) {
            currentUser = arr[2];
        } else {
            currentUser = "unkonwn";
        }
        return currentUser;
    },
    getAuthorization: function() {
        var token = api.local('token') || '';
        if (token) {
            return "Bearer " + token;
        }
        return '';
    },
    getGateWayUrl: function(opt) {
        var gateWayUrl = '';
        if (ajaxMode) {
            gateWayUrl = 'http://api-' + ajaxMode + '.yit.com';
        } else {
            gateWayUrl = 'http://api-stage.yit.com';
        }

        if (opt && opt.domainUrl) {
            gateWayUrl = opt.domainUrl;
        }

        if (window.abp) {
            gateWayUrl = window.abp.gatewayDomain;
        }
        return gateWayUrl;
    },
    /*
    	//单独调用
    	api.ajaxGateWay({
    		url:'aUrl',
    		data:{param1:1},
    		success:function(res){
    			//res[0]
    			//res[1]
    		}
    	})

    	//调用多个
    	api.ajaxGateWay({
    		url:['aUrl'],
    		data:[{param1:1}],
    		success:function(res){
    			//res[0]
    			//res[1]
    		}
    	})
    	api.ajaxGateWay({
    		url:['aUrl','bUrl'],
    		data:[{param1:1},{param2:2}],
    		success:function(res){
    			//res[0]
    			//res[1]
    		}
    	})
     */
    ajaxGateWay: function(opt) {
        var data = {};
        data._aid = 10; //h5
        data._ts = +new Date(); //时间戳

        if ($.isArray(opt.url) && opt.url.length == 1) {
            //如果url是数组，但是长度为1的时候
            opt.url = opt.url.pop();
            opt.data = opt.data.pop();
        }
        // console.log(opt);
        var isArrUrl = $.isArray(opt.url); //判断是否是多个url
        var mUrl = isArrUrl ? opt.url.join(',') : opt.url; //接口名字逗号隔开 
        data._mt = mUrl;

        if (isArrUrl) {
            for (var i = 0, dataItem; dataItem = opt.data[i]; i++) {
                for (var j in dataItem) {
                    data[i + '_' + j] = dataItem[j];
                }
            }
        } else {
            data = $.extend(data, opt.data);
        }

        var gateWayUrl = api.getGateWayUrl(opt);

        if (window.abp) {
            delete opt.mock;
        }

        $.ajax({
            url: opt.mock ? ('/mock/' + opt.url + '.json') : gateWayUrl + '/apigw/m.api',
            type: opt.mock ? 'GET' : 'POST',
            data: data,
            showLoading: opt.showLoading || false,
            success: function(res) {
                //opt.success(res)
                var resArr = [];
                //构造返回值，为了保持和原来一致， 需要转一下
                if (api.needLogin(res.stat.code)) {
                    return;
                }
                if (res.stat && res.stat.code < 0) {
                    api.alert('error：' + res.stat.code, 3000);
                    return;
                }

                for (var k = 0; k < res.stat.stateList.length; k++) {
                    var resContent;

                    if (res.content[k].value !== undefined) { //如果有value这个字段 ,那么值就是value里面的。
                        resContent = res.content[k].value;
                    } else {
                        resContent = res.content[k];
                    }
                    if (api.needLogin(res.stat.stateList[k].code)) {
                        return;
                    }
                    resArr.push({
                        error_info: res.stat.stateList[k].msg,
                        error_num: res.stat.stateList[k].code,
                        content: resContent
                    });
                    window.debug && console.log(resArr);
                }

                if (resArr.length == 1) {
                    var _res = resArr[0];
                    if ((_res.error == 'token_not_provided') || _res.error == 'token_invalid' || _res.error == 'user_not_found' || _res.error == 'token_expired') {
                        api.local('token', null);
                        api.delCookie('yituser');
                        api.delCookie('islogin');
                        top.location.href = './login.html';
                    }
                    opt.success && opt.success(_res);
                    return;
                }

                opt.success && opt.success(resArr);
            },
            error: function(xhr, error) {
                $.type(opt.error) === 'function' && opt.error(error);
            },
            beforeSend: function(xhr) {
                if (api.getAuthorization()) {
                    xhr.setRequestHeader("Authorization", api.getAuthorization());
                }
                if (opt.showLoading) {
                    api.showLoadingToast('数据加载中');
                }
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            complete: function() {
                if (opt.showLoading) {
                    api.hideLoadingToast();
                }
                $.type(opt.complete) === 'function' && opt.complete();
            }

        })
    },
    /*
    	api.ajax({
    		data:{}
    		type:'get',
    		success:function(){},
    		error:function(){},
    		beforeSend:function(){},
    		complete:function(){},
    	});
    */
    ajax: function(opt) {
        $.ajax({
            url: opt.url,
            type: opt.type || 'GET',
            data: opt.data || {},
            dataType: opt.dataType || 'json',
            timeout: 300000,
            success: function(res) {
                if ((res.error == 'token_not_provided') || res.error == 'token_invalid' || res.error == 'user_not_found' || res.error == 'token_expired') {
                    api.local('token', null);
                    api.delCookie('yituser');
                    api.delCookie('islogin');
                    top.location.href = './login.html';
                }
                $.type(opt.success) === 'function' && opt.success(res);
            },
            error: function(xhr, error) {


                $.type(opt.error) === 'function' && opt.error(error);
            },
            beforeSend: function(xhr) {
                if (api.getAuthorization()) {
                    xhr.setRequestHeader("Authorization", api.getAuthorization());
                }
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            complete: function() {
                $.type(opt.complete) === 'function' && opt.complete();
            }
        });
    },
    /*
    一条图片库
    api.yitPhoto({
    	num:1,//数量1表示单选 ，不加此参数为不限制，目前只支持 num为1 单选
    	categoryId:15,//如果指定了具体值，那么展示的时候直接去相应的菜单
    	choosed:function(imgList){
    		//选择了那些图片
    		console.log(imgList);
    	}
    });
     */
    yitPhoto: function(opt) {
        var yitPhoto = $('#yit_photo');
        var ifr = document.createElement('iframe');
        ifr.id = "yit_photo";
        ifr.style.cssText = "border: 1px solid #999;box-shadow: 0 5px 15px rgba(0,0,0,.5);display:none;border:none;z-index:1050;position:fixed;left:50%;margin-left:-450px;top:0px;";
        var ifrParams = { rd: Math.random() };
        if (opt.num) {
            ifrParams.num = opt.num;
        }
        if (opt.categoryId) {
            ifrParams.category_id = opt.categoryId;
        }

        ifr.src = "./photo.html?" + $.param(ifrParams);
        document.body.appendChild(ifr);
        yitPhoto = $('#yit_photo');
        var ifrH, ifrW = 917;
        if (window.innerHeight >= 774) {
            ifrH = 774;
        } else {
            ifrH = window.innerHeight + 'px';
        }

        if (opt.fn) {
            opt.fn();
        }

        yitPhoto.css({
            //top:(document.body.scrollTop) + 'px',
            // top:'0px',
            height: ifrH,
            width: ifrW
        }).show();

        window.yitPhotoChoose = function(res) {
            opt.choosed && opt.choosed(res);
        }

        window.yitPhotoChooseCancel = function() {
            yitPhoto.remove();
        }
    },
    /*
    	通用商品搜索组件
    	唯一的参数是callback，选择完成后选中的商品列表会作为参数传入callback
        2017.07.14 传参方式增加一种，允许只传一个opt对象，对象中包含success、cancel等参数
     */
    productSearch: function(success, cancel) {
        // 处理参数，继续支持原有的success、cancel两个回调的传参
        var opt = success,
            param = '';
        if (typeof opt != 'object') {
            opt = {
                success: success,
                cancel: cancel
            }
        } else {
            let optExcludeCallback = deepCopy(opt);
            for (let key in optExcludeCallback) {
                if (typeof optExcludeCallback[key] == 'function') {
                    delete optExcludeCallback[key];
                }
            }
            param = '?' + $.param(optExcludeCallback);
        }

        var iframe = $('<iframe>').attr({
            id: 'yit_product_search_iframe',
            src: 'product_search.html' + param
        }).css({
            width: '100%',
            height: '100%',
            position: 'fixed',
            zIndex: 99999,
            top: 0,
            left: 0
        }).appendTo('body');

        var handler = function(msg) {
            var ret = msg.data;
            switch (ret.status) {
                case 'success':
                    typeof opt.success == 'function' && opt.success(ret.data);
                    iframe.remove();
                    window.removeEventListener('message', handler);
                    break;
                case 'cancel':
                    typeof opt.cancel == 'function' && opt.cancel();
                    iframe.remove();
                    window.removeEventListener('message', handler);
                    break;
            }
        };
        window.addEventListener('message', handler);
    },
    loginOutErrorCode: [-360, -361, -180, -300, 10000004],
    needLogin: function(code) {
        if (api.loginOutErrorCode.indexOf(code) > -1) {
            // api.loginOut(code);
            api.alert(code, 3000, function() {
                api.local('token', null);
                api.delCookie('yituser');
                api.delCookie('islogin');
                top.location.href = "./login.html";
            });
            return true;
        }
    },
    /*
        (新)简单的上传文件
        http://confluence.yit.com/pages/viewpage.action?pageId=3441010
        使用:
            HTML
                <input type="file" id="file" name="content" multiple> 
                <input type="file" id="file" name="content" > 
            JS
                api.fileUpload({
                    file:$('#file')[0],
                    prefix:'',//标识 
                    progress:function(e){//进度条（可选）
                        e.loaded, e.total
                        console.log(e.loaded/e.total*100+'百分比');
                    },
                    success:function(urls){
                        单个文件 urls 是地址
                        多个文件 urls 是数组
                        console.log(urls); 
                    }
                });
     */
    fileUpload: function(opt) {
        var file = opt.file;
        var callback = opt.success;
        var allcallback = opt.allSuccess;

        if (!callback && !allcallback) {
            alert('api.upload方法没给回调？');
            return;
        }
        var files = file.files;
        var num = 0;
        var returnUrls = [];
        if (!opt.prefix) {
            console.error('调用api.upload上传时，prefix字段 不能为空。\nhttp://confluence.yit.com/pages/viewpage.action?pageId=3441010');
            return;
        }
        var prefix = opt.prefix;
        var downloadKey = prefix + '.content';
        var formData = new FormData();

        var flileLen = files.length;
        for (var i = 0; i < flileLen; i++) {
            formData.append(downloadKey + i, files[i]);
        };

        $.ajax({
            url: api.getGateWayUrl() + '/apigw/file.api',
            type: 'POST',
            cache: false,
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                var myXhr = $.ajaxSettings.xhr();
                if (myXhr.upload) { //检查upload属性是否存在  
                    //绑定progress事件的回调函数  
                    if (opt.progress) {
                        myXhr.upload.addEventListener('progress', opt.progress || $.noop, false);
                    }
                }
                return myXhr; //xhr对象返回给jQuery使用  
            },
            beforeSend: function(xhr) {
                if (api.getAuthorization()) {
                    xhr.setRequestHeader("Authorization", api.getAuthorization());
                }
                api.showLoadingToast('上传中');
            },
            success: function(res) {
                var resArr = [];

                if (api.needLogin(res.stat.code)) {
                    return;
                }

                if (res.stat && res.stat.code < 0) {
                    api.alert('error：' + res.stat.code, 3000);
                    return;
                }

                var res = {
                    error_info: res.stat.stateList[0].msg,
                    error_num: res.stat.stateList[0].code,
                    content: res.content[0]
                }

                if (api.needLogin(res.error_num)) {
                    return;
                }

                if (res.error_num) {
                    (typeof opt.fail == 'function') && opt.fail(res.error_info || res.error_num);
                    return api.alert(res.error_info || res.error_num);
                }

                var successUrls = [];
                for (var l = 0; l < flileLen; l++) {
                    //先拿有.url结尾的，拿不到再拿没有.url结尾的
                    /*
                        因为新接口上传的内容分公有，和私有。 
                        私有的时候不会返回带.url结尾的字段，而共有的会返回
                     */
                    successUrls.push(res.content[downloadKey + l + '.url'] || res.content[downloadKey + l]);
                }
                if (successUrls.length == 1) {
                    successUrls = successUrls.pop();
                }
                opt.success && opt.success(successUrls);
                opt.file && opt.file.value && (opt.file.value = '');
            },
            complete: function() {
                api.hideLoadingToast();
            }
        })
    },
    /*
    	简单的上传文件
    	使用:
    		HTML
    			<input type="file" id="file" name="content" multiple> 
    		JS
    			api.upload({
    				file:$('#file')[0],
    				success:function(url){
    					console.log(url);
    				},
    				//多个上传的时候
    				allSuccess:function(urls){
    					console.log(urls);//当全部上传完毕的时候
    				}
    			});
     */
    upload: function(obj) {
        var file = obj.file;
        var callback = obj.success;
        var allcallback = obj.allSuccess;

        if (!callback && !allcallback) {
            alert('api.upload方法没给回调？');
            return;
        }
        var url = (window.abp ? window.abp.gatewayDomain : 'http://m.api.stage.yit.com') + '/apigw/upload';
        var files = file.files;
        var num = 0;
        var returnUrls = [];
        var uploadSingle = function(f, cb) {
            var formData = new FormData();
            formData.append('content', f);
            $.ajax({
                url: url,
                type: 'POST',
                cache: false,
                data: formData,
                processData: false,
                contentType: false
            }).done(function(url) {
                callback && callback(url);
                returnUrls.push(url);
                if (++num == files.length) {
                    allcallback && allcallback(returnUrls);
                }
            });
        }
        for (var i = 0; i < files.length; i++) {
            uploadSingle(files[i], i)
        };
    },
    /*复制文本
     */
    copy: function(str) {
        //https://github.com/zenorocha/clipboard.js/blob/master/src/clipboard-action.js#L55-L75
        var fakeElem = document.createElement("textarea");
        // Prevent zooming on iOS
        fakeElem.style.fontSize = '12pt';
        // Reset box model
        fakeElem.style.border = '0';
        fakeElem.style.padding = '0';
        fakeElem.style.margin = '0';
        // Move element out of screen horizontally
        fakeElem.style.position = 'absolute';
        fakeElem.style.left = '-9999px';
        // Move element to the same position vertically
        var yPosition = window.pageYOffset || document.documentElement.scrollTop;
        fakeElem.style.top = yPosition + 'px';
        fakeElem.value = str;
        document.body.appendChild(fakeElem);
        // 复制内容
        fakeElem.select();
        // fakeElem.setSelectionRange(0, fakeElem.value.length);
        document.execCommand("copy");
        document.body.removeChild(fakeElem);
    },
    flatten: function(f) {
        /*数组拍平*/
        if ($.isArray(f)) {
            /*
              比如搜白因子的时候， 出现同名的三个
                {id: 27735, name: "白因子免洗消毒喷雾"}
                {id: 27734, name: "白因子免洗消毒喷雾"}
                {id: 27733, name: "白因子免洗消毒喷雾"}
              那么此时 _this.search.productIds.id = [[27735,27734,27733]]; 导致参数错误
              这个时候需要将此数组打平
             */
            function paibian(arr) {
                var temp = [];
                for (var i = 0; i < arr.length; i++) {
                    if ($.isArray(arr[i])) {
                        temp = temp.concat(paibian(Array.prototype.concat.apply([], arr[i])));
                    } else {
                        temp.push(arr[i]);
                    }
                };
                return temp;
            }
            return paibian(f);
        }
        return f;
    },
    /*产品列表
    product_name		商品名称关键字匹配
    brand_name		  品牌名称关键字匹配.
    offset			  分页用, 第1页的offset为0
    limit			   每页显示的行数
    success:function(res){} 成功回调
    */
    getProducts: function(opt) {
        var _this = this;
        //products?brand_name=SAND&product_name=&offset=0&limit=100'
        api.ajax({
            url: _this.ajaxUrl + 'stock/products',
            data: {
                brand_name: opt.brand_name || '',
                product_name: opt.product_name || '',
                channel_name: opt.channel_name || '',
                offset: opt.offset || 0,
                limit: opt.limit || 15,
                spu_id: opt.spu_id || '',
                sku_code: opt.sku_code || '',
                vendor_sku: opt.vendor_sku || '',
                bdIds: opt.bdIds,
            },
            beforeSend: function(xhr) {
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                opt.complete && opt.complete();
            }
        });

    },
    /*商品库存调整
    product_id	 商品ID
    ajust_amount   增量调整的数目
    success:function 成功回调
    */
    ajustStock: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'stock/ajust-stock',
            type: 'post',
            dataType: 'text',
            data: {
                product_id: opt.product_id,
                ajust_amount: opt.ajust_amount,
                operator: opt.operator
            },
            beforeSend: function(xhr) {
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                opt.complete && opt.complete();
            }
        });
    },
    /*查看库存更新历史	http://api-doc.yit.com/#!/default/get_stock_history
    product_id  商品ID
    offset	  分页，第一页的offset为0
    limit	   每页显示的行数
    success:function()成功回调
    */
    getStockHistory: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'stock/stock-history',
            data: {
                has_order: opt.has_order,
                product_id: opt.product_id,
                offset: opt.offset,
                limit: opt.limit
            },
            beforeSend: function(xhr) {
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                opt.complete && opt.complete();
            }
        });
    },
    /*设置库存警戒值
    product_id		商品id
    threshold_amount  目标库存警戒值
    success:function()成功回调
    */
    setWarningThreshold: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'stock/set-warning-threshold',
            type: 'post',
            dataType: 'text',
            data: {
                product_id: opt.product_id,
                threshold_amount: opt.threshold_amount,
                operator: opt.operator
            },
            beforeSend: function(xhr) {
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                opt.complete && opt.complete();
            }
        });
    },
    /*设置上架状态
    product_id	商品id
    in_sale	   上架状态 true/false
    */
    setInSale: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'stock/set-in-sale',
            type: 'post',
            data: {
                product_id: opt.product_id,
                in_sale: opt.in_sale,
                operator: opt.operator
            },
            dataType: 'text',
            beforeSend: function(xhr) {
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                opt.complete && opt.complete();
            }
        });
    },

    /* 清理产品详情页面缓存
    product_id	商品id
    */
    clearProductDetailCache: function(opt) {
        $.ajax({
            url: 'http://120.26.237.48:8089/cache?operation=purgebyurl&url=http://magento.yit.com/mobile/product/detail?product_id=' + opt.product_id,
            success: function(res) {
                opt.success && opt.success(res);
            }
        });
    },

    /* 清理index页面缓存
     */
    clearIndexCache: function(opt) {
        $.ajax({
            url: 'http://120.26.237.48:8089/cache?operation=purgebyurl&url=http://magento.yit.com/mobile/home/fcategory',
        });

        $.ajax({
            url: 'http://120.26.237.48:8089/cache?operation=purgebyurl&url=http://magento.yit.com/mobile/product/fcategoryproducthome?is_use_point=1&page_size=100',
        });

        $.ajax({
            url: 'http://120.26.237.48:8089/cache?operation=purgebyurl&url=http://magento.yit.com/mobile/home/banner',
        });

        $.ajax({
            url: 'http://120.26.237.48:8089/cache?operation=purgebyurl&url=brandlist?page_size=10&page_index=1',
        });

        $.ajax({
            url: 'http://120.26.237.48:8089/cache?operation=purgebyurl&url=http://magento.yit.com/mobile/product/guesslove',
        });

        $.ajax({
            url: 'http://120.26.237.48:8089/cache?operation=purgebyurl&url=http://magento.yit.com/mobile/home/gather',
            success: function(res) {
                opt.success && opt.success(res);
            }
        });
    },

    /* 清理前端分类页面缓存
     */
    clearfcatelogCache: function(opt) {

        $.ajax({
            url: 'http://magento.yit.com/mobile/product/fcategoryproduct?page_size=100&fcategory_id=' + opt.fcategory_id + '&target=db',
            success: function(res) {
                opt.success && opt.success(res);
            }
        });
    },
    /*订单SKU列表, 包含状态信息. 用于跟渠道/供应商结算
    	start_time	(required)起始时间
    	end_time	(required)终止时间
    	vendor_name	渠道/供应商名, 关键字匹配
    	query_type	(required)查询类型. 1-当期收入，需当期结算. 2-往期收入，需当期结算. 3-当期收入，未来结算
    	offset	(required)记录偏移量, 从0开始
    	limit	(required)返回记录的最大数量
    	exclude_sameday_return  是否剔除当天退货
    */
    vendorBalance: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'finance/vendor-balance',
            type: 'get',
            data: {
                start_time: opt.start_time,
                end_time: opt.end_time,
                vendor_name: opt.vendor_name,
                vendor_ids: opt.vendor_ids,
                query_type: opt.query_type,
                offset: opt.offset * opt.limit,
                limit: opt.limit,
                exclude_sameday_return: opt.exclude_sameday_return || false,
                split: opt.split || false,
                proxy_channel_ids: opt.proxy_channel_id
            },
            beforeSend: function(xhr) {
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                opt.complete && opt.complete();
            }
        });
    },
    /*
    	订单列表
    	start_time	   :'',//起始下单时间
    	end_time       :'',//终止下单时间
    	order_state     :'',//订单状态, 多个状态用逗号分隔. 1-已取消 2-待付款 3-待发货 4-待收货 5-已完成 6-退货
    	order_number 	:'',//订单号
    	user_phone 	   :'',//手机号
    	user_name 	   :'',//姓名
    	product_name   :'',//商品名
    	brand_name     :'',//品牌名
    	offset         :'',//记录偏移量, 从0开始
    	limit          :'',//返回记录的最大数量
    	
    */
    orderList: function(opt) {
        var data = opt.data || {};
        //去除空格
        for (var i in data) {
            if ($.type(data[i]) == 'string') {
                data[i] = data[i].trim();
            }
        }
        api.ajax({
            url: this.ajaxUrl + 'order/list',
            type: 'get',
            data: data || {},
            success: function(res) {
                opt.success && opt.success(res);
            },
            beforeSend: function(xhr) {
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            complete: function() {
                opt.complete && opt.complete();
            }
        });
    },
    /*
    	订单详情
    	order_id : '',订单记录ID
    */
    orderDetail: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'order/detail',
            type: 'get',
            data: opt.data || {},
            beforeSend: function(xhr) {
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                opt.complete && opt.complete();
            }
        });
    },
    /*
    	退货申请
    	item_id  :'',//SKU子订单
    	quantity :''//退货数量
    */
    returnApply: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'rma/add',
            type: 'POST',
            data: opt.data || {},
            dataType: 'text',
            beforeSend: function(xhr) {
                api.showLoadingToast('数据加载中');
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                api.hideLoadingToast();
                opt.complete && opt.complete();
            }
        });
    },
    /* 
    	退货审核
    	rma_id:'',RMA记录ID
    	status:'',不填或超出范围为保持原有状态. 0-待审核 1-已驳回 2-退货中 3-退款中 4-完成
    	cargo_status:'',1-未发货 2-货在途 3-已收货
    	reason:'',原因
    	note:'',备注
    	attachment_url:''附件文件Url地址
    */
    returnAudit: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'rma/set-status',
            type: 'POST',
            data: opt.data || {},
            dataType: 'text',
            beforeSend: function(xhr) {
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
        })
    },
    /* 
	 ＊ 登录接口
	*/
    login: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'auth/login',
            type: 'post',
            data: {
                username: opt.username,
                password: opt.password
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            error: function(xhr, ajaxOptions, thrownError) {
                opt.error(xhr, ajaxOptions, thrownError);
            },
            complete: function() {
                opt.complete && opt.complete();
            }
        });
    },
    /*物流公司*/
    logisticsCompany: function(opt) {
        api.ajaxGateWay({
            url: 'supplier.bossLogisticsCompanyList',
            beforeSend: function(xhr) {
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                opt.complete && opt.complete();
            }
        });
    },
    /*
    	更新物流信息
    	rma_id : '',//RMA记录ID
    	logistics_company_id : '',//物流公司记录ID
    	logistics_code:'',//物流单号
    	is_return_to_vendor :''//是否退回给供应商
    */
    updateLogistic: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'rma/set-return-logistics',
            type: 'POST',
            data: opt.data || {},
            dataType: 'text',
            beforeSend: function(xhr) {
                api.showLoadingToast('数据加载中');
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                api.hideLoadingToast();
                opt.complete && opt.complete();
            }
        });
    },
    /* 
    	更新供货商发货物流信息
    	rma_id : ''//RMA记录ID
    	logistics_company_id :'',//物流公司记录ID
    	logistics_code 		 :''物流单号
    */
    updatVendorLogistic: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'rma/set-deliver-logistics',
            type: 'POST',
            data: opt.data || {},
            dataType: 'text',
            beforeSend: function(xhr) {
                api.showLoadingToast('数据加载中');
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                api.hideLoadingToast();
                opt.complete && opt.complete();
            }
        });
    },
    /*
    	确认退款
    	rma_id : '',//RMA记录ID
    	refunded_amount : '',//退款总额
    	is_all_refunded:'',//是否全额退款
    */
    setRefund: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'rma/set-refund',
            type: 'POST',
            data: opt.data || {},
            dataType: 'text',
            beforeSend: function(xhr) {
                api.showLoadingToast('数据加载中');
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                api.hideLoadingToast();
                opt.complete && opt.complete();
            }
        });
    },

    /*弹层alert
    	yit.alert('纯提示')
    	yit.alert('纯提示',3000) 3000毫秒后消失
    	yit.alert('纯提示',3000,cb) 3000毫秒后消失,回调
    	如果不想要背景层mask的弹层
    	yit.alertNoMask('纯提示')
    	yit.alertNoMask('纯提示',3000) 3000毫秒后消失
    	yit.alertNoMask('纯提示',3000,cb) 3000毫秒后消失,回调
     */
    alert: function(txt, timer, cb, hideMask) {
        //var maskTpl = hideMask?'':'<div class="mask show"></div>';
        var maskTpl = '<div class="mask-opacity show"></div>';
        var alertTemplate = '<div>' +
            maskTpl +
            '<div class="pop pop-noMask dailog show">' +
            '<span class="close">X</span>' +
            '<div class="pop-bd">' +
            txt +
            '</div>' +
            '</div></div>';
        var $alertDiv = $(alertTemplate);
        var $mask = $alertDiv.find('.mask');
        var $dailog = $alertDiv.find('.dailog');
        var hide = function() {
            $dailog.removeClass('show');
            $mask.removeClass('show');
            cb && cb();
            setTimeout(function() {
                $alertDiv.remove();
            }, 500);
        }
        $("body").append($alertDiv);
        $alertDiv.on('click', '.mask', function() {
            hide();
        }).on('click', '.close', function() {
            hide();
        });
        setTimeout(function() {
            hide();
        }, timer || 2000);
    },
    Date: function() {
        var nowTemp = new Date();
        var yitdate = {};
        yitdate.year = nowTemp.getFullYear();
        yitdate.month = nowTemp.getMonth() < 10 ? (nowTemp.getMonth() === 9 ? (Number(nowTemp.getMonth()) + 1) : "0" + (Number(nowTemp.getMonth()) + 1)) : nowTemp.getMonth();
        yitdate.day = nowTemp.getDate() < 10 ? "0" + nowTemp.getDate() : nowTemp.getDate();
        yitdate.hour = nowTemp.getHours < 10 ? "0" + nowTemp.getHours() : nowTemp.getHours();
        yitdate.minutes = nowTemp.getMinutes() < 10 ? "0" + nowTemp.getMinutes() : nowTemp.getMinutes();
        yitdate.seconds = nowTemp.getSeconds() < 10 ? "0" + nowTemp.getSeconds() : nowTemp.getSeconds();
        return yitdate;
    },
    /* 
    	增加备注
    	item_id:SKU子订单ID,
    	note : 备注内容
    */
    addMark: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'order/set-item-note',
            type: 'POST',
            data: opt.data || {},
            dataType: 'text',
            beforeSend: function(xhr) {
                api.showLoadingToast('数据加载中');
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                api.hideLoadingToast();
                opt.complete && opt.complete();
            }
        });
    },
    /*
    	设置备注是否供应商可见
    	note_id  		:'',//备注记录ID
    	vendor_visible  :''//是否供应商可见
     */
    setItemNote: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'order/set-item-note-vendor-visible',
            type: 'POST',
            data: opt.data || {},
            dataType: 'text',
            beforeSend: function(xhr) {
                api.showLoadingToast('数据加载中');
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                api.hideLoadingToast();
                opt.complete && opt.complete();
            }
        });
    },
    /*商品管理
    	fcategory_id 前台类目ID
    	product_id   商品ID
    	product_name 商品名称
    	page_index   页数
    	page_size    每页数量
    */
    getEditProductList: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'product/products',
            type: 'get',
            data: {
                //token:'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjIzLCJpc3MiOiJodHRwOlwvXC9hcGkuc3RvY2suc3RhZ2UueWl0LmNvbVwvYXV0aFwvbG9naW4iLCJpYXQiOjE0Njc2ODQ0MDksImV4cCI6MTQ2NzY4ODAwOSwibmJmIjoxNDY3Njg0NDA5LCJqdGkiOiI2ZWM5MmE0OGJiNWM1NjI5NzQ0MTcwZTY5MmEzNDk0MiJ9.zqMywSn1gcgT_uiMejcqLqRMsaM4oVgn9yA8wymVb24',
                fcategory_id: opt.fcategory_id || '',
                product_id: opt.product_id || '',
                product_name: opt.product_name || '',
                brand_name: opt.brand_name || '',
                page_index: opt.page_index || '1',
                page_size: opt.page_size || '20'
            },
            beforeSend: function(xhr) {
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                opt.complete && opt.complete();
            }
        });
    },
    /*修改商品权重
    	datas: [{"id":"456","product_point":"6"}]
    */
    editProductPoint: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'product/save',
            type: 'post',
            data: {
                datas: opt.datas
            },
            beforeSend: function(xhr) {
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                opt.complete && opt.complete();
            }
        });
    },
    //验证相关
    /*电话
    	yit.validateMobile('2312321')
    */
    validateMobile: function(mobile) {
        mobile = $.trim(mobile + '').replace(/\s/g, '');
        if (!(/^(13[0-9]|15[012356789]|17[0123456789]|18[0-9]|14[57])[0-9]{8}$/.test($.trim(mobile)))) {
            return false;
        } else {
            return true;
        }
    },
    setAddress: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'order/set-recipient',
            type: 'POST',
            data: opt.data || {},
            dataType: 'text',
            beforeSend: function(xhr) {
                api.showLoadingToast('数据加载中');
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                api.hideLoadingToast();
                opt.complete && opt.complete();
            }
        });
    },
    /* 
     	rma List
     	start_time 		:'',//起始时间
     	end_time 		:'',//终止时间
     	rma_status 		:'',//退货状态, 多个状态用逗号分隔. 1 新申请-待处理 2 申请已处理-待确认 3 审核已通过-退货中 4 退货已完成-待确认 5 退货已确认-发货中 6 审核已通过-发货中 7 执行已核对-待退款 8 发货已完成-维权结束 9 审核已驳回-维权结束 10 退款已完成-维权结束
     	rma_type 		:'',//维权类型, 多个用逗号分隔 1 退货 2 换货 3 补寄
     	rma_number 		:'',//维权号
     	user_phone 		:'',//手机号
     	user_name 		:'',//姓名
     	product_name 	:'',//商品名
     	offset 			:'',//记录偏移量, 从0开始
     	limit 			:'',//返回记录的最大数量
    */
    rmaList: function(opt) {
        var data = opt.data || {};
        //去除空格
        for (var i in data) {
            if ($.type(data[i]) == 'string') {
                data[i] = data[i].trim();
            }
        }
        api.ajax({
            url: this.ajaxUrl + 'rma/list',
            type: 'GET',
            data: data || {},
            beforeSend: function(xhr) {
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                opt.complete && opt.complete();
            }
        });
    },
    toastNum: 0, //ajax loading层
    showLoadingToast: function(str) {
        var toast = $('#loadingToast');
        if (toast.length == 0) {
            var tpl = '' +
                '<div id="loadingToast" class="weui_loading_toast">' +
                '<div class="weui_mask_transparent" ></div>' +
                '<div class="weui_toast">' +
                '<div class="weui_loading">' +
                '<div class="weui_loading_leaf weui_loading_leaf_0"></div>' +
                '<div class="weui_loading_leaf weui_loading_leaf_1"></div>' +
                '<div class="weui_loading_leaf weui_loading_leaf_2"></div>' +
                '<div class="weui_loading_leaf weui_loading_leaf_3"></div>' +
                '<div class="weui_loading_leaf weui_loading_leaf_4"></div>' +
                '<div class="weui_loading_leaf weui_loading_leaf_5"></div>' +
                '<div class="weui_loading_leaf weui_loading_leaf_6"></div>' +
                '<div class="weui_loading_leaf weui_loading_leaf_7"></div>' +
                '<div class="weui_loading_leaf weui_loading_leaf_8"></div>' +
                '<div class="weui_loading_leaf weui_loading_leaf_9"></div>' +
                '<div class="weui_loading_leaf weui_loading_leaf_10"></div>' +
                '<div class="weui_loading_leaf weui_loading_leaf_11"></div>' +
                '</div>' +
                '<p class="weui_toast_content">数据加载中</p >' +
                '</div>' +
                '</div>';
            var _div = document.createElement('div');
            _div.innerHTML = tpl;
            $(document.body).append($(_div));
        }
        $('#loadingToast').find('.weui_toast_content').html(str || '数据加载中');
        $('#loadingToast').show();
    },
    hideLoadingToast: function() {

        $('#loadingToast').hide();
        return;

    },
    /*显示物流详情*/
    logisInfo: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'logistics/info',
            type: 'GET',
            data: opt.data || {},
            dataType: 'json',
            beforeSend: function(xhr) {
                api.showLoadingToast('数据加载中');
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                api.hideLoadingToast();
                opt.complete && opt.complete();
            }
        });
    },
    /*显示物流状态*/
    logisStaus: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'logistics/status',
            type: 'GET',
            data: opt.data || {},
            dataType: 'json',
            beforeSend: function(xhr) {
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                opt.complete && opt.complete();
            }
        });
    },
    /*设置订单状态*/
    setStatus: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'order/set-order-status',
            type: 'POST',
            data: opt.data || {},
            dataType: 'text',
            beforeSend: function(xhr) {
                api.showLoadingToast('数据加载中');
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                api.hideLoadingToast();
                opt.complete && opt.complete();
            }
        });
    },
    /*
    	发货
    	item_id:'',//订单SKU记录ID
    	logistics_company_id : '',//物流公司记录ID
    	logistics_code		:'',//物流单号
    	note                :''//备注内容
     */
    sendGoods: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'order/set-item-logistics',
            type: 'POST',
            data: opt.data || {},
            dataType: 'text',
            beforeSend: function(xhr) {
                api.showLoadingToast('数据加载中');
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                api.hideLoadingToast();
                opt.complete && opt.complete();
            }
        });
    },
    /*收货*/
    setCargo: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'order/set-cargo-status',
            type: 'POST',
            data: opt.data || {},
            dataType: 'text',
            beforeSend: function(xhr) {
                api.showLoadingToast('数据加载中');
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                api.hideLoadingToast();
                opt.complete && opt.complete();
            }
        });
    },
    /*收货*/
    rmaReturn: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'finance/rma-return',
            type: 'GET',
            data: opt.data || {},
            dataType: 'json',
            beforeSend: function(xhr) {
                api.showLoadingToast('数据加载中');
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                api.hideLoadingToast();
                opt.complete && opt.complete();
            }
        });
    },
    /*折扣退款财务报表*/
    rmaDiscount: function(opt) {
        api.ajax({
            url: this.ajaxUrl + 'finance/rma-discount',
            type: 'GET',
            data: opt.data || {},
            dataType: 'json',
            beforeSend: function(xhr) {
                api.showLoadingToast('数据加载中');
                $.type(opt.beforeSend) === 'function' && opt.beforeSend(xhr);
            },
            success: function(res) {
                opt.success && opt.success(res);
            },
            complete: function() {
                api.hideLoadingToast();
                opt.complete && opt.complete();
            }
        });
    },
    /*获取用户权限列表*/
    getUserPermissionList: function(cb) {
        var getPermissionMap = function(permissionList) {
            var p;
            var permissionMap = {};
            var permissionArr = [];
            for (var i = 0; i < permissionList.length; i++) {
                p = permissionList[i];
                permissionMap[p.id] = { label: p.label };
                permissionArr.push(p.id);
            }
            api.local('permission_list', permissionArr); //用于按钮级别的权限验证
            top.pMap = window.pMap = permissionMap;
            return permissionMap;
        }
        api.ajaxGateWay({
            url: 'permission.getMyPermissionList',
            success: function(res) {
                if (res.error_num !== 0) {
                    api.alert(res.error_info);
                    return;
                }
                cb && cb(getPermissionMap(res.content));
            },
            error: function() {
                api.alert('权限获取失败请重试');
            }
        });
    },
    //查看用户是否拥有某个权限
    //
    permission: function(o) {
        var pl = api.local('permission_list'),
            flag = true;
        if (pl) {
            pl = JSON.parse(pl);
            return pl.indexOf(o) > -1;
        }
        top.location.href = "./login.html";
    },
    isEmail: function(email) {
        return /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/.test(email);
    },
    //运算
    add: function(a, b) {
        var c, d, e;
        try {
            c = a.toString().split(".")[1].length;
        } catch (f) {
            c = 0;
        }
        try {
            d = b.toString().split(".")[1].length;
        } catch (f) {
            d = 0;
        }
        return e = Math.pow(10, Math.max(c, d)), (api.mul(a, e) + api.mul(b, e)) / e;
    },
    sub: function(a, b) {
        var c, d, e;
        try {
            c = a.toString().split(".")[1].length;
        } catch (f) {
            c = 0;
        }
        try {
            d = b.toString().split(".")[1].length;
        } catch (f) {
            d = 0;
        }
        return e = Math.pow(10, Math.max(c, d)), (api.mul(a, e) - api.mul(b, e)) / e;
    },
    mul: function(a, b) {
        var c = 0,
            d = a.toString(),
            e = b.toString();
        try {
            c += d.split(".")[1].length;
        } catch (f) {}
        try {
            c += e.split(".")[1].length;
        } catch (f) {}
        return Number(d.replace(".", "")) * Number(e.replace(".", "")) / Math.pow(10, c);
    },
    div: function(a, b) {
        var c, d, e = 0,
            f = 0;
        try {
            e = a.toString().split(".")[1].length;
        } catch (g) {}
        try {
            f = b.toString().split(".")[1].length;
        } catch (g) {}
        return c = Number(a.toString().replace(".", "")), d = Number(b.toString().replace(".", "")), api.mul(c / d, Math.pow(10, f - e));
    }
}

// 栗子：Format('yyyy-MM-dd hh:mm:ss') 位数要写满
Date.prototype.Format = function(fmt) {
    fmt = fmt ? fmt : 'yyyy-MM-dd hh:mm:ss';
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
// 在当前时间的基础上前进后退日期
// 栗子：date.addDays(15) date后15日
//      date.addDays(-3) date前3日
Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + Number(days));
    return this;
}

var Yit = {} || Yit;
Yit.log = function(obj) {
    console.log(JSON.parse(JSON.stringify(obj)));
};

(function() {
    if (!$('.back-top').length) {
        $('body').append('<div class="back-top"></div>');
    }

    // 返回顶部
    $(window).scroll(function() {
        showBackTop();
    });

    function showBackTop() {
        if ($(window).scrollTop() > 150) {
            $('.back-top').stop().fadeIn();
        } else {
            $('.back-top').stop().fadeOut();
        }
    }
    showBackTop();

    var timer;
    $('.back-top').on('click', function(event) {
        event.stopPropagation();
        $('html, body').animate({
            scrollTop: 0
        }, 800);
    });
})()

window.deepCopy = function(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// 这个方法帮助把 '1,2,3' 这样的字符串转换成 [1,2,3] 的数组
window.str2Arr = function(string, seperator) {
    if (['string', 'number'].indexOf(typeof string) == -1) {
        return string;
    }
    string = String(string);
    if (string == '') {
        return [];
    }
    // 如果指定了seperator，就按指定的seperator来处理，否则就只处理中英文两种逗号和空格
    if (seperator && seperator.length) {
        seperator.forEach((s) => {
            string = string.replace(new RegExp(`\\${s}`, 'g'), ',');
        });
    } else {
        string = string.replace(/，/g, ',').replace(/\s/g, ',');
    }
    let arr = string.split(',');
    return arr.map((s) => {
        return Number(s);
    });
}

// 数组去重
function unique(a) { 
    var res = [];
    for (var i = 0; i < a.length; i++) {
        if (res.indexOf(a[i]) == -1) {
            res.push(a[i]);
        }
    }
    return res;
}

/*
* 频率控制 返回函数连续调用时，fn 执行频率限定为每多少时间执行一次
* @param fn {function}  需要调用的函数
* @param delay  {number}    延迟时间，单位毫秒
* @param immediate  {bool} 给 immediate参数传递false 绑定的函数先执行，而不是delay后后执行。
* @return {function}实际调用函数
*/
//demo http://jsbin.com/mujorezice/2/edit
window._throttle = function (fn,delay, immediate, debounce) {
   var curr = +new Date(),//当前事件
       last_call = 0,
       last_exec = 0,
       timer = null,
       diff, //时间差
       context,//上下文
       args,
       exec = function () {
           last_exec = curr;
           fn.apply(context, args);
       };
   return function () {
       curr= +new Date();
       context = this,
       args = arguments,
       diff = curr - (debounce ? last_call : last_exec) - delay;
       clearTimeout(timer);
       if (debounce) {
           if (immediate) {
               timer = setTimeout(exec, delay);
           } else if (diff >= 0) {
               exec();
           }
       } else {
           if (diff >= 0) {
               exec();
           } else if (immediate) {
               timer = setTimeout(exec, -diff);
           }
       }
       last_call = curr;
   }
};
 
/*
* 空闲控制 返回函数连续调用时，空闲时间必须大于或等于 delay，fn 才会执行
* @param fn {function}  要调用的函数
* @param delay   {number}    空闲时间
* @param immediate  {bool} 给 immediate参数传递false 绑定的函数先执行，而不是delay后后执行。
* @return {function}实际调用函数
*/
//demo http://jsbin.com/mujorezice/2/edit
window._debounce = function (fn, delay, immediate) {
   return _throttle(fn, delay||300, immediate, true);
};