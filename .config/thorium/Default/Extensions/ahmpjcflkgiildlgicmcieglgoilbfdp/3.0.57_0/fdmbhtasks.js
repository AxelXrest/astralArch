function FdmBhIpcTask (id, type)
{
    this.id = id || 0;
    this.type = type || "";
    if (typeof this.id == "number")
        this.id = this.id.toString ();
}

function FdmBhHandshakeTask (id)
{
    FdmBhIpcTask.call (this, id, "handshake");
    this.handshake = new Object;
    this.handshake.api_version = "1";
    this.handshake.browser = window.browserName;
}

function FdmBhUiStringsTask (id)
{
    FdmBhIpcTask.call (this, id, "ui_strings");
}

function FdmBhQuerySettingsTask (id)
{
    FdmBhIpcTask.call (this, id, "query_settings");
}

function FdmBhPostSettingsTask (id)
{
    FdmBhIpcTask.call (this, id, "post_settings");

    this.setSettings = function(s)
    {
    	this.post_settings = s;
    };
}

function FdmBhJsonTask (id)
{
    FdmBhIpcTask.call (this, id, "fdm_json_task");

    this.setJson = function(obj)
    {
    	this.json = JSON.stringify(obj);
    };
}

function FdmBhShutdownTask (id)
{
    FdmBhIpcTask.call (this, id, "shutdown");
}

function FdmBhCreateDownloadsTask (id)
{
    FdmBhIpcTask.call (this, id, "create_downloads");
    
    this.create_downloads = new Object;
    this.create_downloads.downloads = [];

    this.addDownload = function (download)
    {
        if (!download instanceof DownloadInfo)
            throw "invalid type";
        this.create_downloads.downloads.push (download);
    };
    
    this.hasDownloads = function ()
    {
        return this.create_downloads.downloads.length != 0;
    };
}

function FdmBhBrowserProxyTask (id)
{
    FdmBhIpcTask.call (this, id, "browser_proxy");
    
    this.setProxy = function (proxy)
    {
        this.browser_proxy = new Object;
        this.browser_proxy.type = proxy.type.toString();
        this.browser_proxy.protocol = proxy.protocol;
        this.browser_proxy.addr = proxy.addr;
        this.browser_proxy.port = proxy.port.toString();
    };
}

function FdmBhWindowTask (id)
{
    FdmBhIpcTask.call (this, id, "window");
    this.window = new Object;
    
    this.showWindow = function (handle, show, needWait)
    {
        this.window.windowHandle = handle;
        this.window.action = show ? "show" : "hide";
        this.window.needWait = needWait ? "1" : "0";
    };
}

function FdmBhVideoSnifferTask (id)
{
    FdmBhIpcTask.call (this, id, "video_sniffer");
    
    this.setRequest = function (req)
    {
        this.video_sniffer = req;
    };
}

function FdmBhSniffDllIsVideoFlashRequest(
	webPageUrl, frameUrl, swfUrl,
	flashVars, otherSwfUrls, otherFlashVars)
{
    this.name = "IsVideoFlash";
    this.webPageUrl = webPageUrl;
    this.frameUrl = frameUrl;
    this.swfUrl = swfUrl;
    this.flashVars = flashVars;
    this.otherSwfUrls = otherSwfUrls;
    this.otherFlashVars = otherFlashVars;
}

function FdmBhSniffDllCreateVideoDownloadFromUrlRequest(
	webPageUrl, frameUrl, swfUrl,
	flashVars, otherSwfUrls, otherFlashVars)
{
    this.name = "CreateVideoDownloadFromUrl";
    this.webPageUrl = webPageUrl;
    this.frameUrl = frameUrl;
    this.swfUrl = swfUrl;
    this.flashVars = flashVars;
    this.otherSwfUrls = otherSwfUrls;
    this.otherFlashVars = otherFlashVars;
}

function FdmBhNetworkRequestNotification (id, type)
{
    FdmBhIpcTask.call (this, id, "network_request_notification");
    this.network_request_notification = new Object;
    this.network_request_notification.type = type;
}

function FdmBhNewNetworkRequestNotification (id)
{
    FdmBhNetworkRequestNotification.call (this, id, "new");
    
    this.setInfo = function (url, srcTabUrl)
    {
        this.network_request_notification.url = url;
        this.network_request_notification.srcTabUrl = srcTabUrl;
    };
}

function FdmBhNetworkRequestActivityNotification (id)
{
    FdmBhNetworkRequestNotification.call (this, id, "activity");
    
    this.setInfo = function (url)
    {
        this.network_request_notification.url = url;
    };
}

function FdmBhNetworkRequestResponseNotification (id)
{
    FdmBhNetworkRequestNotification.call (this, id, "response");
    
    this.setInfo = function (requestId, url, requestHeaders, responseHeaders)
    {
        this.network_request_notification.requestId = requestId;
        this.network_request_notification.url = url;
        this.network_request_notification.requestHeaders = requestHeaders;
        this.network_request_notification.responseHeaders = responseHeaders;
    };
}

function FdmBhNetworkRequestResponseDataNotification (id)
{
    FdmBhNetworkRequestNotification.call (this, id, "response_data");
    
    this.setInfo = function (requestId, data)
    {
        this.network_request_notification.requestId = requestId;
        this.network_request_notification.data = data;
    };
}

function FdmBhNetworkRequestResponseCompleteNotification (id)
{
    FdmBhNetworkRequestNotification.call (this, id, "response_complete");
    
    this.setInfo = function (requestId)
    {
        this.network_request_notification.requestId = requestId;
    };
}

function FdmBhBrowserDownloadStateReport (id)
{
    FdmBhIpcTask.call (this, id, "browser_download_state_report");
    this.browser_download_state_report = new Object;
    
    this.setInfo = function (url, state)
    {
        this.browser_download_state_report.url = url;
        this.browser_download_state_report.state = state;
    };
}