function FdmNetworkRequestsMonitor(nhManager)
{
    this.nhManager = nhManager;
}

FdmNetworkRequestsMonitor.prototype = new NetworkRequestsMonitor;

FdmNetworkRequestsMonitor.prototype.onNewRequest = function (
    requestId, url, tabUrl)
{
    var task = new FdmBhNewNetworkRequestNotification;
    task.network_request_notification.requestId = requestId;
    task.setInfo(url, tabUrl);
    this.nhManager.postMessage(task);
}

function HttpHeadersToString(hdrs)
{
    var result = "";
    for (var key in hdrs)
    {
        var hdr = hdrs[key];
        if (hdr.name && hdr.value)
        {
            result += hdr.name;
            result += ": ";
            result += hdr.value;
            result += "\r\n";
        }
    }
    return result;
}

function PathFromUrl(url)
{
    var index = url.indexOf("://");
    if (index == -1)
        return url;
    index = url.indexOf("/", index+3);
    if (index == -1)
        return "/";
    return url.substr(index, url.length - index);
}

FdmNetworkRequestsMonitor.prototype.onGotHeaders = function (
    requestId, url, 
    requestMethod, requestHeaders, 
    responseStatusLine, responseHeaders)
{
    var task = new FdmBhNetworkRequestResponseNotification;

    var rqh = requestMethod + " " + PathFromUrl(url) + " HTTP/1.1\r\n";
    rqh += HttpHeadersToString(requestHeaders) + "\r\n";

    var rsh = responseStatusLine + "\r\n" + 
        HttpHeadersToString(responseHeaders) + "\r\n";

    task.setInfo(requestId, url, rqh, rsh);

    this.nhManager.postMessage(task);
}