function getElementParam (elem, paramName)
{
	var vars;

	try {
		vars = elem.getAttribute (paramName);
	} catch (e) {}

	if ((vars == null || vars == "") && elem.hasChildNodes ())
	{
		try 
		{
			for (var i = 0; i < elem.childNodes.length; i++) 
			{
				try{
					if (elem.childNodes[i].getAttribute("name").toLowerCase() == paramName)
					{
						vars = elem.childNodes[i].getAttribute("value");
						break;
					}
				}catch(e){}
			}
		}
		catch(e){}
	}
			
	if ((vars == null || vars == "") && elem.parentNode && elem.parentNode.hasChildNodes ())
	{
		try 
		{
			for (var i = 0; i < elem.parentNode.childNodes.length; i++) 
			{
				try{
					if (elem.parentNode.childNodes[i].getAttribute("name").toLowerCase() == paramName)
					{
						vars = elem.parentNode.childNodes[i].getAttribute("value");
						break;
					}
				}
				catch(e){}
			}
		}
		catch(e){}
	}

	return vars ? vars : "";
}
		
function getFlashElementSwfUrl (elem)
{
	var swfSrc;
	try {swfSrc = elem.data;}catch (e){}
	if (swfSrc == null || swfSrc == "")
	{
		try {swfSrc = elem.src;}catch (e){}
	}
	if (swfSrc == null || swfSrc == "")
		swfSrc = getElementParam (elem, "src");
	if (swfSrc == null || swfSrc == "")
		swfSrc = getElementParam (elem, "movie");
	return swfSrc;
}
		
function isFlashObject (elem)
{
	return /x-shockwave-flash/i.test (getElementParam (elem, "type")) ||
		getFlashElementSwfUrl (elem) != "";
}

function getElementPosition(elem)
{
    return elem.getBoundingClientRect ();
}

function isFlashElement (elem)
{
    return /x-shockwave-flash/i.test ( elem.type ) ||
        getFlashElementSwfUrl (elem) != "";
}

function containFlash(ev, elem)
{
    if (!elem)
        return false;

    if (elem.tagName && (
            elem.tagName.toLowerCase() == "embed" || elem.tagName.toLowerCase() == "object"
		) && isFlashElement(elem))
    	return elem;

	// var e = elem;
    //
	// if (e.parentNode)
     //    e =  e.parentNode;
	// if (e.parentNode)
     //    e =  e.parentNode;
	// if (e.parentNode)
     //    e =  e.parentNode;

	var flashs_obj = document.getElementsByTagName('object');
	var flashs_emb = document.getElementsByTagName('embed');

    var flashs = [];
    flashs.push.apply(flashs, flashs_obj);
    flashs.push.apply(flashs, flashs_emb);

	if (!flashs || !flashs.length)
		return false;

	for (var i = 0; i < flashs.length; i++){

		var flash = flashs[i];

		if (isFlashElement(flash)){

            var rect = getElementPosition (flash);

            if (ev.clientY > rect.top && ev.clientY < rect.bottom
                && ev.clientX > rect.left && ev.clientX < rect.right)
                return flash;
		}
	}

	return false;
}

function containHtml5Video(ev, elem)
{
	if (!elem)
		return false;

    if (elem.tagName &&
        elem.tagName.toLowerCase() == "video")
        return elem;

	// var e = elem;

	// if (e.parentNode)
     //    e =  e.parentNode;
	// if (e.parentNode)
     //    e =  e.parentNode;
	// if (e.parentNode)
     //    e =  e.parentNode;

	var html5s = document.getElementsByTagName('video');

	if (!html5s || !html5s.length)
		return false;

	for (var i = 0; i < html5s.length; i++){

		var html5 = html5s[i];

        var rect = getElementPosition (html5);

        if (ev.clientY > rect.top && ev.clientY < rect.bottom
            && ev.clientX > rect.left && ev.clientX < rect.right)
            return html5;
	}

	return false;
}

// function isYouTubeHTML5Video (elem)
// {
// 	return elem &&
// 		(elem.id == 'movie_player' ||
// 			elem.parentNode && elem.parentNode.parentNode && elem.parentNode.parentNode.id == 'movie_player');
// }

function getOtherSwfUrls (elem)
{
	var obj = new Object;
	obj.OtherSwfUrls = "";
	obj.OtherFlashVars = "";
	
	function getOtherSwfUrls_2 (coll, elemExcept)
	{
		for (var i = 0; i < coll.length; i++)
		{
			var el = coll [i];
			if (!el)
				continue;
			if (el != elemExcept && isFlashObject (el))
			{
				obj.OtherSwfUrls += getFlashElementSwfUrl (el);
				obj.OtherSwfUrls += "\n";
				obj.OtherFlashVars += getElementParam (el, "flashvars");
				obj.OtherFlashVars += "\n";
			}
		}
	}

	function getOtherSwfUrls_impl (doc, elem)
	{
		getOtherSwfUrls_2 (doc.embeds, elem);
		getOtherSwfUrls_2 (doc.getElementsByTagName ("object"), elem);
		var frames = doc.defaultView.frames;
		for (var i = 0; i < frames.length; i++)
		{
			try {
				getOtherSwfUrls_impl (frames [i].document, elem);
			}
			catch (e) {}
		}
	}
	
	getOtherSwfUrls_impl (window.document, elem);
	
	return obj;
}
