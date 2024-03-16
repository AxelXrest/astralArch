function FdmContextMenuManager(tabsManager)
{
    this.m_dlthis = false;
    this.m_dlall = false;
    this.m_dlselected = false;
    this.m_dlpage = false;
    this.m_dlvideo = false;
    this.m_dlYtChannel = false;
    this.m_dlYtPlaylist = false;
    this.m_browserHasSelection = false;
    this.m_browserSelectionLinksCount = 0;
    this.tabsManager = tabsManager;

    this.youtubeDomain = false;
    this.youtubeChannelVideosUrl = '';
    this.youtubePlaylistUrl = '';

    this.DownloadAsLinks = new Set();
    this.DownloadAsLinks.add("www.youtube.com");
}

FdmContextMenuManager.prototype = new ContextMenuManager();

FdmContextMenuManager.prototype.setNativeHostManager = function (mgr)
{
    this.nhManager = mgr;
    browser.runtime.onMessage.addListener(this.onMessage.bind(this));
};

FdmContextMenuManager.prototype.createMenu = function (
    dlthis, dlall, dlselected, dlpage, dlvideo, dlYtChannel, dlYtPlaylist)
{
    this.m_dlthis = dlthis;
    this.m_dlall = dlall;
    this.m_dlselected = dlselected;
    this.m_dlpage = dlpage;
    this.m_dlvideo = dlvideo;
    this.m_dlYtChannel = dlYtChannel;
    this.m_dlYtPlaylist = dlYtPlaylist;
    this.createMenuImpl();
};

FdmContextMenuManager.prototype.createMenuImpl = function()
{
    if (this.youtubeDomain) {
        ContextMenuManager.prototype.createMenu.call(
            this, false, false, false, false, false, false, false);
        return true;
    }
    
    ContextMenuManager.prototype.createMenu.call(
        this,
        this.shouldShowDlThis(),
        this.m_dlall, 
        this.shouldShowDlSelected(),
        this.m_dlpage, 
        this.shouldShowDlVideo(),
        this.shouldShowDlChannel(),
        this.shouldShowDlPlaylist());
};

FdmContextMenuManager.prototype.shouldShowDlThis = function()
{
    return this.m_dlthis && !this.shouldShowDlSelected();
};

FdmContextMenuManager.prototype.shouldShowDlSelected = function()
{
    return this.m_dlselected
            && this.m_browserHasSelection
            && this.m_browserSelectionLinksCount;
};

FdmContextMenuManager.prototype.shouldShowDlVideo = function ()
{
    return this.m_dlvideo &&
        this.tabsManager.activeTabHasVideo();
};

FdmContextMenuManager.prototype.shouldShowDlChannel = function ()
{
    return this.m_dlvideo && this.m_dlYtChannel &&
        this.youtubeChannelVideosUrl !== '';
};

FdmContextMenuManager.prototype.shouldShowDlPlaylist = function ()
{
    return this.m_dlvideo && this.m_dlYtPlaylist &&
        this.youtubePlaylistUrl !== '';
};

FdmContextMenuManager.prototype.onUserDownloadLinks = function (
    links, pageUrl, youtubeVideosFlag)
{
    FdmBhDownloadLinks(this.nhManager, links, pageUrl, youtubeVideosFlag);
};

FdmContextMenuManager.prototype.onUserDownloadVideo = function (
    pageUrl)
{
    if (this.nhManager.legacyPort || this.shouldDownloadAsLinks(pageUrl))
    {
        var youtubeVideosFlag = 0;
        if (this.m_dlYtPlaylist) {
            youtubeVideosFlag = 4;
        }
        this.onUserDownloadLinks([pageUrl], pageUrl, youtubeVideosFlag);
        return;
    }           
    var task = new FdmBhVideoSnifferTask;
    var req = new FdmBhSniffDllCreateVideoDownloadFromUrlRequest(
        pageUrl, "", "", "", "", "");
    task.setRequest(req);
    this.nhManager.postMessage(task);
};

FdmContextMenuManager.prototype.shouldDownloadAsLinks = function(url)
{
    if (!url)
        return false;
    var hostname = (new URL(url)).hostname;
    return this.DownloadAsLinks.has(hostname);
};

FdmContextMenuManager.prototype.onMessage = function(request, sender)
{
    if (sender && sender.tab) {
        if (request.type === 'fdm_reset_context_menu' && sender.tab.active) {
            return;
        }
        if (!sender.tab.active && request.type !== 'fdm_reset_context_menu') {
            return;
        }
        if (sender.frameId > 0 && sender.tab.url.indexOf('youtube.com') >= 0) {
            return;
        }
    }

    if (request.type === 'fdm_reset_context_menu' || request.type === 'fdm_reset_context_menu_beforeunload') {
        this.youtubeDomain = false;
        this.youtubeChannelVideosUrl = '';
        this.youtubePlaylistUrl = '';
        this.m_browserSelectionLinksCount = 0;
        this.m_browserHasSelection = 0;
        this.createMenuImpl();
    }

    if (request.type === "fdm_selection_change")
    {
        this.youtubeDomain = false;
        this.youtubeChannelVideosUrl = '';
        this.youtubePlaylistUrl = '';
        try {
            if (request.data) {
                this.youtubeDomain = request.data.youtubeDomain;
            }
        } catch (e) {}
        try {
            if (request.data) {
                this.youtubeChannelVideosUrl = request.data.youtubeChannelVideosUrl;
            }
        } catch (e) {}
        try {
            if (request.data) {
                this.youtubePlaylistUrl = request.data.youtubePlaylistUrl;
            }
        } catch (e) {}

        this.m_browserSelectionLinksCount = request.selectionLinksCount;
        this.m_browserHasSelection = request.hasSelection;
        this.createMenuImpl();
    }

    if (request.type === "fdm_right_mouse_button_clicked")
    {
        this.youtubeDomain = false;
        this.youtubeChannelVideosUrl = '';
        this.youtubePlaylistUrl = '';
        try {
            if (request.data) {
                this.youtubeDomain = request.data.youtubeDomain;
            }
        } catch (e) {}
        try {
            if (request.data) {
                this.youtubeChannelVideosUrl = request.data.youtubeChannelVideosUrl;
            }
        } catch (e) {}
        try {
            if (request.data) {
                this.youtubePlaylistUrl = request.data.youtubePlaylistUrl;
            }
        } catch (e) {}

        this.createMenuImpl();
        setTimeout(function(){
            this.createMenuImpl()
        }.bind(this), 200);
    }

    if (request.type === "fdm_left_mouse_button_clicked")
    {
        this.createMenuImpl();
        setTimeout(function(){
            this.createMenuImpl()
        }.bind(this), 200);
    }
};