
console.log("loaded content.js");

document.addEventListener("click", function (evt) {
  // alert(evt.target.href);
  if (evt.target.href && evt.target.href.split("?")[0].endsWith("m3u8")) {
    evt.preventDefault();
    evt.stopPropagation();
    chrome.extension.sendMessage(
      { command: "playM3u8", url: evt.target.href },
      function (response) {}
    );
  }
});
