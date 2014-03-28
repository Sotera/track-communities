/* Utility Functions, coordinate and map helpers */

function destination(lat1, lon1, brng, d) {
	var R = 6371;
	var brngR = brng.toRad();
	var lat1r = lat1.toRad();
	var lon1r = lon1.toRad();
	var lat2 = Math.asin( Math.sin(lat1r)*Math.cos(d/R) + 
		Math.cos(lat1r)*Math.sin(d/R)*Math.cos(brngR) );
	var lon2 = lon1r + Math.atan2(Math.sin(brngR)*Math.sin(d/R)*Math.cos(lat1r), 
		Math.cos(d/R)-Math.sin(lat1r)*Math.sin(lat2));
	return [lon2.toDeg(), lat2.toDeg()];
}

function bearing(lat1, lat2, lon1, lon2) {
	var dLon = (lon2 - lon1).toRad();
	var lat1r = lat1.toRad();
	var lat2r = lat2.toRad();
	var y = Math.sin(dLon) * Math.cos(lat2r);
	var x = Math.cos(lat1r)*Math.sin(lat2r) -
		Math.sin(lat1r)*Math.cos(lat2r)*Math.cos(dLon);
	var brng = Math.atan2(y, x).toDeg();
	return brng;
}

function distance(lat1, lat2, lon1, lon2) {
	var R = 6371; // km
	var dLat = (lat2-lat1).toRad();
	var dLon = (lon2-lon1).toRad();
	var lat1r = lat1.toRad();
	var lat2r = lat2.toRad();
  
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1r) * Math.cos(lat2r); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c;
	return d;
}