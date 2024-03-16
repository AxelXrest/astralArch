function DomElementButton (target)
{
    this.target = target;
    this.button = null;

    this.elementPart = function (elem, root)
    {
        if (elem == root)
            return true;
        if (elem.parentNode)
            return this.elementPart(elem.parentNode, root);
        return false;
    };

    this.buttonPartElement = function (elem)
    {
        return this.elementPart(elem, this.button);
    };

    this.targetPartElement = function (elem)
    {
        return this.elementPart(elem, this.target);
    };

    this.show = function (sh)
    {
        throw "pure function call";
    };
}

function DomElementButtonsManager (window)
{
    this.window = window;
    this.button = null;
    this.buttons = new WeakMap;
    this.lastElement = null;

    this.buttonSettings = {
        showVideoBtn: "1"
        // showVideoBtnFlash: "1",
        // showVideoBtnHTML5: "1"
    };

    browser.runtime.sendMessage({
            type: 'get_video_btn_settings'
        },
        function(res){

            if (res)
                this.buttonSettings = res;
        }.bind (this));

    this.onMessage = function (request, sender, sendResponse) {

        if (request.type == 'change_video_btn_settings')
        {
            if (this.button)
            {
                this.button.show (false);
                this.button = null;
            }
            this.lastElement = null;
            this.buttons = new WeakMap;

            if (request && request.new_settings)
                this.buttonSettings = request.new_settings;
        }
    };

    this.onMouseEventInElement = function (ev)
    {
        if (this.buttonSettings && this.buttonSettings.showVideoBtn === "0")
            return;

        ev = ev || this.window.event;
        var elem = ev.target || ev.srcElement;

        if (this.lastElement == elem)
            return; // nothing to do

        this.lastElement = elem;

        if (this.button)
        {
            if (this.button.buttonPartElement (elem) ||
                this.button.targetPartElement (elem))
            {
                this.button.newEventElement(elem);
                return;
            }

            if (this.button.lastObjRect){

                var rect = this.button.lastObjRect;

                if (ev.clientY > rect.top && ev.clientY < rect.bottom
                    && ev.clientX > rect.left && ev.clientX < rect.right)
                {
                    this.button.newEventElement(elem);
                    return;
                }
            }

            this.button.show (false);
            this.button = null;
        }

        var button = this.buttons.get (elem);
        if (button)
        {
            button.newEventElement(elem);
            this.showButton (button);
            return;
        }

        this.queryElementType (ev,elem, this.onElementType.bind (this, elem));
    };

    this.onElementType = function (elem, isTarget, contentElem, button_args)
    {
        if (!isTarget)
            return;

        var button = this.createButton (elem, contentElem, button_args);
        this.buttons.set (elem, button);

        if (elem == this.lastElement)
            this.showButton (button);
    };

    this.showButton = function (button)
    {
        this.button = button;
        this.button.show (true);
    };

    // this.createButton = function (contentElem)
    // {
    //     throw "pure function call";
    // };

    // this.queryElementType = function (ev, elem, callback)
    // {
    //     throw "pure function call";
    // };

    var onMouseEventInElementBinded = this.onMouseEventInElement.bind (this);

    var onMessage = this.onMessage.bind (this);

    this.register = function ()
    {
        this.window.addEventListener ("mousemove",
            onMouseEventInElementBinded, true);

        this.window.addEventListener ("mouseover",
            onMouseEventInElementBinded, false);

        browser.runtime.onMessage.addListener(onMessage);
    };

    this.unregister = function ()
    {
        this.window.removeEventListener ("mousemove",
            onMouseEventInElementBinded, true);

        this.window.removeEventListener ("mouseover",
            onMouseEventInElementBinded, false);

        if (this.button)
        {
            this.button.show (false);
            this.button = null;
        }

        this.lastElement = null;
    };
}