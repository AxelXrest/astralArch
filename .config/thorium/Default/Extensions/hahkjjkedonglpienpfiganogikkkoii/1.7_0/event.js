var enabled = true;

function disableLinkCatcher() {
  enabled = false;
  chrome.browserAction.setIcon({ path: "icon128grey.png" });
  chrome.browserAction.setTitle({ title: "Enable" });
}

function enableLinkCatcher() {
  enabled = true;
  chrome.browserAction.setIcon({ path: "icon128.png" });
  chrome.browserAction.setTitle({ title: "Disable" });
}

function catch_m3u8(info) {
  // console.log("onBeforeRequest", info);

  if (
    (info.url.split("?")[0].split("#")[0].endsWith("m3u8") ||
      info.url.includes("m3u8.php")) &&
    info.type == "main_frame"
  ) {
    var playerUrl = chrome.extension.getURL("player.html") + "#" + info.url;
    return { redirectUrl: playerUrl };
  }
}

function mod_headers(info) {
  // console.log("onBeforeSendHeaders", info);

  if (info.url.indexOf("jio.com") > -1) {
    info.requestHeaders = info.requestHeaders.map((i) => {
      if (i.name.toLowerCase() == "user-agent") {
        i.value = "JioTV/537.36 (KAIOS, like Gecko) ExoPlayer";
      }
      return i;
    });
    info.requestHeaders.push({
      name: "X-Forwarded-For",
      value: "49.40.8.179",
    });
  } else {
    if (info.initiator.includes("chrome-extension"))
      info.requestHeaders.push({
        name: "Origin",
        value: info.url,
      });
    info.requestHeaders = info.requestHeaders.map((i) => {
      if (i.name.toLowerCase() == "referer") {
        i.value =
          info.url.indexOf("hses") > -1 ? "https://www.hotstar.com/" : info.url;
      }
      return i;
    });
  }

  // console.log(info);

  return { requestHeaders: info.requestHeaders };
}

function play_m3u8(request, sender, sendResponse) {
  // dispatch based on command
  if (request.command == "playM3u8") {
    var playerUrl = chrome.extension.getURL("player.html") + "#" + request.url;
    chrome.tabs.create({ url: playerUrl });
  }
}

function setupListeners() {
  console.log("setupListeners");

  chrome.extension.onMessage.addListener(play_m3u8);

  chrome.webRequest.onBeforeRequest.addListener(
    catch_m3u8,
    { urls: ["*://*/*.m3u8*", "*://*/*.ts*"] },
    ["blocking"]
  );

  chrome.webRequest.onBeforeSendHeaders.addListener(
    mod_headers,
    { urls: ["*://*/*.m3u8*", "*://*/*.ts*", "*://*.jio.com/*"] },
    ["requestHeaders", "extraHeaders"]
  );
}

function removeListeners() {
  console.log("removeListeners");

  chrome.extension.onMessage.removeListener(play_m3u8);
  chrome.webRequest.onBeforeRequest.removeListener(catch_m3u8);
  chrome.webRequest.onBeforeSendHeaders.removeListener(mod_headers);
}

// handle button

chrome.browserAction.onClicked.addListener(function () {
  if (enabled == false) {
    enableLinkCatcher();
    setupListeners();
    console.log("Ext enabled");
  } else {
    disableLinkCatcher();
    removeListeners();
    console.log("Ext disabled");
  }
});

if (enabled) {
  setupListeners();
} else {
  console.log("Extension disabled");
}
