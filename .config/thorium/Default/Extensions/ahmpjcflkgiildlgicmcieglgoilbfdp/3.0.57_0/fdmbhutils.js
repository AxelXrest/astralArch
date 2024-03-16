function FdmBhDownloadLinks(nhManager, links, pageUrl, youtubeChannelVideosDownload)
{
    
    if (youtubeChannelVideosDownload === undefined) {
        youtubeChannelVideosDownload = 0;
      }    
    
console.log('FdmBhDownloadLinks youtubeChannelVideosDownload: ' + youtubeChannelVideosDownload);    
    var cm = new CookieManager;
    cm.getCookiesForUrls(
        links,
        function (cookies)
        {
            var task = new FdmBhCreateDownloadsTask;
            for (var i = 0; i < links.length; ++i)
            {
                var downloadInfo = new DownloadInfo(links[i], "", pageUrl);
                downloadInfo.userAgent = navigator.userAgent;
                downloadInfo.httpCookies = cookies[i];
                
                //Passing youtubeChannelVideosDownload flag to FDM
                downloadInfo.youtubeChannelVideosDownload = youtubeChannelVideosDownload;               
                
                task.addDownload(downloadInfo);
            }
            nhManager.postMessage(task);
console.log('task posted');              
        });
}