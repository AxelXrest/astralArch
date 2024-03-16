function FdmSchemeHandler(nhManager)
{
    this.nhManager = nhManager;
}

FdmSchemeHandler.prototype.initialize = function()
{
    browser.runtime.onMessage.addListener(this.onMessage.bind(this));

    browser.webRequest.onBeforeRequest.addListener(
        this.onBeforeRequest.bind(this),
        { urls: ["<all_urls>"] },
        ["blocking"]);
};

FdmSchemeHandler.prototype.onMessage = function(request, sender, sendResponse)
{
    if (request.type == "fdm_scheme")
        this.sendUrlToFdm(request.url);
};

FdmSchemeHandler.prototype.onBeforeRequest = function (details)
{
    if (details.url.indexOf("fdmguid=6d36f5b5519148d69647a983ebd677fc") != -1)
    {
        this.sendUrlToFdm(details.url);
        return { redirectUrl: "javascript:" };
    }
};

FdmSchemeHandler.prototype.sendUrlToFdm = function(url)
{
    var dojob = function (cookies)
    {
        var task = new FdmBhCreateDownloadsTask;
        var downloadInfo = new DownloadInfo(url, "", "");
        downloadInfo.userAgent = navigator.userAgent;
        if (cookies)
            downloadInfo.httpCookies = cookies;
        task.addDownload(downloadInfo);
        this.nhManager.postMessage(task);
    }.bind(this);

    if (url.substr(0, 4) != "fdm:")
    {
        var cm = new CookieManager;
        cm.getCookiesForUrl(url, dojob);
    }
    else
    {
        dojob();
    }    
};