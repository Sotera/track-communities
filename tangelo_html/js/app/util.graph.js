/* Utility Functions, graph and naming helpers */

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
	//XDATA.LOGGER.logSystemActivity("System has updated dynamic graph edges.");
}

/* Set the display size based on the SVG size and re-draw */
function setSize() {
	var svgStyles = window.getComputedStyle(communitySVG.node());
	var svgW = parseInt(svgStyles["width"]);
	var svgH = parseInt(svgStyles["height"]);
			
	//Set the output range of the scales
	xScaleCommunity.range([0, svgW]);
	yScaleCommunity.range([0, svgH]);
		
	//re-attach the scales to the zoom behaviour
	communityZoomer.x(xScaleCommunity)
	  .y(yScaleCommunity);
	
	//resize the background
	rect.attr("width", svgW)
		.attr("height", svgH);

	tickCommunity();//re-draw
	
	XDATA.LOGGER.logSystemActivity("System has resized community browser.");
}
function setDynamicSize() {
	var svgStyles = window.getComputedStyle(dynamicSVG.node());
	var svgW = parseInt(svgStyles["width"]);
	var svgH = parseInt(svgStyles["height"]);
			
	//Set the output range of the scales
	dynxScaleCommunity.range([0, svgW]);
	dynyScaleCommunity.range([0, svgH]);
		
	//re-attach the scales to the zoom behaviour
	dynamicZoomer.x(dynxScaleCommunity)
	  .y(dynyScaleCommunity);
	
	//resize the background
	dynrect.attr("width", svgW)
		.attr("height", svgH);

	tickDynamic();//re-draw
	
	XDATA.LOGGER.logSystemActivity("System has resized dynamic graph.");
}

// Zoom interactions
function dyngraphBounds() {
	var nodeWidth = 16, nodeHeight = 16;
    var x = Number.POSITIVE_INFINITY, X=Number.NEGATIVE_INFINITY, y=Number.POSITIVE_INFINITY, Y=Number.NEGATIVE_INFINITY;
	if (dynamicNode) {
		dynamicNode.each(function (v) {
			x = Math.min(x, v.x - nodeWidth / 2);
			X = Math.max(X, v.x + nodeWidth / 2);
			y = Math.min(y, v.y - nodeHeight / 2);
			Y = Math.max(Y, v.y + nodeHeight / 2);
		});
	}
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
	
	XDATA.LOGGER.logUserActivity("User has requested the dynamic graph to center-zoom.", "zoom",  XDATA.LOGGER.WF_EXPLORE);
}

function graphBounds() {
	var nodeWidth = 16, nodeHeight = 16;
    var x = Number.POSITIVE_INFINITY, X=Number.NEGATIVE_INFINITY, y=Number.POSITIVE_INFINITY, Y=Number.NEGATIVE_INFINITY;
    if (communityNode) {
		communityNode.each(function (v) {
			x = Math.min(x, v.x - nodeWidth / 2);
			X = Math.max(X, v.x + nodeWidth / 2);
			y = Math.min(y, v.y - nodeHeight / 2);
			Y = Math.max(Y, v.y + nodeHeight / 2);
		});
	}
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
	
	XDATA.LOGGER.logUserActivity("User has requested the community browser to center-zoom.", "zoom",  XDATA.LOGGER.WF_EXPLORE);
}

/*** Set the position of the elements based on data ***/
function tickCommunity() {
	communityLink.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });
	communityNode.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });
	communityLabel.attr("dx", function(d) { return d.x; })
		.attr("dy", function(d) { return d.y; });	 			
}
function tickDynamic() {
	dynamicLink.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });
	dynamicNode.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });
	dynamicLabel.attr("dx", function(d) { return d.x; })
		.attr("dy", function(d) { return d.y; });	 			
}

/*** Configure drag behaviour ***/
function dragstarted(d){ 
	XDATA.LOGGER.logUserActivity("User has started to drag community browser node.", "drag",  XDATA.LOGGER.WF_EXPLORE);
	d3.event.sourceEvent.stopPropagation();
	d3.select(this).classed("fixed", d.fixed = false);
	d3.select(this).classed("dragging", true);
	//force.stop(); //stop ticks while dragging
}
function dragged(d){
	if (d.fixed) return; //root is fixed
	d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
	d.fixed = true;
	tickCommunity();//re-position this node and any links
	d.fixed = false;
}
function dragended(d){
	XDATA.LOGGER.logUserActivity("User has stopped dragging community browser node.", "drag",  XDATA.LOGGER.WF_EXPLORE);
	d3.select(this).classed("dragging", false);
	d3.select(this).classed("fixed", d.fixed = true);
	//force.resume();
}
function dyndragstarted(d){ 
	XDATA.LOGGER.logUserActivity("User has started to drag dynamic graph node.", "drag",  XDATA.LOGGER.WF_EXPLORE);
	d3.event.sourceEvent.stopPropagation();
	d3.select(this).classed("fixed", d.fixed = false);
	d3.select(this).classed("dragging", true);
	//force.stop(); //stop ticks while dragging
}
function dyndragged(d){
	if (d.fixed) return; //root is fixed
	d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
	d.fixed = true;
	tickDynamic();//re-position this node and any links
	d.fixed = false;
}
function dyndragended(d){
	XDATA.LOGGER.logUserActivity("User has stopped dragging dynamic graph node.", "drag",  XDATA.LOGGER.WF_EXPLORE);
	d3.select(this).classed("dragging", false);
	d3.select(this).classed("fixed", d.fixed = true);
	//force.resume();
}