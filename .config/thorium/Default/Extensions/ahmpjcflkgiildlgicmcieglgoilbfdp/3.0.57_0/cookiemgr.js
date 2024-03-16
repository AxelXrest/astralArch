function CookieManager()
{

}

CookieManager.prototype.getCookiesForUrl = function(
    url, callback)
{
    this.getCookiesForUrls([url], function (result)
    {
        callback(result[0]);
    });
}

CookieManager.prototype.getCookiesForUrls = function(
    urls, callback)
{
    var remained = urls.length;
    var result = [];

    for (var i = 0; i < urls.length; ++i)
    {
        browser.cookies.getAll(
            { 'url': urls[i] },
            function (resultIndex, cookies)
            {
                var cookiesString = "";
                if (cookies)
                {
                    cookiesString = cookies.map(function (cookie) {
                        return cookie.name + "=" + cookie.value + ";";
                    }).join(' ');
                }
                result[resultIndex] = cookiesString;
                if (!--remained)
                    callback(result);
            }.bind(this, i));
    }
}