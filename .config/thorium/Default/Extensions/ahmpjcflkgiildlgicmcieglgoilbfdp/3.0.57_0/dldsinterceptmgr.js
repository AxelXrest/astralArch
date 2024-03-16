function DownloadsInterceptManager()
{
    this.enable = false;
    this.pauseCatchingForAllSites = false;
    this.skipSmaller = 0;
    this.skipExts = "";
    this.skipHosts = [];
    this.returningDownloads = [];
    /* @requestDetailsByRequestId - simple map of requestId -> request details (including postData) for interception in Firefox */
    this.requestDetailsByRequestId = new Map;
    /* @requestDetailsByRequestUrl - saves request details (including postData) by url for interception in Chrome, because of requestId cannot be used */
    this.requestDetailsByRequestUrl = [];
    this.requestsHeaders = new Map;
    // this.redirectedUrls = new Map;
    this.supportsDeterminingFilename =
        browser.downloads &&
        browser.downloads.onDeterminingFilename;

    this.lastDownload = false;

    this.DONT_SHOW_NOTIFICATION_AGAIN_LOCALSTORAGE_KEY = "dontShowNotificationAgain";
}

DownloadsInterceptManager.prototype.initialize = function()
{
    if (this.supportsDeterminingFilename)
    {
        browser.downloads.onDeterminingFilename.addListener(
            this.onDeterminingFilename.bind(this));
    }
    browser.webRequest.onBeforeSendHeaders.addListener(
        this.onBeforeSendHeaders.bind(this),
        { urls: ["<all_urls>"] },
        ["requestHeaders", "blocking"]);
    // for special processing for redirects & POST requests
    browser.webRequest.onBeforeRequest.addListener(
        this.onBeforeRequest.bind(this),
        { urls: ["<all_urls>"] },
        ["requestBody"]);
    browser.webRequest.onSendHeaders.addListener(
        this.onSendHeaders.bind(this),
        { urls: ["<all_urls>"] },
        ["requestHeaders"]);
    browser.webRequest.onHeadersReceived.addListener(
        this.onHeadersReceived.bind(this),
        { urls: ["<all_urls>"] },
        ["blocking", "responseHeaders"]);
};

DownloadsInterceptManager.prototype.returningDownloadIndexByOriginalUrl = function(
    url)
{
    for (var i = 0; i < this.returningDownloads.length; ++i)
    {
        if (this.returningDownloads[i].originalUrl == url)
            return i;
    }
    return -1;
};

DownloadsInterceptManager.prototype.removeRequestDetailsByOriginalUrl = function(
    url, time)
{
    var index = this.requestDetailsByRequestUrl.findIndex(item => (item.time === time && item.url === url));
    if (index !== -1) {
        this.requestDetailsByRequestUrl.splice(index, 1);
    }
};

DownloadsInterceptManager.prototype.requestDetailsIndexByOriginalUrl = function(
    url)
{
    var currentIndex = -1;
    for (var key in this.requestDetailsByRequestUrl) {
        var item = this.requestDetailsByRequestUrl[key];
        if (item.url === url && (currentIndex === -1 || item.time > this.requestDetailsByRequestUrl[currentIndex].time)) {
            currentIndex = key;
        }
    }
    return currentIndex;
};

DownloadsInterceptManager.prototype.inSkipList = function(
    url, filename)
{
    if (this.skipExts != "")
    {
        var str = filename ? filename : url;
        var rgx = filename ? /(\.([\w\d]+))$/ : /(?:[^\/]+)(\.(\w+))(?:\?.+)?(?:#.+)?$/;
        var match = rgx.exec(str);
        if (match && match.length === 3)
        {
            if (this.skipExts.indexOf(match[1].toLowerCase()) != -1 || // .ext
                this.skipExts.indexOf(match[2].toLowerCase()) != -1)   //  ext
            {
                return true;
            }
        }
    }

    if (url)
    {
        // workaround for other possible hosts like MEGA.nz
        // Added blob to exclude other protocols as well
        if (url.toLowerCase().indexOf("filesystem:") == 0
            || url.toLowerCase().indexOf("blob:") == 0
            || url.toLowerCase().indexOf("data:") == 0)
        {
            return true;
        }

        if (this.skipServersEnabled && fdmExtUtils.urlInSkipServers(this.skipHosts, url)) {
            return true;
        }

        // if (this.skipHosts)
        // {
        //     var host = fdmExtUtils.getHostFromUrl(url).toLowerCase();
        //
        //     var skip = false;
        //     this.skipHosts.forEach(function (hostToSkip)
        //     {
        //         var domainWithSubdomains = new RegExp('^(?:[\\w\\d\\.]*\\.)?' + hostToSkip + '$', 'i');
        //         var match = domainWithSubdomains.exec(host);
        //         if (match)
        //             skip = true;
        //     });
        //
        //     if (skip)
        //         return true;
        // }
    }

    return false;
};

DownloadsInterceptManager.prototype.onDeterminingFilename = function(
    downloadItem, suggest)
{
	var details;
    var requestDetailsIndex = this.requestDetailsIndexByOriginalUrl(
        downloadItem.finalUrl);
    if (requestDetailsIndex !== -1)
    {
		details = this.requestDetailsByRequestUrl[requestDetailsIndex];
        this.requestDetailsByRequestUrl.splice(requestDetailsIndex, 1);
    }
    
    if (!this.enable)
        return;
    if (this.pauseCatchingForAllSites)
        return;

    /* 
        According to documentation, downloadItem.totalBytes should be -1 when it is unknown: 
        https://developer.chrome.com/extensions/downloads#type-DownloadItem 
        However, here's an example where it is 0: http://www.sample-videos.com/ -- any file
    */

    if (downloadItem.totalBytes != 0 && downloadItem.totalBytes != -1 && downloadItem.totalBytes < this.skipSmaller)
        return;

    if (downloadItem.url.indexOf("google.com") != -1 && (
            downloadItem.mime.indexOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") != -1
            || downloadItem.mime.indexOf("application/vnd.ms-") != -1)) {
        return;
    }

    if (this.inSkipList(downloadItem.url, downloadItem.filename)) {
        suggest(downloadItem);
        return;
    }

    if (this.inSkipList(downloadItem.referrer, downloadItem.filename)) {
        suggest(downloadItem);
        return;
    }

    if (details && details.documentUrl && this.inSkipList(details.documentUrl, downloadItem.filename)) {
        suggest(downloadItem);
        return;
    }

    var returningDownloadIndex = this.returningDownloadIndexByOriginalUrl(
        downloadItem.url);
    if (returningDownloadIndex != -1)
    {
        if (!--this.returningDownloads[returningDownloadIndex].refCount)
            this.returningDownloads.splice(returningDownloadIndex, 1);
        suggest(downloadItem);
        return;
    }

    if (this.lastDownload && this.lastDownload.url === downloadItem.url
        && this.lastDownload.timestamp + 5 * 60 * 1000 >= + new Date) {

        browser.storage.sync.get([this.DONT_SHOW_NOTIFICATION_AGAIN_LOCALSTORAGE_KEY], function(values) {

            if (!values[this.DONT_SHOW_NOTIFICATION_AGAIN_LOCALSTORAGE_KEY]) {

                var opt = {
                    type: "basic",
                    title: "FDM extension",
                    message: "Problems downloading from this website?",
                    iconUrl: "fdm48.png",
                    buttons: [{title: "Yes, don’t catch downloads from this website."}, {title: "It's OK, don't ask again."}]
                };

                browser.notifications.create(opt, function (id) {
                    var notificationId = id;

                    var onButtonClicked = function(id, btnNum){
                        if (notificationId === id) {
                            browser.notifications.onButtonClicked.removeListener(onButtonClicked);
                            browser.notifications.onClosed.removeListener(onClosed);

                            if (btnNum === 0) {
                                this.settingsPageHlpr.changeSkipList(downloadItem.url, true);
                                this.settingsPageHlpr.changeSkipList(downloadItem.referrer, true);
                            }

                            if (btnNum === 1) {
                                var newValues = {};
                                newValues[this.DONT_SHOW_NOTIFICATION_AGAIN_LOCALSTORAGE_KEY] = true;
                                browser.storage.sync.set(newValues);
                            }
                        }
                    }.bind(this);

                    var onClosed = function(){
                        if (notificationId === id) {
                            browser.notifications.onButtonClicked.removeListener(onButtonClicked);
                            browser.notifications.onClosed.removeListener(onClosed);
                        }
                    }.bind(this);

                    browser.notifications.onButtonClicked.addListener(onButtonClicked);
                    browser.notifications.onClosed.addListener(onClosed);

                }.bind(this));
            }

        }.bind(this));
    }

    this.lastDownload = {
        url: downloadItem.url,
        timestamp: + new Date
    };

    browser.downloads.cancel(downloadItem.id, function() {
        browser.downloads.erase({ id: downloadItem.id })
    });

    this.onDownloadIntercepted(new DownloadInfo(
        downloadItem.url,
        downloadItem.finalUrl,//this.pullRedirectUrl(downloadItem.url),
        downloadItem.referrer, 
		details && details.postData ? details.postData : "",
		details ? details.documentUrl : "")
        // null,
        // function NativeHostResponse(resp){
        //     if (this.needReturnDownload(resp)) {
        //         suggest(downloadItem);
        //     } else {
        //         browser.downloads.cancel(downloadItem.id, function() {
        //             browser.downloads.erase({ id: downloadItem.id })
        //         });
        //     }
        // }.bind(this)
    );

    return true;
};

// DownloadsInterceptManager.prototype.needReturnDownload = function(resp) {
//     var cancelled = resp.result === "0";
//     return (resp.error || (cancelled && this.allowBrowserDownload));
// };

DownloadsInterceptManager.prototype.returnDownload = function(
    downloadInfo, details)
{
    downloadInfo.refCount = downloadInfo.httpPostData ? 2 : 1;
    this.returningDownloads.push(downloadInfo);

    var info = {};
    info.url = downloadInfo.originalUrl;
    // chrome does not accept referer here
    // see workaround in this.onBeforeSendHeaders.
    //info.headers = [{ name: "Referer", value: downloadInfo.httpReferer }];
    if (downloadInfo.httpPostData && downloadInfo.httpPostData != "")
    {
        info.method = "POST";
        info.body = downloadInfo.httpPostData;
    }

    info.saveAs = true;

    if (details && details.responseHeadersMap && typeof details.responseHeadersMap.has === 'function'
        && details.responseHeadersMap.has("content-disposition")) {

        var disposition = details.responseHeadersMap.get("content-disposition");

        var m = disposition.match(/filename[^;=\n]*=(?:(\\?['"])(.*?)\1|(?:[^\s]+'.*?')?([^;\n]*))/i);
        if (m && m.length && m[3]) {
            info.filename = m[3];
        }
    }

    browser.downloads.download(
        info,
        function (downloadId)
        {
            if (!downloadId)
            {
                alert(browser.i18n.getMessage("addingAfterCancelFailed"));
            }
            else if (!this.supportsDeterminingFilename)
            {
                var returningDownloadIndex = this.returningDownloadIndexByOriginalUrl(info.url);
                if (returningDownloadIndex != -1)
                    this.returningDownloads.splice(returningDownloadIndex, 1);
            }
        }.bind(this, info));

    browser.windows.getCurrent(function(w){
        chrome.windows.update(w.id, {focused: true})
    });
};

DownloadsInterceptManager.prototype.onBeforeSendHeaders = function(
    details)
{
    // set the Referer header when bringing the download back to Chrome

    var returningDownloadIndex = this.returningDownloadIndexByOriginalUrl(
        details.url);
    if (returningDownloadIndex == -1)
        return;

    var referer = this.returningDownloads[returningDownloadIndex].httpReferer;

    var isRefererSet = false;
    var headers = details.requestHeaders;
    var blockingResponse = {};

    for (var i = 0; i < headers.length; ++i)
    {
        if (headers[i].name.toLowerCase() == "referer")
        {
            headers[i].value = referer;
            isRefererSet = true;
            break;
        }
    }

    if (!isRefererSet) {
        headers.push({
            name: "Referer",
            value: referer
        });
    }

    blockingResponse.requestHeaders = headers;
    return blockingResponse;
};

DownloadsInterceptManager.prototype.onBeforeRequest = function(details)
{
	var currentTime = + new Date;
	
	var rd = {
		"url" : details.url, 
		"time": currentTime
	};
	
    rd.documentUrl = details.documentUrl;
    if (!rd.documentUrl && this.tabsMgr && details.tabId !== -1 && this.tabsMgr.tabExists(details.tabId))
        rd.documentUrl = this.tabsMgr.tabs[details.tabId].url;

    if (details.method == "POST")
    {
        rd.postData = "&";
        if (undefined != details.requestBody && undefined != details.requestBody.formData)
        {
            for (var field in details.requestBody.formData)
            {
                for (var i = 0; i < details.requestBody.formData[field].length; ++i)
                {
                    rd.postData += field + "=" +
                            encodeURIComponent(details.requestBody.formData[field][i]) + 
                            "&";
                }
            }
        }
	}
	
	this.requestDetailsByRequestId.set(details.requestId, rd);
    setTimeout(this.requestDetailsByRequestId.delete.bind(this.requestDetailsByRequestId, details.requestId), 120000);
       
    this.requestDetailsByRequestUrl.push(rd);
    setTimeout(this.removeRequestDetailsByOriginalUrl.bind(this, details.url, currentTime), 120000);
};

DownloadsInterceptManager.prototype.onSendHeaders = function(
    details)
{
    if (details.method == "POST" ||
        !this.supportsDeterminingFilename)
    {
        this.requestsHeaders.set(details.requestId, details.requestHeaders);
        setTimeout(this.requestsHeaders.delete.bind(this.requestsHeaders, details.requestId), 120000);
    }
};

DownloadsInterceptManager.prototype.onHeadersReceived = function(
    details)
{
    // if (details.statusLine.indexOf("301") != -1 || details.statusLine.indexOf("302") != -1)
    // since v43
    // if (details.statusCode == 301 || details.statusCode == 302)
    //     this.onRedirectHeadersReceived(details);
    
    if (!this.supportsDeterminingFilename)
        return this.interceptIfRequiredByHeaders(details);

    // setTimeout(this.clearRedirectHeadersReceived.bind(this, details), 2000);
};

// DownloadsInterceptManager.prototype.clearRedirectHeadersReceived = function(
//     details)
// {
//     this.redirectedUrls.forEach(function(value, key){
//         if (details.url === value) {
//             this.redirectedUrls.delete(key);
//         }
//     }.bind(this))
// };

// DownloadsInterceptManager.prototype.onRedirectHeadersReceived = function(
//     details)
// {
//     var url = "";
//     for (var i = 0; i < details.responseHeaders.length; ++i)
//     {
//         if (details.responseHeaders[i].name.toLowerCase() == "location")
//         {
//             url = details.responseHeaders[i].value;
//             var re = /http(s?):\/\//;
//             // if Path is relative, then add domain.
//             if (!re.test(url))
//                 url = fdmExtUtils.normalizeRedirectURL(url, details.url);
//             break;
//         }
//     }
//     if (url != "") {
//         this.redirectedUrls.set(details.url, url);
//         setTimeout(function () {
//             if (this.redirectedUrls.has(details.url)){
//                 this.redirectedUrls.delete(details.url);
//             }
//         }.bind(this), 120000);
//     }
// };

// DownloadsInterceptManager.prototype.pullRedirectUrl = function(url)
// {
//     var result;
//     if (this.redirectedUrls.has(url))
//     {
//         result = this.redirectedUrls.get(url);
//         this.redirectedUrls.delete(url);
//     }
//     return result || "";
// };

DownloadsInterceptManager.prototype.responseHeadersToMap = function(responseHeadersArr)
{
    if (!responseHeadersArr || !responseHeadersArr.length)
        return new Map();

    var headers_map = new Map();

    for (var i = 0; i < responseHeadersArr.length; i++)
    {
        headers_map.set(responseHeadersArr[i].name.toLowerCase(), responseHeadersArr[i].value);
    }

    return headers_map;
};

DownloadsInterceptManager.prototype.interceptIfRequiredByHeaders = function(
    details)
{
    var result;

    if (details.tabId < 0)
        return;

    var in_skip_list = false;
    if (this.inSkipList(details.url)) {
        in_skip_list = true;
    } else if (details.originUrl && this.inSkipList(details.originUrl)) {
        in_skip_list = true;
    }

    if (this.enable && !this.pauseCatchingForAllSites &&
        !in_skip_list)
    {
        var file = false;
        var noContentLengthLimits = false;

        if (details.type != "xmlhttprequest" && 
            (details.method == "POST" || details.type == 'main_frame' || details.type == 'sub_frame'))
        {
            var responseHeadersMap = this.responseHeadersToMap(details.responseHeaders);
            details.responseHeadersMap = responseHeadersMap;

            if (responseHeadersMap.has("content-disposition"))
            {
                file = true;
            }

            // prevent AJAX from breaking
            if (responseHeadersMap.has("content-type"))
            {
                var ct = responseHeadersMap.get("content-type").toLowerCase();
                if (ct.indexOf("json") != -1 ||
                    ct.indexOf("image/") != -1 ||
                   (ct.indexOf("text") != -1 && ct.indexOf("text/x-sql") == -1) ||
                    ct.indexOf("javascript") != -1 ||
                    ct.indexOf("application/x-protobuf") != -1 ||
                    ct.indexOf("application/binary") != -1 ||
                    ct.indexOf("application/pdf") != -1
                    || (details.url.indexOf("google.com") != -1 && (
                        ct.indexOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") != -1
                        || ct.indexOf("application/vnd.ms-") != -1)))
                {
                    file = false;
                }
                else if (ct.indexOf("application/x-bittorrent") != -1) 
                {
                    file = true;
                    noContentLengthLimits = true;
                }
                else if (details.method != "POST" && ct.indexOf("application") != -1)
                {
                    file = true;
                }
            }

            if (file && !this.supportsDeterminingFilename)
            {
                if (responseHeadersMap.has("content-length"))
                {
                    if (!noContentLengthLimits) {
                        var l = parseInt(responseHeadersMap.get("content-length"));
                        if (l < 1024 * 1024)
                            file = false; // we prefer to not intercept something we should rather than intercept something we shouldn't
                        else if (l < this.skipSmaller)
                            file = false;
                    }
                }
                else
                {
                    // we prefer to not intercept something we should rather than intercept something we shouldn't
                    file = false;
                }
            }
        }

        if (file)
        {
            var returningDownloadIndex = this.returningDownloadIndexByOriginalUrl(
                details.url);
            if (returningDownloadIndex != -1)
            {
                if (!--this.returningDownloads[returningDownloadIndex].refCount)
                    this.returningDownloads.splice(returningDownloadIndex, 1);
            }
            else
            {
                var referrer = "";
                if (this.requestsHeaders.has(details.requestId))
                {
                    var r = this.requestsHeaders.get(details.requestId);
                    for (var j = 0; j < r.length; ++j)
                    {
                        var rheader = r[j];
                        if (rheader.name.toLowerCase() == "referrer" ||
                            rheader.name.toLowerCase() == "referer")
                            referrer = rheader.value;
                    }
                }
				
				var rd = this.requestDetailsByRequestId.get(details.requestId);

                var downloadInfo = new DownloadInfo(
                    details.url,
                    "",
                    referrer,
                    rd ? rd.postData : "",
					rd ? rd.documentUrl : "");

                this.onDownloadIntercepted(downloadInfo, details
                    // function NativeHostResponse(resp){
                    //     if (this.needReturnDownload(resp)) {
                    //         this.returnDownload(downloadInfo, details);
                    //     }
                    // }.bind(this)
                );

                if (details.method === "POST")
                {
                    if (referrer)
                    {
                        // When referrer is empty, it just "redirects" to some empty page with chrome://extension as the URL (someone was complaining about that?)
                        browser.tabs.update(details.tabId, { 'url': referrer });
                    }

                    // Used to be cancel: true, but it messes up the tab ("Extension disabled the request" or smth like that) http://stackoverflow.com/a/18684302
                    result = { 'redirectUrl': "javascript:" };
                }
                else
                {
                    result = { 'cancel': true };
                }
            }
        }
    }

    this.requestDetailsByRequestId.delete(details.requestId);
    this.requestsHeaders.delete(details.requestId);

    return result;
};
