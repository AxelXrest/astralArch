
/*
 * We took some parts of code from Adblock Plus.
 *
 * The Initial Developer of the Original Code is
 * Wladimir Palant.
 * Portions created by the Initial Developer are Copyright (C) 2006-2010
 * the Initial Developer. All Rights Reserved.

 The functions we took are: intersectRect, getElementPosition.
 We did minor changes in some of these functions.
 *
 *
 */

function FdmDomElementButton (eventElem, target, buttonText)
{
    DomElementButton.call (this, target);

    this.lastObjRect = false;
    this.lastMouseMoving = {
        time: 0
    };
    this.eventElem = eventElem;

    this.onClickEvent = function (ev)
    {
        if (!ev.isTrusted)
            return;
        if (ev.type != "click" || ev.button != 0)
            return;
        ev.preventDefault ();
        ev.stopPropagation ();
        this.onButtonClick ();
    };

    var onClickEventBinded = this.onClickEvent.bind (this);

    this.mouseMove = function (e) {

        e = e || window.event;

        this.lastMouseMoving.time = + new Date();

        if (e && e.pageX && e.pageY)
        {
            this.lastMouseMoving.clientX = e.clientX;
            this.lastMouseMoving.clientY = e.clientY;
        }
    };

    var mouseMoveBinded = this.mouseMove.bind (this);

    this.newEventElement = function (ev) {

        if (this.eventElem === ev)
            return;

        mouseMoveBinded();

        if (this.eventElem)
            this.eventElem.removeEventListener('mousemove', mouseMoveBinded);

        this.eventElem = ev;

        this.eventElem.addEventListener('mousemove', mouseMoveBinded);
    };

    this.show = function (sh)
    {
        if (sh)
        {
            if (this.button)
                return;

            var objRect = getElementPosition (this.target);

            if (objRect.width < 50 || objRect.height < 50)
                return;

            var doc = this.target.ownerDocument;
            try {
                doc = this.target.ownerDocument.defaultView.top.document;
            } catch(e) {}

            this.lastMouseMoving.time = + new Date();

            this.button = doc.createElementNS ("http://www.w3.org/1999/xhtml", "a");
            this.button.setAttribute ("href", "");
            this.button.setAttribute ("class", "fdm_ffext_CLASSVISIBLETOP");
            this.button.style.setProperty ("opacity", "1", "important");
            this.button.addEventListener ("click", onClickEventBinded, true);

            var el2 = doc.createElementNS ("http://www.w3.org/1999/xhtml", "img");
            el2.setAttribute ("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5LjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjBBQjhFQzA5Q0RDRTExRTY5QzYxQ0FBNzc3MTZBQzEzIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjBBQjhFQzBBQ0RDRTExRTY5QzYxQ0FBNzc3MTZBQzEzIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MEFCOEVDMDdDRENFMTFFNjlDNjFDQUE3NzcxNkFDMTMiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MEFCOEVDMDhDRENFMTFFNjlDNjFDQUE3NzcxNkFDMTMiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6bQ8cqAAAA+0lEQVR42mKUMXRnwA32rZmpqiSPLMLEgBc4haRfunoTWYQFznp8bgdWPRs27RQTFZYQE0HXgAsE+AHd/A2LDRDAuAqrLq4FTgzxIkT4AQ4S9oHM+vOfaA0QwHoRr4b/YQwlxqhCtwjZ0K3M4KuHIsIU7GGHauo/MPoLJCEimzTAegSAcmANdWU5yBo+/2ECI2Yg+R89BMHBKiTAt3vltLMXrkIE+dah+OHv398q11gfXIfwQXpA8aChqsTHy8Pw6Q0DnwiaoRUPYKoZUSNOSkLs/58//1BtR4nE/xiJj5GFhZmBQUETJv0PoQhfar2vC7QOZgkjFg0AAQYAPoNMOadVzpgAAAAASUVORK5CYII=");
            el2.style.setProperty ("float", "left", "important");
            el2.style.setProperty ("padding-right", "5px", "important");
            el2.setAttribute ("align", "absmiddle");
            el2.setAttribute ("border", "0");
            el2.setAttribute ("hspace", "0");
            el2.setAttribute ("vspace", "0");

            var el3 = doc.createElementNS ("http://www.w3.org/1999/xhtml", "span");
            el3.textContent = buttonText;
            el3.setAttribute ("class", "fdm_ffext_CLASSVISIBLESPAN");
            el3.setAttribute ("style", "");
            el3.style.setProperty ("line-height", "16px", "important");

            this.button.appendChild (el2);
            this.button.appendChild (el3);

            doc.documentElement.appendChild (this.button);

            this.positionButtonByTimer ();

            if (this.eventElem)
                this.eventElem.addEventListener('mousemove', mouseMoveBinded);
        }
        else
        {
            if (!this.button)
                return;
            this.button.removeEventListener ("click", onClickEventBinded, true);
            this.button.parentNode.removeChild (this.button);
            this.button = null;

            if (this.eventElem)
                this.eventElem.removeEventListener('mousemove', mouseMoveBinded);
        }
    };

    this.onButtonClick = function ()
    {
        throw "pure function call";
    };

    this.positionButtonByTimer = function ()
    {
        if (!this.button)
            return;
        this.positionButton ();
        setTimeout (this.positionButtonByTimer.bind (this), 100);
    };

    this.positionButton = function ()
    {
        var body = document.body,
            html = document.documentElement;

        var document_height = Math.max( body.scrollHeight, body.offsetHeight,
            html.clientHeight, html.scrollHeight, html.offsetHeight );

        var objRect = getElementPosition (this.target);

        var hideVideoBtn = + new Date() - this.lastMouseMoving.time > 2000;

        if (this.lastObjRect && objRect && hideVideoBtn == this.lastObjRect.hideVideoBtn &&
            (objRect.height !== this.lastObjRect.height || objRect.width !== this.lastObjRect.width))
        {
            var mouse_over_video = this.lastMouseMoving.clientY > objRect.top && this.lastMouseMoving.clientY < objRect.bottom
                && this.lastMouseMoving.clientX > objRect.left && this.lastMouseMoving.clientX < objRect.right;

            if (!mouse_over_video)
                return;
        }

        objRect.hideVideoBtn = hideVideoBtn;

        this.lastObjRect = objRect;

        var className = "fdm_ffext_CLASSVISIBLETOP";
        var left = objRect.left;
        var top = objRect.top;

        if (objRect.top === 0 && document_height === objRect.height
            || this.buttonArgs && this.buttonArgs.fullScreen)
        {
            if (top < 0)
                top = 0;

        }
        else if (top < 0 || objRect.top < 50)
        {
            top = objRect.bottom;
            className = "fdm_ffext_CLASSVISIBLEBOTTOM";
        }
        else
        {
            top = objRect.top - this.button.offsetHeight;
        }

        if (hideVideoBtn)
            className = className + ' fdm_ffext_CLASSHIDDEN';

        if (this.button.style.left != left + "px")
            this.button.style.setProperty ("left", left + "px", "important");
        if (this.button.style.top != top + "px")
            this.button.style.setProperty ("top", top + "px", "important");
        if (this.button.getAttribute ("class") != className)
            this.button.setAttribute ("class", className);
    };

    /*
    this.getElementPosition = function (elem)
    {

        let wnd = elem.ownerDocument.defaultView;
        var offsets = [0, 0, 0, 0];
        var style = wnd.getComputedStyle (elem, null);
        offsets [0] = parseFloat (style.borderLeftWidth) + parseFloat (style.paddingLeft);
        offsets [1] = parseFloat (style.borderTopWidth) + parseFloat (style.paddingTop);
        offsets [2] = parseFloat (style.borderRightWidth) + parseFloat (style.paddingRight);
        offsets [3] = parseFloat (style.borderBottomWidth) + parseFloat (style.paddingBottom);
        rect = {left: rect.left + offsets [0], top: rect.top + offsets [1],
            right: rect.right - offsets [2], bottom: rect.bottom - offsets [3]};
        while (true)
        {
            this.intersectRect (rect, wnd);
            if (!wnd.frameElement)
                break;
            var frameElem = wnd.frameElement;
            wnd = frameElem.ownerDocument.defaultView;
            var frameRect = frameElem.getBoundingClientRect ();
            var frameStyle = wnd.getComputedStyle (frameElem, null);
            var relLeft = frameRect.left + parseFloat (frameStyle.borderLeftWidth) + parseFloat (frameStyle.paddingLeft);
            var relTop = frameRect.top + parseFloat (frameStyle.borderTopWidth) + parseFloat (frameStyle.paddingTop);
            rect.left += relLeft;
            rect.right += relLeft;
            rect.top += relTop;
            rect.bottom += relTop;
        }
        return rect;
    };

    this.intersectRect = function (rect, wnd)
    {
        var doc = wnd.document;
        var wndWidth = doc.documentElement.clientWidth;
        var wndHeight = doc.documentElement.clientHeight;
        if (doc.compatMode == "BackCompat")
            wndHeight = doc.documentElement.offsetHeight - wnd.scrollMaxY;
        rect.left = Math.max (rect.left, 0);
        rect.top = Math.max (rect.top, 0);
        rect.right = Math.min (rect.right, wndWidth);
        rect.bottom = Math.min (rect.bottom, wndHeight);
    };
    */
}


function FdmDomElementButtonsManager (window)
{
    DomElementButtonsManager.call (this, window);
}


function FdmDomElementVideoButtonsManager (window)
{
    FdmDomElementButtonsManager.call (this, window);

    this.uiStrings = {
        dlbyfdm: 'Download with FDM'
    };

    browser.runtime.sendMessage({
            type: 'i18n',
            uiStrings: this.uiStrings
        },
        function(res){

            if (res && res.uiStrings)
                this.uiStrings = res.uiStrings;
        }.bind (this));

    this.getVideoArgs = function (videoElem, type) {

        var args = {
            type: type
        };

        var boxElem = videoElem;
        var objRect = getElementPosition (videoElem);

        var full_screen = false;

        while (boxElem.parentNode && boxElem.parentNode.getBoundingClientRect)
        {
            var parent = boxElem.parentNode;
            var parentRect = getElementPosition (parent);

            if (boxElem.nodeName && ['body', 'html', '#document'].indexOf(boxElem.nodeName.toLowerCase()) >= 0)
            {
                full_screen = true;
                break;
            }

            if (objRect.top <= parentRect.top && objRect.bottom >= parentRect.bottom
                && objRect.left <= parentRect.left && objRect.right >= parentRect.right)
            {
                boxElem = parent;
            }
            else
                break;
        }

        var args = {
            type: type,
            fullScreen: full_screen
        };

        return args;
    };

    this.createButton = function (eventElem, contentElem, button_args)
    {
        var button = new FdmDomElementButton (
            eventElem, contentElem, this.uiStrings.dlbyfdm);

        button.buttonArgs = button_args;

        button.onButtonClick = function ()
        {
            button.show (false);
            var params = this.getSniffDllParams (contentElem);

            browser.runtime.sendMessage({
                type: "video_btn_click",
                params: params
            });

        }.bind (this);

        return button;
    };

    this.queryElementType = function (ev, elem, callback)
    {
        var videoArgs;

        // if (this.buttonSettings.showVideoBtnHTML5 === "1")
        // {
            var html5_video = containHtml5Video(ev, elem);

            if (html5_video){

                videoArgs = this.getVideoArgs(html5_video, "html5");

                this.checkVideoQuery(html5_video, videoArgs, callback);
                return;
            }
        // }

        // if (this.buttonSettings.showVideoBtnFlash === "1")
        // {
            var contain_flash = containFlash(ev, elem);
            if (contain_flash){

                videoArgs = this.getVideoArgs(contain_flash, "flash");

                this.checkVideoQuery(contain_flash, videoArgs, callback);
                return;
            }
        // }

        callback (false);
    };

    this.checkVideoQuery = function (elem, videoArgs, callback)
    {
        var params = this.getSniffDllParams (elem);

        browser.runtime.sendMessage(
            {
                type: 'is_video',
                params: params
            },
            function(res){

                if (!res || typeof res != "object" || !res.hasOwnProperty('isTarget'))
                    callback (false);
                else
                    callback (res.isTarget, elem, videoArgs);
            }
        );
    };

    this.getSniffDllParams = function (elem)
    {
        var obj = new Object;
        obj.swfSrc = getFlashElementSwfUrl (elem);
        obj.flashVars = getElementParam (elem, "flashvars");
        obj.frameUrl = elem.ownerDocument.location.href;
        obj.webPageUrl = this.window.document.location.href;

        if (obj.frameUrl == obj.webPageUrl)
            obj.frameUrl = "";
        obj.objOtherSwfUrls = getOtherSwfUrls (elem);
        return obj;
    };
}
