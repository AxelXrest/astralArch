document.addEventListener("selectionchange", dealWithSelection, true);

function dealWithSelection()
{
    var linksCount = 0;
    var selection = window.getSelection();
    var links = null;
    if (selection.rangeCount)
    {
        var dv = document.createElement('div');
        for (var i = 0; i < selection.rangeCount; ++i)
        {
          dv.appendChild(selection.getRangeAt(i).cloneContents());
        }

        // var smth = dv.getElementsByTagName('a');

        links = [].map.call(dv.getElementsByTagName('a'), function(n) { 
            return n.href;
        });
        linksCount = links.length;
    }

    var youtubeDomain = fdmExtUtils.isYoutubeDomain();
    var youtubeChannelVideosUrl = fdmExtUtils.findYoutubeChannelVideosUrl();
    var youtubePlaylistUrl = fdmExtUtils.findYoutubePlaylist();

    browser.runtime.sendMessage({
        type: "fdm_selection_change", 
        hasSelection: selection.rangeCount != 0,
        selectionLinksCount: linksCount,
        selectionLinks: links,
        data: {youtubeDomain: youtubeDomain, youtubeChannelVideosUrl: youtubeChannelVideosUrl, youtubePlaylistUrl: youtubePlaylistUrl}
    });
    if (!youtubeChannelVideosUrl.length && fdmExtUtils.youtubeChannelInfoLoading()) {
        setTimeout(dealWithSelection, 5000);
    }
}

document.addEventListener("mousedown", function(event){

    if (event.button == 2)
    {
        var youtubeDomain = fdmExtUtils.isYoutubeDomain();
        var youtubeChannelVideosUrl = fdmExtUtils.findYoutubeChannelVideosUrl();
        var youtubePlaylistUrl = fdmExtUtils.findYoutubePlaylist();
        browser.runtime.sendMessage({
            type: "fdm_right_mouse_button_clicked",
            data: {youtubeDomain: youtubeDomain, youtubeChannelVideosUrl: youtubeChannelVideosUrl, youtubePlaylistUrl: youtubePlaylistUrl}
        });
    }

    if (event.button == 1)
    {
        browser.runtime.sendMessage({
            type: "fdm_left_mouse_button_clicked",
        });
    }
});

// http://stackoverflow.com/a/19519701
var vis = (function(){
    var stateKey, eventKey, keys = {
        hidden: "visibilitychange",
        webkitHidden: "webkitvisibilitychange",
        mozHidden: "mozvisibilitychange",
        msHidden: "msvisibilitychange"
    };
    for (stateKey in keys) {
        if (stateKey in document) {
            eventKey = keys[stateKey];
            break;
        }
    }
    return function(c) {
        if (c) document.addEventListener(eventKey, c);
        return !document[stateKey];
    }
})();

vis(function(){
    var visible = vis();
    if (visible)
    {
        dealWithSelection();
    }
});

(function() {
    var listener = function () {
        document.removeEventListener('DOMContentLoaded', listener);
        setTimeout(dealWithSelection, 1000);
        //for slow connection
        setTimeout(dealWithSelection, 5000);
        setTimeout(dealWithSelection, 10000);
    };
    if (document.readyState!='loading') {
        dealWithSelection();
    } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', listener);
    }
})();

(function() {
    if (window.addEventListener) {
        window.addEventListener('beforeunload', function(event) {
            browser.runtime.sendMessage({
                type: "fdm_reset_context_menu_beforeunload",
                t_event: "beforeunload"
            });
        }, false);
        window.addEventListener("blur", function( event ) {
            browser.runtime.sendMessage({
                type: "fdm_reset_context_menu",
                t_event: "blur"
            });
        }, true);
        window.addEventListener("focus", function( event ) {
            dealWithSelection();
        }, true);
    }
})();
