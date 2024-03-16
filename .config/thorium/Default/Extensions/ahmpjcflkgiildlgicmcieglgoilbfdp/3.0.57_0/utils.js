
fdmExtUtils = {
    getHostFromUrl: function (url) {
        return url.toString().replace(/^.*\/\/(www\.)?([^\/?#:]+).*$/, '$2').toLowerCase();
    },
    normalizeRedirectURL: function (urlRedirect, url) {
        if (urlRedirect.indexOf('//') === 0 && urlRedirect.indexOf('.') > 0){

            var protocolPos = url.indexOf('//');
            return url.substring(0, protocolPos) + urlRedirect;
        }

        if (urlRedirect.lastIndexOf('.') > 0)
        {
            var protocolPos = url.indexOf('//');
            return url.substring(0, protocolPos + 2) + urlRedirect;
        }

        var redirectRequest = urlRedirect.indexOf('?');

        if (redirectRequest === 0){

            var urlQuery = url.indexOf('?');
            if (urlQuery >= 0)
                return url.substring(0, urlQuery) + urlRedirect;
            else
                return url + urlRedirect;
        }

        var lastDot = url.lastIndexOf('.');

        var baseUrl = url;
        var firstSlash = url.indexOf('/', lastDot);
        if (firstSlash >= 0)
            baseUrl = url.substring(0, firstSlash);

        var firstRequestSlash = urlRedirect.indexOf('/');

        if (firstRequestSlash === 0)
            return baseUrl + urlRedirect;
        else
            return baseUrl + '/' + urlRedirect;
    },
    skipServers2array: function (skipServers) {
        if (typeof skipServers === 'string') {
            return skipServers.trim().toLowerCase().split(' ');
        }
        return [];
    },
    skipServers2string: function (skipServers) {
        if (typeof skipServers === 'object') {
            return skipServers.join(" ");
        }
        return "";
    },
    urlInSkipServers: function (skipServers, url) {
        var skip = false;
        if (typeof skipServers === 'object' && typeof skipServers.forEach === "function") {
            var host = fdmExtUtils.getHostFromUrl(url);
            skipServers.forEach(function (hostToSkip) {
                var domainWithSubdomains = new RegExp('^(?:[\\w\\d\\.]*\\.)?' + hostToSkip + '$', 'i');
                if (domainWithSubdomains.test(host)) {
                    skip = true;
                }
            });
        }
        return skip;
    },
    addUrlToSkipServers: function (skipServers, url) {
        if (fdmExtUtils.urlInSkipServers(skipServers, url)) {
            return skipServers;
        }
        var host = fdmExtUtils.getHostFromUrl(url);
        skipServers.push(host);
        return skipServers;
    },
    removeUrlFromSkipServers: function (skipServers, url) {
        if (typeof skipServers === 'object' && typeof skipServers.forEach === "function") {
            var host = fdmExtUtils.getHostFromUrl(url);
            for (var i = skipServers.length - 1; i >= 0; i--) {
                var hostToSkip = skipServers[i];
                var domainWithSubdomains = new RegExp('^(?:[\\w\\d\\.]*\\.)?' + hostToSkip + '$', 'i');
                if (domainWithSubdomains.test(host)) {
                    skipServers.splice(i,1);
                }
            }
        }
        return skipServers;
    },
    parseBuildVersion: function (version) {
        var result = {
            version: version,
            build: "1", // "0" - developer build
            old: true,
            develop: false
        };
        if (typeof version === 'string') {
            var m = version.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/i);
            if (m && m.length >= 5) {
                result.build = m[4];
                result.old = false;
                result.develop = m[4] === "0";
            }
        }
        return result;
    }
};
