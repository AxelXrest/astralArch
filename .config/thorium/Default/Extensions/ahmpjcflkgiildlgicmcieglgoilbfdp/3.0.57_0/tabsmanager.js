function TabInfo()
{
    this.hasVideo = false;
}

TabInfo.prototype.update = function(
    tab)
{
    if (tab.hasOwnProperty("url"))
        this.url = tab.url;
}

function TabsManager(nhManager)
{
    this.nhManager = nhManager;
}

TabsManager.prototype.initialize = function()
{
    browser.tabs.onCreated.addListener(
        this.onTabCreated.bind(this));
    browser.tabs.onUpdated.addListener(
        this.onTabUpdated.bind(this));
    browser.tabs.onRemoved.addListener(
        this.onTabRemoved.bind(this));
    browser.tabs.onActivated.addListener(
        this.onTabActivated.bind(this));
    setInterval(
        this.onTimer.bind(this),
        1000);
}

TabsManager.prototype.tabs = {};

TabsManager.prototype.tabExists = function(
    id)
{
    return this.tabs.hasOwnProperty(id);
}

TabsManager.prototype.onTabCreated = function (
    tab)
{
    if (!tab.hasOwnProperty("id"))
    {
        console.error("onTabCreated: tab has no id", tab.id);
        return;
    }
    this.tabs[tab.id] = new TabInfo();
    this.tabs[tab.id].update(tab);
    this.onTabUrlChanged(tab.id);
}

TabsManager.prototype.onTabUpdated = function (
    id, changeInfo, tab)
{
    if (!this.tabExists(id))
    {
        this.onTabCreated(tab);

        if (!this.tabExists(id))
        {
            console.error("onTabUpdated: unknown tab", id);
            return;
        }
    }

    if (changeInfo.url)
    {
        this.tabs[id].url = changeInfo.url;
        this.onTabUrlChanged(id);
    }
}

TabsManager.prototype.onTabRemoved = function (
    id, removeInfo)
{
    if (this.tabExists(id))
        delete this.tabs[id];
}

TabsManager.prototype.onTabActivated = function (
    activeInfo)
{
    this.activeTabId = activeInfo.tabId;
}

TabsManager.prototype.onTabUrlChanged = function (
    id)
{
    this.tabs[id].hasVideo = false;
    var url = this.tabs[id].url;
    if (!url)
        return;
    var re = new RegExp("^(http[s]?):\\/\\/(www\\.)?youtube\\.com\\/watch\\?(([^v=]+)=([^&]+)&)*v=.+");
    if (url.match(re))
        this.tabs[id].hasVideo = true;
}

TabsManager.prototype.activeTabHasVideo = function()
{
    try 
    {
        return this.tabs[this.activeTabId].hasVideo;
    }
    catch (err)
    {
        return false;
    }
}

TabsManager.prototype.onTimer = function()
{
    browser.tabs.query({ active: true, currentWindow: true }, function(tabs)
    {
        if (tabs.length) {
            this.activeTabId = tabs[0].id;
        } else {
            this.activeTabId = false;
        }
    }.bind(this));

    for (var id in this.tabs)
    {
        var info = this.tabs[id];
        if (info.hasVideo)
            continue;
        if (!info.url)
            continue;
        var task = new FdmBhVideoSnifferTask;
        var req = new FdmBhSniffDllIsVideoFlashRequest(
            info.url, "", "", "", "", "");
        task.setRequest(req);
        this.nhManager.postMessage(task, function(tabId, resp)
        {
            if (this.tabExists(tabId))
            {
                this.tabs[tabId].hasVideo = resp.videoSniffer.result &&
                    resp.videoSniffer.result != "0";
            }
        }.bind(this, id));
    }
}