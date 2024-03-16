function DownloadInfo(url, redirectUrl, referrer, postData, documentUrl)
{
    if (url && redirectUrl)
    {
        this.url = redirectUrl;
        this.originalUrl = url;
    }
    else
    {
        this.url = url || "";
        this.originalUrl = this.url;
    }
    
    this.httpReferer = referrer;
    this.httpPostData = postData;
    this.documentUrl = documentUrl;

    //this.userAgent = "";
    //this.httpCookies = "";
    //this.suggestedName = "";
}


try
{
    exports.DownloadInfo = DownloadInfo;
}
catch (e) {}