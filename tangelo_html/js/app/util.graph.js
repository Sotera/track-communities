/* Utility Functions, graph and naming helpers */

// Node/edge naming
function edgeid(edge) { 
	return edge.source + ':' +  edge.target;
}
function trackid(track) {
	return track.track_id;
}
function nodename(node) {
	return node.nodename;
}

// Dynamic Graph interactions
function SetRelationships(value) {
	var currentDate = new Date(startTime.getTime() + ((endTime.getTime() - startTime.getTime()) * value / 100));
	link = dynamicVis.selectAll("line.link")
		.style("fill", "white")
		.style("stroke-width", function(d) {
			return d.value;
		})
		.style("opacity", function(d) {
			startD = new Date(d.start);
			endD = new Date(d.end);
			//console.log(startD + ' <= ' + currentDate + ' < ' + endD);
			if ( startD <= currentDate && currentDate < endD ) {
				return 1.0;
			}
			else {
				return 0.0;
			}
		});
}

// Zoom interactions

function dyngraphBounds() {
	var nodeWidth = 16, nodeHeight = 16;
    var x = Number.POSITIVE_INFINITY, X=Number.NEGATIVE_INFINITY, y=Number.POSITIVE_INFINITY, Y=Number.NEGATIVE_INFINITY;
    dynamicNode.each(function (v) {
        x = Math.min(x, v.x - nodeWidth / 2);
        X = Math.max(X, v.x + nodeWidth / 2);
        y = Math.min(y, v.y - nodeHeight / 2);
        Y = Math.max(Y, v.y + nodeHeight / 2);
    });
    return { x: x, X: X, y: y, Y: Y };
}
function dynzoomToFit() {
	dynamicForce.stop();
	
	var outer = dynrect;
    var b = dyngraphBounds();
    var w = b.X - b.x, h = b.Y - b.y;
    var cw = outer.attr("width"), ch = outer.attr("height");
    var s = Math.min(cw / w, ch / h);
    var tx = (-b.x * s + (cw / s - w) * s / 2), ty = (-b.y * s + (ch / s - h) * s / 2);
    dynamicZoomer.translate([tx, ty]).scale(s);
	
	dynamicForce.start();
	tickDynamic();
}

function graphBounds() {
	var nodeWidth = 16, nodeHeight = 16;
    var x = Number.POSITIVE_INFINITY, X=Number.NEGATIVE_INFINITY, y=Number.POSITIVE_INFINITY, Y=Number.NEGATIVE_INFINITY;
    communityNode.each(function (v) {
        x = Math.min(x, v.x - nodeWidth / 2);
        X = Math.max(X, v.x + nodeWidth / 2);
        y = Math.min(y, v.y - nodeHeight / 2);
        Y = Math.max(Y, v.y + nodeHeight / 2);
    });
    return { x: x, X: X, y: y, Y: Y };
}
function zoomToFit() {
	communityForce.stop();
	
	var outer = rect;
    var b = graphBounds();
    var w = b.X - b.x, h = b.Y - b.y;
    var cw = outer.attr("width"), ch = outer.attr("height");
    var s = Math.min(cw / w, ch / h);
    var tx = (-b.x * s + (cw / s - w) * s / 2), ty = (-b.y * s + (ch / s - h) * s / 2);
    communityZoomer.translate([tx, ty]).scale(s);
	
	communityForce.start();
	tickCommunity();
}
