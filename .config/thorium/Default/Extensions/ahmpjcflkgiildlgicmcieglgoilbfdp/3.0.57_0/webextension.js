window.browser = (function () 
{
  return window.msBrowser ||
    window.browser ||
    window.chrome;
})();

window.browserName = (function()
{
    if (window.msBrowser)
        return "Edge";
    if (window.browser && typeof InstallTrigger !== 'undefined')
        return "Firefox";
    return "Chrome";
})();