console.log("h0t");
const link = document.querySelector('link[rel="canonical"]').href;

if (link) {
  const contentId = link.split("/").pop();
  console.log("🎉 contentId", contentId);
  if (/\d{10}/.test(contentId)) {
    fetch("https://www.totsacademy.in/hotstarauth.php")
      .then(r => r.text())
      .then(token => {
        fetch(
          `https://api.hotstar.com/h/v2/play/us/contents/${contentId}?desiredConfig=encryption%3Aplain%3Bladder%3Aphone%2Ctv%3Bpackage%3Ahls%2Cdash&client=mweb&clientVersion=6.18.0&osName=Windows&osVersion=10&deviceId=haha`,
          {
            headers: {
              hotstarauth: token
            }
          }
        )
          .then(r => r.json())
          .then(data => {
            const u = data.body.results.playBackSets.find(
              c => c.playbackUrl.indexOf("m3u8") > -1
            ).playbackUrl;
            chrome.extension.sendMessage(
              { command: "playM3u8", url: u },
              function(response) {}
            );
          })
          .catch(e => alert("Failed to fetch stream"));
      })
      .catch(e => alert("Failed to fetch token"));
  }
}
