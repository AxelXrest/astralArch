
var clicked = false;

function click_hander() {
    clicked = true;
    browser.tabs.create({
        'url': 'http://freedownloadmanager.org/download.htm?from=gh'
    });
    window.close();
    return false;
};

window.onload = function() {
    document.getElementById("install_button").addEventListener("click", click_hander);
};

window.onbeforeunload = function() {
    return null;
};
