function FdmVideoBtn(nhManager)
{
    this.nhManager = nhManager;

    this.showVideoBtn = "0";
    // this.showVideoBtnFlash = "1";
    // this.showVideoBtnHTML5 = "1";
}

FdmVideoBtn.prototype.initialize = function()
{
    browser.runtime.onMessage.addListener(this.onMessage.bind(this));

    browser.storage.local.get(
        ['showVideoBtn' /*, 'showVideoBtnFlash', 'showVideoBtnHTML5'*/],
        function(res){

            if (res.showVideoBtn)
                this.showVideoBtn = res.showVideoBtn;
            // if (res.showVideoBtnFlash === "0")
            //     this.showVideoBtnFlash = res.showVideoBtnFlash;
            // if (res.showVideoBtnHTML5 === "0")
            //     this.showVideoBtnHTML5 = res.showVideoBtnHTML5;

        }.bind(this));
};

FdmVideoBtn.prototype.onMessage = function(request, sender, sendResponse)
{

    if (request.type == "change_video_btn_settings"){

        var new_settings = request.new_settings;

        this.showVideoBtn = new_settings.showVideoBtn;
        // this.showVideoBtnFlash = new_settings.showVideoBtnFlash;
        // this.showVideoBtnHTML5 = new_settings.showVideoBtnHTML5;
    }
    if (request.type == "get_video_btn_settings"){

        sendResponse({
            showVideoBtn: this.showVideoBtn
            // showVideoBtnFlash: this.showVideoBtnFlash,
            // showVideoBtnHTML5: this.showVideoBtnHTML5
        });
    }

    if (request.type == "video_btn_click"){

        var btnParams = this.formatBtnParams(request, sender);
        this.sendBtnUrlToFdm(btnParams);
    }
    if (request.type == 'is_video'){

        if (this.showVideoBtn === "0")
        {
            sendResponse({
                isTarget: false
            });
            return;
        }

        var btnParams = this.formatBtnParams(request, sender);

        if (btnParams.webPageUrl && btnParams.webPageUrl.indexOf('youtube.com/') > 0
            || btnParams.frameUrl && btnParams.frameUrl.indexOf('youtube.com/') > 0)
        {
            sendResponse({
                isTarget: false
            });
            return;
        }

        var otherSwfUrls, otherFlashVars;

        if (btnParams.hasOwnProperty('objOtherSwfUrls')){
            if (btnParams.objOtherSwfUrls.hasOwnProperty('OtherSwfUrls'))
                otherSwfUrls = btnParams.objOtherSwfUrls.OtherSwfUrls;
            if (btnParams.objOtherSwfUrls.hasOwnProperty('OtherFlashVars'))
                otherFlashVars = btnParams.objOtherSwfUrls.OtherFlashVars;
        }

        var task = new FdmBhVideoSnifferTask;
        var req = new FdmBhSniffDllIsVideoFlashRequest(
            btnParams.webPageUrl, btnParams.frameUrl, btnParams.swfSrc,
            btnParams.flashVars, otherSwfUrls, otherFlashVars);
        task.setRequest(req);

        this.nhManager.postMessage(task, function(resp)
        {
            sendResponse({
                isTarget: resp.videoSniffer.result && resp.videoSniffer.result != "0"
            });

        }.bind(this));

        return true; // asynchronous response
    }
    if (request.type == "i18n"){

        if (request.hasOwnProperty('uiStrings')){

            var i18nStr;
            for (var key in request.uiStrings){

                if (i18nStr = browser.i18n.getMessage(key))
                    request.uiStrings[key] = i18nStr;
            }
        }
        sendResponse({uiStrings: request.uiStrings});
    }
};

FdmVideoBtn.prototype.sendBtnUrlToFdm = function(btnParams)
{
    if (this.nhManager.legacyPort)
    {
        var pageUrl = btnParams.webPageUrl;
        FdmBhDownloadLinks(this.nhManager, [pageUrl], pageUrl);
        return;
    }

    var task = new FdmBhVideoSnifferTask;

    var otherSwfUrls, otherFlashVars;
    if (btnParams.hasOwnProperty('objOtherSwfUrls'))
    {
        if (btnParams.objOtherSwfUrls.hasOwnProperty('OtherSwfUrls'))
            otherSwfUrls = btnParams.objOtherSwfUrls.OtherSwfUrls;
        if (btnParams.objOtherSwfUrls.hasOwnProperty('OtherFlashVars'))
            otherFlashVars = btnParams.objOtherSwfUrls.OtherFlashVars;
    }

    var req = new FdmBhSniffDllCreateVideoDownloadFromUrlRequest(
        btnParams.webPageUrl, btnParams.frameUrl, btnParams.swfSrc,
        btnParams.flashVars, otherSwfUrls, otherFlashVars);

    task.setRequest(req);
    this.nhManager.postMessage(task);
};

FdmVideoBtn.prototype.formatBtnParams = function(request, sender)
{
    var btnParams = request.params;

    var regexp = /(^.*\.youtube\.com\/)embed\/(.*)$/g;
    var regexp_r = regexp.exec(btnParams.webPageUrl);

    if (regexp_r && regexp_r.length == 3){

        btnParams.webPageUrl = regexp_r[1] + 'watch?v=' + regexp_r[2];
    }
    else if (sender.frameId && sender.tab
        && sender.tab.url != btnParams.webPageUrl){

        btnParams.frameUrl = btnParams.webPageUrl;
        btnParams.webPageUrl = sender.tab.url;
    }

    return btnParams;
};