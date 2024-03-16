var mgr = new FdmDomElementVideoButtonsManager ( window );
mgr.register ();

function on_unload ()
{
	mgr.unregister ();
	window.removeEventListener ("unload", on_unload, false);
}

window.addEventListener ("unload", on_unload, false);