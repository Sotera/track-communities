/* Utility Functions, graph and naming helpers */

function pad(num, size) {
	var s = "000000" + num;
	return s.substr(s.length-size);
}

function edgeid(edge) { 
	return edge.source + ':' +  edge.target;
}

function trackid(track) {
	return track.track_id;
}

function nodename(node) {
	return node.nodename;
}

function getColor(index) {
	var trackColor;
	if (index >= defaultColors.length) {
		trackColor = '#'+pad(Math.floor(Math.random()*16777215).toString(16),6);
		defaultColors.push(trackColor);
	} else {
		trackColor = defaultColors[index];
	}
	return trackColor;
}

function redraw() {
	dynamicGraph.select("g#dglinks").attr("transform",
		"translate(" + d3.event.translate + ")"
		+ " scale(" + d3.event.scale + ")");
	dynamicGraph.select("g#dgnodes").attr("transform",
		"translate(" + d3.event.translate + ")"
		+ " scale(" + d3.event.scale + ")");
}

function redrawCommunity() {
	communityBrowser.select("g#cblinks").attr("transform",
		"translate(" + d3.event.translate + ")"
		+ " scale(" + d3.event.scale + ")");
	communityBrowser.select("g#cbnodes").attr("transform",
		"translate(" + d3.event.translate + ")"
	+ " scale(" + d3.event.scale + ")");
}

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
