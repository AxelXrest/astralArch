function FdmDownloadsInterceptManager(settingsPageHlpr, tabsMgr)
{
    this.allowBrowserDownload = true;
    this.settingsPageHlpr = settingsPageHlpr;
    this.tabsMgr = tabsMgr;
}

FdmDownloadsInterceptManager.prototype = new DownloadsInterceptManager();

FdmDownloadsInterceptManager.prototype.setNativeHostManager = function(mgr)
{
    this.nhManager = mgr;
};

FdmDownloadsInterceptManager.prototype.onDownloadIntercepted = function(
    downloadInfo, details, callbackFn)
{
    downloadInfo.userAgent = navigator.userAgent;
    var cm = new CookieManager;
    cm.getCookiesForUrl(
        downloadInfo.url,
        function (cookies)
        {
            downloadInfo.httpCookies = cookies;
            var task = new FdmBhCreateDownloadsTask;
            task.create_downloads.catchedDownloads = "1";
            task.create_downloads.waitResponse = "1";
            task.addDownload(downloadInfo);
            this.nhManager.postMessage(
                task,
                // callbackFn
                function (resp)
                {
                    var cancelled = resp.result == "0";
                    if (resp.error || (cancelled && this.allowBrowserDownload))
                        this.returnDownload(downloadInfo, details);
                }.bind(this)
            );
        }.bind(this));
}
