
if (browser.runtime.onMessageExternal){ // TODO: support it in FF

    browser.runtime.onMessageExternal.addListener(function (request, sender, sendResponse)
    {
        if (sender.url.toLowerCase().indexOf("http://files2.freedownloadmanager.org") == -1)
            return;
        if (request == "uninstall")
        {
            browser.management.uninstallSelf();
        }
    });
}


var fdmext = new FdmExtension;
fdmext.initialize();
