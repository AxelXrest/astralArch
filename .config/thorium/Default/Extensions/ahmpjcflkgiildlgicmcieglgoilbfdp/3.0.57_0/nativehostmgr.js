// "request" = "task" = "message" :)

function FdmNativeHostManager()
{
    this.portFailed = false;
    this.legacyPort = false;
    this.hasNativeHost = false;
    this.ready = false;
    this.scheduledRequests = new Array;
    this.requestsManager = new RequestsManager;
    this.handshakeResp = {};
    this.requestsManager.sendRequest = function(req)
    {
        this.port.postMessage(req);
    }.bind (this);
}

FdmNativeHostManager.prototype.restartIfNeeded = function()
{
    console.log("restart if needed + " + this.portFailed);
    if (this.portFailed)
        this.initialize();
};

FdmNativeHostManager.prototype.initialize = function()
{
    this.port = browser.runtime.connectNative('org.freedownloadmanager.fdm5.cnh');
    this.port.onMessage.addListener(
        this.onPortMessage.bind(this));
    this.port.onDisconnect.addListener(
        this.onPortDisconnect.bind(this));
    this.requestsManager.performRequest(
        new FdmBhHandshakeTask(),
        this.onGotHandshake.bind(this)
    );
}

FdmNativeHostManager.prototype.onGotHandshake = function(resp)
{
    if (resp.error)
        return;

    this.ready = true;
    this.onReady();
    for (var i = 0; i < this.scheduledRequests.length; i++)
        this.postMessage(this.scheduledRequests[i].task, this.scheduledRequests[i].callback);
    this.scheduledRequests = [];
    this.handshakeResp = resp;

    if (typeof this.onInitialized == 'function')
        this.onInitialized();
}

FdmNativeHostManager.prototype.onGotSettings = function(resp)
{

}

FdmNativeHostManager.prototype.onReady = function()
{

}

FdmNativeHostManager.prototype.onPortMessage = function(msg)
{
    this.portFailed = false;

    this.hasNativeHost = true;
    if (!msg.id && msg.type == "query_settings")
    {
        this.onGotSettings(msg);
        return;
    }
    this.requestsManager.onRequestResponse(msg);
}

FdmNativeHostManager.prototype.onPortDisconnect = function(msg)
{
    this.portFailed = true;

    var errmsg = "";
    try {
        errmsg = browser.runtime.lastError.message;
    } catch (e) { }
    var tryLegacy = false;

    console.log(errmsg);

    if (errmsg.indexOf("Access") != -1)
    {
        console.log(browser.i18n.getMessage("installCorrupted"));
    }
    else if (errmsg.indexOf("not found") != -1)
    {
        tryLegacy = true;
    }
    else
    {
        console.log(browser.i18n.getMessage("installUnknownError") + "\n" + errmsg);
        if (!this.hasNativeHost)
            tryLegacy = true;
    }
    this.closeRequestsInProgress();
    if (tryLegacy)
        this.initializeLegacy();
}

FdmNativeHostManager.prototype.closeRequestsInProgress = function()
{
    this.requestsManager.closeRequestsInProgress(
        function (id, callback)
    {
        if (callback)
        {
            var resp = new Object;
            resp.id = id;
            resp.error = "ipc failure";
            callback (resp);
        }				
    });
}

FdmNativeHostManager.prototype.initializeLegacy = function()
{
    this.legacyPort = true;
    this.requestsManager.idsAsStrings = false;
    this.port = browser.runtime.connectNative('com.vms.fdm');

    this.port.onMessage.addListener(
        this.onLegacyPortMessage.bind(this));
    this.port.onDisconnect.addListener(
        this.onLegacyPortDisconnect.bind(this));
}

FdmNativeHostManager.prototype.onLegacyPortMessage = function(msg)
{
    this.hasNativeHost = true;

    switch (msg.id)
    {
        case -2:  // initialization
            this.onGotLegacySettings(msg);
            if (!this.ready)
                this.onGotHandshake({ error: "" });
            break;

        case -1:  // [download from(?)] menu
            break;

        default:
            this.requestsManager.onRequestResponse(msg);
            break;
    }
}

FdmNativeHostManager.prototype.onGotLegacySettings = function(msg)
{
    this.legacySettings = {
        id: "",
        type: "query_settings",
        error: "",
        result: "",
        settings: {
            browser: {
                menu: {
                    dllink: msg.result.menu._this.toString(),
                    dlall: msg.result.menu.all.toString(),
                    dlselected: msg.result.menu.selected.toString(),
                    dlvideo: msg.result.menu.flash_video.toString(),
                    dlpage: msg.result.menu.page.toString()
                },
                monitor: {
                    enable: msg.result.monitor.toString(),
                    allowDownload: msg.result.allow_download.toString(),
                    skipSmallerThan: msg.result.skip_smaller.toString(),
                    skipExtensions: msg.result.skip_extensions || "",
                    skipServersEnabled: "1",
                    needAlt: msg.result.alt_pressed.toString()
                }
            }
        }
    };

    if (this.ready)
        this.onGotSettings(this.legacySettings);
}

FdmNativeHostManager.prototype.onLegacyPortDisconnect = function(msg)
{
    this.portFailed = true;
    
    var errmsg = "";
    try {
        errmsg = browser.runtime.lastError.message;
    }catch(e) {}
    if (errmsg.indexOf("Access") != -1)
    {
        console.log(browser.i18n.getMessage("installCorrupted"));
    }
    else if (errmsg.indexOf("not found") != -1)
    {
        console.log(browser.i18n.getMessage("installMissing"));
        this.onNativeHostNotFound();
    }
    else 
    {
        console.log(browser.i18n.getMessage("installUnknownError"));
    }
}

FdmNativeHostManager.prototype.onNativeHostNotFound = function()
{
    
}

FdmNativeHostManager.prototype.postMessage = function(task, callback)
{
    if (this.ready)
    {
        if (this.legacyPort)
            this.postLegacyMessage(task, callback);
        else
            this.requestsManager.performRequest(task, callback);
    }
    else
    {
        var o = new Object;
        o.task = task;
        o.callback = callback;
        this.scheduledRequests.push(o);
    }
}

FdmNativeHostManager.prototype.postLegacyMessage = function(task, callback)
{
    if (task.type == "query_settings")
    {
        callback(this.legacySettings);
    }
    else if (task.type == "ui_strings")
    {
        callback({
            error: "",
            strings: {}
        });
    }
    else if (task.type == "create_downloads")
    {
        var legacyUrl = task.create_downloads.downloads[0].url;
        for (var i = 1; i < task.create_downloads.downloads.length; ++i)
            legacyUrl += "\n" + task.create_downloads.downloads[i].url;

        var legacyTask = {
            id: 0,
            list: task.create_downloads.downloads.length > 1,
            page: false,
            url: legacyUrl,
            cookies: task.create_downloads.downloads[0].httpCookies,
            referrer: task.create_downloads.downloads[0].httpReferer,
            post: "",
            useragent: task.create_downloads.downloads[0].userAgent
        };

        if (!legacyTask.list) {
            legacyTask.origUrl = task.create_downloads.downloads[0].originalUrl;
            legacyTask.post = task.create_downloads.downloads[0].httpPostData || "";
        }

        this.requestsManager.performRequest(
            legacyTask,
            this.processLegacyResponse.bind(this, callback));
    }
    else
    {
        //alert("unknown task: \n" + JSON.stringify(task));
        callback({ error: "not_implemented" });
    }
}

FdmNativeHostManager.prototype.processLegacyResponse = function(
    callback, resp)
{
    if (!callback)
        return;

    // it's always a response to create_downloads task

    callback({
        id: resp.id.toString(),
        error: "",
        result: resp.result ? "" : "0"
    });
}