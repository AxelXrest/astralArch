function FdmSettingsPageHelper(nhManager, fdmExt)
{
    this.nhManager = nhManager;
    this.fdmExt = fdmExt;
}

FdmSettingsPageHelper.prototype.initialize = function()
{
    browser.runtime.onMessage.addListener(this.onMessage.bind(this));
    this.setIcon(this.fdmExt.diManager.pauseCatchingForAllSites);
};

FdmSettingsPageHelper.prototype.onMessage = function(request, sender, sendResponse)
{
    if (request.type === "get_settings_for_page") {
        sendResponse(this.fdmExt.settings);
    }
    if (request.type === "get_build_version_for_page") {
        sendResponse(this.fdmExt.buildVersion);
    }
    if (request.type === "change_active_tab_in_skip_list") {
        this.changeActiveTabInSkipList(request.checked);
    }
    if (request.type === "on_user_options_click") {
        var task = new FdmBhJsonTask;
        task.setJson({
            type: "optionsClick"
        });
        this.nhManager.postMessage(
            task,
            sendResponse);
    }
    if (request.type === "get_pause_on_all_sites_flag") {
        sendResponse(this.fdmExt.diManager.pauseCatchingForAllSites);
    }
    if (request.type === "set_pause_on_all_sites_flag") {
        this.fdmExt.diManager.pauseCatchingForAllSites = request.pause;
        this.setIcon(request.pause);
    }
};

FdmSettingsPageHelper.prototype.setIcon = function(in_pause)
{
    if (in_pause) {
        chrome.browserAction.setIcon({path:"fdm16d.png"})
    } else {
        chrome.browserAction.setIcon({path:"fdm16.png"})
    }
};

FdmSettingsPageHelper.prototype.changeActiveTabInSkipList = function(checked)
{
    browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs.length) {
            var url = tabs[0].url;
            this.changeSkipList(url, checked);
        }
    }.bind(this));
};

FdmSettingsPageHelper.prototype.changeSkipList = function (url, checked) {
    var new_skip_servers;
    if (checked) {
        new_skip_servers = fdmExtUtils.addUrlToSkipServers(this.fdmExt.diManager.skipHosts, url);
    } else {
        new_skip_servers = fdmExtUtils.removeUrlFromSkipServers(this.fdmExt.diManager.skipHosts, url);
    }
    var new_skip_servers_str = fdmExtUtils.skipServers2string(new_skip_servers);

    var s = this.fdmExt.settings;
    s.browser.monitor.skipServers = new_skip_servers_str;
    s.browser.monitor.skipServersEnabled = "1";

    var task = new FdmBhPostSettingsTask;
    task.setSettings(s);
    this.nhManager.postMessage(
        task,
        this.onSettingsUpdated.bind(this));
};

FdmSettingsPageHelper.prototype.onSettingsUpdated = function() {
    this.fdmExt.updateSettings();
};
