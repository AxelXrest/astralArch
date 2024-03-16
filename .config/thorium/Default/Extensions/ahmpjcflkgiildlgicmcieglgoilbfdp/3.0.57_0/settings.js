
function FDMsettings(){
    this.settings = {};
    this.skipHosts = [];
    this.activeTabInSkipList = false;
    this.pauseCatchingForAllSites = false;
}

FDMsettings.prototype.initialize = function () {

    window.browser.runtime.sendMessage({type: "get_settings_for_page"}, this.onGotSettings.bind(this));
    window.browser.runtime.sendMessage({type: "get_build_version_for_page"}, this.onGotBuildVersion.bind(this));
    window.browser.runtime.sendMessage({type: "get_pause_on_all_sites_flag"}, this.onGotPauseOnAllSites.bind(this));
    this.addEventListeners();
};

FDMsettings.prototype.onGotSettings = function (settings) {
    this.settings = settings;
    this.skipServersEnabled = this.settings.browser.monitor.skipServersEnabled === "1";
    this.skipHosts = fdmExtUtils.skipServers2array(this.settings.browser.monitor.skipServers);
    this.checkCurrentUrlInSkipList();
};

FDMsettings.prototype.onGotBuildVersion = function (build_version) {
    this.buildVersion = build_version;
};

FDMsettings.prototype.onGotPauseOnAllSites = function (paused_on_all_sites) {
    this.pauseCatchingForAllSites = paused_on_all_sites;
};

FDMsettings.prototype.addEventListeners = function () {
    document.getElementById('activeTabInSkipList').addEventListener('click', this.clickActiveTabInSkipList.bind(this));
    document.getElementById('optionsLink').addEventListener('click', this.onUserOptionsClick.bind(this));
    document.getElementById('feedbackLink').addEventListener('click', this.onUserFeedbackClick.bind(this));
    document.getElementById('pauseCatchingForAllSites').addEventListener('click', this.clickPauseCatchingForAllSites.bind(this));
};

FDMsettings.prototype.clickActiveTabInSkipList = function () {
    this.activeTabInSkipList = !this.activeTabInSkipList;
    window.browser.runtime.sendMessage({type: "change_active_tab_in_skip_list", checked: this.activeTabInSkipList});
    this.updatePageState();
};

FDMsettings.prototype.onUserOptionsClick = function () {
    window.browser.runtime.sendMessage({type: "on_user_options_click"}, function () {
        window.close()
    }.bind(this));
};

FDMsettings.prototype.onUserFeedbackClick = function () {
    window.open('https://www.freedownloadmanager.org/support.htm');
};

FDMsettings.prototype.clickPauseCatchingForAllSites = function () {
    this.pauseCatchingForAllSites = !this.pauseCatchingForAllSites;
    window.browser.runtime.sendMessage({type: "set_pause_on_all_sites_flag", pause: this.pauseCatchingForAllSites});
    this.updatePageState();
};

FDMsettings.prototype.checkCurrentUrlInSkipList = function () {
    window.browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (this.skipServersEnabled && tabs.length) {
            this.activeTabInSkipList = fdmExtUtils.urlInSkipServers(this.skipHosts, tabs[0].url);
        } else {
            this.activeTabInSkipList = false;
        }
        this.updatePageState();
    }.bind(this));
};

FDMsettings.prototype.updatePageState = function () {

    document.getElementById('fdm_loading').style.display = "none";
    if (this.activeTabInSkipList) {
        document.getElementById('activeTabInSkipList').classList.add('checked');
    } else {
        document.getElementById('activeTabInSkipList').classList.remove('checked')
    }
    if (this.pauseCatchingForAllSites) {
        document.getElementById('pauseCatchingForAllSites').classList.add('checked');
    } else {
        document.getElementById('pauseCatchingForAllSites').classList.remove('checked')
    }

    if (!this.buildVersion || this.buildVersion.old) {
        document.getElementById('fdm_settings').style.display = "none";
        document.getElementById('optionsLink').style.display = "none";
        document.getElementById('fdm_update').style.display = "block";
    } else {
        document.getElementById('fdm_update').style.display = "none";
        document.getElementById('fdm_settings').style.display = "block";
        document.getElementById('optionsLink').style.display = "block";
    }
};


var fdmsettings = new FDMsettings;
fdmsettings.initialize();
