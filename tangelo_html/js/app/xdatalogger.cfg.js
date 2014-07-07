var XDATA = {};

	XDATA["LOGGER_URI"] = "http://hostname:1337";
	XDATA["LOGGER_COMPONENT"] = "Track Communities";
	XDATA["LOGGER_COMPONENT_VER"] = "0.2.1";

	XDATA["LOGGER"] = new activityLogger().echo(true).testing(true).mute([]);
	// Send the path to worker script file for v2.1.1+
	// XDATA["LOGGER"] = new activityLogger('lib/xdatalogger/draper.activity_worker-2.1.1.js').echo(true).testing(true);
