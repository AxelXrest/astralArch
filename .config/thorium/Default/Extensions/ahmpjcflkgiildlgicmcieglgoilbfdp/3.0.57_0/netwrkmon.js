function NetworkRequestsMonitor()
{
    this.requestsHeaders = new Map;
    this.requestsMethods = new Map;
}

NetworkRequestsMonitor.prototype.initialize = function()
{
    browser.webRequest.onSendHeaders.addListener(
        this.onSendHeaders.bind(this), 
        { urls: ["<all_urls>"] },
        ["requestHeaders"]);

    browser.webRequest.onResponseStarted.addListener(
        this.onResponseStarted.bind(this),
        { urls: ["<all_urls>"] },
        ["responseHeaders"]);

    browser.webRequest.onErrorOccurred.addListener(
        this.onErrorOccurred.bind(this),
        { urls: ["<all_urls>"] });
}

NetworkRequestsMonitor.prototype.idoneousRequest = function(details)
{
    return details.tabId != -1;
}

NetworkRequestsMonitor.prototype.onSendHeaders = function(details)
{
    if (!this.idoneousRequest(details))
        return;
    this.requestsHeaders.set(details.requestId, details.requestHeaders);
    this.requestsMethods.set(details.requestId, details.method);

    setTimeout(this.waitingTimeoutOccurred.bind(this, details.requestId), 120000);

    try
    {
        browser.tabs.get(details.tabId, function (tab)
        {
            if (tab)
            {
                this.onNewRequest(details.requestId, details.url,
                    tab.url ? tab.url : "");
            }
        }.bind(this));
    }
    catch(err)
    {

    }
}

NetworkRequestsMonitor.prototype.onResponseStarted = function(details)
{
    if (!this.idoneousRequest(details))
        return;
    if (!this.requestsHeaders.has(details.requestId))
        return;
    this.onGotHeaders(
        details.requestId,
        details.url,
        this.requestsMethods.get(details.requestId),
        this.requestsHeaders.get(details.requestId),
        details.statusLine,
        details.responseHeaders);
    this.onRequestClosed(details.requestId);
}

NetworkRequestsMonitor.prototype.onErrorOccurred = function(details)
{
    if (!this.idoneousRequest(details))
        return;
    this.onRequestClosed(details.requestId);
}

NetworkRequestsMonitor.prototype.waitingTimeoutOccurred = function(request_id)
{
    this.onRequestClosed(request_id);
}

NetworkRequestsMonitor.prototype.onRequestClosed = function(requestId)
{
    this.requestsHeaders.delete(requestId);
    this.requestsMethods.delete(requestId);
}

NetworkRequestsMonitor.prototype.onNewRequest = function(
    requestId, url, tabUrl)
{

}

NetworkRequestsMonitor.prototype.onGotHeaders = function(
    requestId, url,
    requestMethod, requestHeaders,
    responseStatusLine, responseHeaders)
{

}