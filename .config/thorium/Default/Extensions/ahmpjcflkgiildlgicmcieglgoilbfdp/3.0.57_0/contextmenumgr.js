function ContextMenuManager()
{
    this.handlerRegistered = false;
    this.m_dlAllExists = false;
    this.m_dlthisExists = false;
    this.m_dlselectedExists = false;
    this.m_dlpageExists = false;
    this.m_dlvideoExists = false;
    this.m_dlchannelVideosExists = false;
}

ContextMenuManager.prototype.onUserDownloadLinks = function(
    links, pageUrl)
{
    
}

ContextMenuManager.prototype.onUserDownloadPage = function(
    pageUrl)
{
    
}

ContextMenuManager.prototype.onUserDownloadVideo = function(
    pageUrl)
{
    
}

ContextMenuManager.prototype.createMenu = function (
    dlthis, dlall, dlselected, dlpage, dlvideo, dlchannelvideos, dlplaylistvideos)
{
    if (dlthis)
        this.createDlThisMenu();
    else
        this.removeDlThisMenu();

    if (dlall)
        this.createDlAllMenu();
    else
        this.removeDlAllMenu();

    if (dlselected)
        this.createDlSelectedMenu();
    else
        this.removeDlSelectedMenu();

    if (dlpage)
        this.createDlPageMenu();
    else
        this.removeDlPageMenu();

    if (dlvideo)
        this.createDlVideoMenu();
    else
        this.removeDlVideoMenu();
    
    if(dlchannelvideos)
        this.createDlChannelVideosMenu();
    else 
        this.removeDlChannelVideosMenu();

    if(dlplaylistvideos)
        this.createDlPlaylistVideosMenu();
    else
        this.removeDlPlaylistVideosMenu();

    if (!this.handlerRegistered)
    {
        browser.contextMenus.onClicked.addListener(this.onClicked.bind(this));
        this.handlerRegistered = true;
    }
}

ContextMenuManager.prototype.createDlThisMenu = function()
{
    if (this.m_dlthisExists)
        return;

    this.m_dlthisExists = true;

    browser.contextMenus.create(
    {
        "id": "dlthis",
        "title": browser.i18n.getMessage("menuThis"),
        "contexts": ["image", "link"],
        "onclick": this.onDlThis.bind(this)
    });
}

ContextMenuManager.prototype.onDlThis = function(e)
{
    if (e.linkUrl)
        this.onUserDownloadLinks([e.linkUrl], e.pageUrl);
    else if (e.mediaType == "image")
        this.onUserDownloadLinks([e.srcUrl], e.pageUrl);
}

ContextMenuManager.prototype.createDlAllMenu = function()
{
    if (this.m_dlAllExists)
        return;

    this.m_dlAllExists = true;

    browser.contextMenus.create(
    {
        "id": "dlall",
        "title": browser.i18n.getMessage("menuAll"),
        "contexts": ["page"]
    });
}

ContextMenuManager.prototype.createDlSelectedMenu = function()
{
    if (this.m_dlselectedExists)
        return;

    this.m_dlselectedExists = true;

    browser.contextMenus.create(
    {
        "id": "dlselected",
        "title": browser.i18n.getMessage("menuSelected"),
        "contexts": ["selection"]
    });
}

ContextMenuManager.prototype.createDlPageMenu = function()
{
    if (this.m_dlpageExists)
        return;

    this.m_dlpageExists = true;

    browser.contextMenus.create(
    {
        "id": "dlpage",
        "title": browser.i18n.getMessage("menuSite"),
        "contexts": ["page"]
    });
}

ContextMenuManager.prototype.createDlVideoMenu = function()
{
    if (this.m_dlvideoExists)
        return;

    this.m_dlvideoExists = true;

    browser.contextMenus.create(
    {
        "id": "dlvideo",
        "title": browser.i18n.getMessage("menuVideoShort"),
        "contexts": ["page"]
    });
}

ContextMenuManager.prototype.createDlChannelVideosMenu = function()
{
    if (this.m_dlchannelVideosExists)
        return;
    
    this.m_dlchannelVideosExists = true;  
    
    browser.contextMenus.create(
    {
        "id": "dlchanelvideos",
        "title": browser.i18n.getMessage("menuChannelVideosShort"),
        "contexts": ["page"]
    });    
}

ContextMenuManager.prototype.createDlPlaylistVideosMenu = function()
{
    if (this.m_dlplaylistVideosExists)
        return;

    this.m_dlplaylistVideosExists = true;

    browser.contextMenus.create(
    {
        "id": "dlplaylistvideos",
        "title": browser.i18n.getMessage("menuPlaylistVideosShort"),
        "contexts": ["page"]
    });
}

ContextMenuManager.prototype.onClicked = function(
    info, tab)
{
    switch(info.menuItemId)
    {
        case "dlall": this.onClickedDlAll(info, tab); break;
        case "dlselected": this.onClickedDlSelected(info, tab); break;
        case "dlpage": this.onClickedDlPage(info, tab); break;
        case "dlvideo": this.onClickedDlVideo(info, tab); break;
        case "dlchanelvideos": this.onClickedDlChannelVideos(info, tab); break;
        case "dlplaylistvideos": this.onClickedDlPlaylistVideos(info, tab); break;
    }
}

ContextMenuManager.prototype.onClickedDlAll = function(
    info, tab)
{
    browser.tabs.executeScript(
        tab.id,
        {
            "frameId": info.frameId,
            "code":
            "JSON.stringify([].map.call(document.getElementsByTagName('a'), function(n) {return n.href;}).concat([].map.call(document.getElementsByTagName('img'), function(n) {return n.src;})));"
        },
        function(h) {

            var links = [];
            for (var i = 0; i < h.length; i++)
            {
                try {
                    var l = JSON.parse(h[i]);
                    if (l && l.length > 0)
                        links = links.concat(l);
                }
                catch (e){}
            }
            this.onUserDownloadLinks(links, tab.url);
        }.bind(this)
    );
}

ContextMenuManager.prototype.onClickedDlSelected = function(
    info, tab)
{
    // 
    browser.tabs.executeScript(
        tab.id,
        {
            "frameId": info.frameId,
            "code":
            "var s=document.getSelection(); var dv=document.createElement('div'); for (var i = 0; i < s.rangeCount; ++i) { dv.appendChild(s.getRangeAt(i).cloneContents()); } JSON.stringify([].map.call(dv.getElementsByTagName('a'), function(n) {return n.href;}))"
        },
        function (h) {

            var links = [];
            for (var i = 0; i < h.length; i++)
            {
                try {
                    var l = JSON.parse(h[i]);
                    if (l && l.length > 0)
                        links = links.concat(l);
                }
                catch (e){}
            }

            this.onUserDownloadLinks(links, tab.url);
        }.bind(this));

    this.createDlThisMenu();
}

ContextMenuManager.prototype.onClickedDlPage = function(
    info, tab)
{
    this.onUserDownloadPage(tab.url);
}

ContextMenuManager.prototype.onClickedDlVideo = function(
    info, tab)
{
    this.onUserDownloadVideo(tab.url);
}

ContextMenuManager.prototype.onClickedDlChannelVideos = function(
    info, tab)
{
    //this.onUserDownloadChannelVideos(tab.url);
    //console.log('download channel clicked. this.youtubeChannelVideosUrl: ' + this.youtubeChannelVideosUrl);
    FdmBhDownloadLinks(this.nhManager, [this.youtubeChannelVideosUrl], this.youtubeChannelVideosUrl, 1);
}

ContextMenuManager.prototype.onClickedDlPlaylistVideos = function(
    info, tab)
{
    //this.onUserDownloadChannelVideos(tab.url);
    // console.log('download channel clicked. this.onClickedDlPlaylistVideos: ' + this.youtubePlaylistUrl);
    FdmBhDownloadLinks(this.nhManager, [this.youtubePlaylistUrl], this.youtubePlaylistUrl, 2);
}

ContextMenuManager.prototype.removeDlThisMenu = function()
{
    if (!this.m_dlthisExists)
        return;

    this.m_dlthisExists = false;

    browser.contextMenus.remove("dlthis");
}

ContextMenuManager.prototype.removeDlAllMenu = function()
{
    if (!this.m_dlAllExists)
        return;

    this.m_dlAllExists = false;

    browser.contextMenus.remove("dlall");
}

ContextMenuManager.prototype.removeDlSelectedMenu = function()
{
    if (!this.m_dlselectedExists)
        return;

    this.m_dlselectedExists = false;

    browser.contextMenus.remove("dlselected");
}

ContextMenuManager.prototype.removeDlPageMenu = function()
{
    if (!this.m_dlpageExists)
        return;

    this.m_dlpageExists = false;

    browser.contextMenus.remove("dlpage");
}

ContextMenuManager.prototype.removeDlVideoMenu = function()
{
    if (!this.m_dlvideoExists)
        return;

    this.m_dlvideoExists = false;

    browser.contextMenus.remove("dlvideo");
}

ContextMenuManager.prototype.removeDlChannelVideosMenu = function()
{
    if (!this.m_dlchannelVideosExists)
        return;

    this.m_dlchannelVideosExists = false;

    browser.contextMenus.remove("dlchanelvideos");
}

ContextMenuManager.prototype.removeDlPlaylistVideosMenu = function()
{
    if (!this.m_dlplaylistVideosExists)
        return;

    this.m_dlplaylistVideosExists = false;

    browser.contextMenus.remove("dlplaylistvideos");
}