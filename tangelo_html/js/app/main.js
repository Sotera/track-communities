/* Initialization */

var color = d3.scale.category20();
var defaultColors = ["red", "blue", "green", "magenta", "sienna", "teal", "goldenrod", "cyan", "indigo", "springgreen"];
var colorMapping = {};

var width = 400; //960;
var height = 400; //480;

var dynamicGraph = d3.select("#dynamic-graph")
	.attr("width", "100%")
	.attr("height", "100%")
	.attr("preserveAspectRatio", "xMidYMid meet")
	.attr("pointer-events", "all")
	.call(d3.behavior.zoom().on("zoom", redraw));
var communityBrowser = d3.select("#community-graph")
	.attr("width", "100%")
	.attr("height", "100%")
	.attr("preserveAspectRatio", "xMidYMid meet")
	.attr("pointer-events", "all")
	.call(d3.behavior.zoom().on("zoom", redrawCommunity));;
var force = d3.layout.force()
	.charge(-500)
	.linkDistance(200)
	.linkStrength(2)
	.gravity(0.1)
	.friction(0.2)
	.size([width, height]); 
var communityForce = d3.layout.force()
	.charge(-500)
	.linkDistance(200)
	.linkStrength(2)
	.gravity(0.1)
	.friction(0.2)
	.size([width, height]);

var overlay;
var svg;

var g;
var googleMapProjection;
var currentGeoJson = [];
var map;
var heatmap = new google.maps.visualization.HeatmapLayer({ data: []}); 

var transition_time = 1000;
var startTime = new Date();
var endTime = new Date();

var mySlider;
var animate = false;
var playSpeed = .1;
var animateInterval = 10;
var timeout = null;

var reloadPanels = null;
var resetPanels = null;

/*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*/


$(function () {
	
	setConfig();
	d3.select('#slidertext').text(startTime);
  
	//create google map
	var $map=$("#map-canvas");
	map = new google.maps.Map($map[0], {
		zoom: 2,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		center: new google.maps.LatLng(0, 0)
	});
	//create the overlay on which we will draw our heatmap
	overlay = new google.maps.OverlayView();
	overlay.onAdd = function () {
	
		var layer = d3.select(this.getPanes().overlayMouseTarget).append("div").attr("class", "SvgOverlay");
		svg = layer.append("svg");
		g = svg.append("g");

		overlay.draw = function () {
			var markerOverlay = this;
			var overlayProjection = markerOverlay.getProjection();

			// Turn the overlay projection into a d3 projection
			googleMapProjection = function (coordinates) {
				var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
				var pixelCoordinates = overlayProjection.fromLatLngToDivPixel(googleCoordinates);
				return [pixelCoordinates.x+4000, pixelCoordinates.y+4000];
			};

			path = d3.geo.path().projection(googleMapProjection);

			geodata = g.selectAll("path")
				.data(currentGeoJson, trackid)
				.attr("d", path);

			geodata.enter()
				.append("svg:path")
				.attr("opacity", .5)
				.attr("fill", "none")
				.attr("stroke", function (d) { 
					var comm = d.comm;
					var c = colorMapping[comm] || color(d.index);
					return c;
				})
				.attr("d", path);

			geodata.exit().remove();

			var geocircles = g.selectAll("circle")
				.data(currentGeoJson, trackid)
				.attr('cx', function(d) {
					var coordinates = googleMapProjection([d.coordinates[0][0], 0]);
					return coordinates[0];
				})
				.attr('cy', function(d) {
					var coordinates = googleMapProjection([0, d.coordinates[0][1]]);
					return coordinates[1];
				});
		  
			geocircles.enter().append('svg:circle')
				.attr('cx', function(d) {
					var coordinates = googleMapProjection([d.coordinates[0][0], 0]);
					return coordinates[0];
				})
				.attr('cy', function(d) {
					var coordinates = googleMapProjection([0, d.coordinates[0][1]]);
					return coordinates[1];
				})
				.attr('r', 5)
				.attr("opacity", 1)
				.attr("fill", function (d) {
					var comm = d.comm;
					var c = colorMapping[comm] || color(d.index);
					return c;
				})
				.attr('stroke', "gray")
				.append("svg:title")
				.text(function(d) { return d.track_id; });
		  
			geocircles.exit().remove();

		};
	};
	overlay.setMap(map);

	$("#play").click(function () {
		animate = !animate;
    
		var buttonLabel = "Play";
		if (animate) {
			buttonLabel = "Pause";
		timeout = setInterval(AnimateTracks, animateInterval);
		} else {
			clearInterval(timeout);
		}
		$("#play").text(buttonLabel);
    
		if (timeSlider.value() >= 100) {
			timeSlider.value(0);
		}
	});
  
	var refreshFunction = function (doReset) {
	
		Reset(false);
		$("#communityBrowserForm").hide();
		$("#communityBrowserGraph").show();
    
		$.ajax({
			url: 'community/getcomm/',      
			type: 'GET',
			success: function(data) {
				var comm = data.split("/")[0];
				var lev = data.split("/")[1]
	  
				var serviceCall = "";
				if (doReset === true) {
					serviceCall = '?lev="'+lev+'"';
				}
				else if (comm && lev && comm !== "0") {
					serviceCall = '?comm="'+comm+'"&lev="'+lev+'"';
				}
				else {
					serviceCall = '?lev="'+lev+'"';
				}
				console.log(serviceCall);

				//d3.select('#community-id').text("ID: "+comm);
	
				$.getJSON('myservice'+serviceCall, function (data) {
	
					//console.log("Service Call Data Object");
					//console.dir(data);
					
					// Handle heat map overlay...
					if ($('#heatMapEnabled').is(':checked')) {
						renderHeatMap();
					}		

					// Community Browser
					tau2 = 2 * Math.PI;
					angle2 = tau2 / data["gephinodes"].length;
					$.each(data["gephinodes"], function (i, v) {
						data["gephinodes"][i].x = (width / 4) * Math.cos(i * angle2) + (width / 2);
						data["gephinodes"][i].y = (height / 4) * Math.sin(i * angle2) + (height / 2);
					});

					link2 = communityBrowser.select("g#cblinks")
						.selectAll(".link")
						.data(data["gephigraph"], edgeid);
					enter2 = link2.enter().append("line")
						.classed("link", true)
						.style("stroke-width", function(d) {
							return d.weight * 0.1;
						})
					enter2.transition()
						.duration(transition_time)
						.style("stroke", "black")
						.style("stroke-width", function(d) {
							return d.weight * 0.1;
						})
					link2.exit()
						.transition()
						.duration(transition_time)
						.style("opacity", 0.0)
						.style("stroke-width", 0.0)
						.remove();
	  
					node2 = communityBrowser.select("g#cbnodes")
						.selectAll(".node")
						.data(data["gephinodes"], nodename);
					enter2 = node2.enter().append("circle")
						.classed("node", true)
						.on("dblclick", openCommunity)
						.attr("r", function(d) { 
							var r = d.num_members; //d.num_members*2+8;
							return r;
						})
						.attr("fill",function(d,i){ 
							var c = color(i);
							colorMapping[d.node_comm] = c;
							return c;
						});
					enter2.transition()
						.duration(transition_time)
						.attr("r", function(d) { 
							var r = d.num_members; //d.num_members*2+8;
							return r;
						})
						.style("stroke", "black")
						.style("stroke-width", 0.5)
						.attr("fill",function(d,i){ 
							return color(i);
						});
					enter2.call(communityForce.drag)
						.append("title")
						.text(function (d) {
							return d.nodename;
						});
					node2.exit()
						.transition()
						.duration(transition_time)
						.attr("r", 0.0)
						.style("fill", "black")
						.remove();
	  
					communityForce.nodes(data["gephinodes"])
						.links(data["gephigraph"])
						.start();
					communityForce.on("tick", function () {
						node2.attr("cx", function (d) { return d.x; })
							.attr("cy", function (d) { return d.y; });
						link2.attr("x1", function(d) { return d.source.x; })
							.attr("y1", function(d) { return d.source.y; })
							.attr("x2", function(d) { return d.target.x; })
							.attr("y2", function(d) { return d.target.y; });
					});						
	  
					// Handle map, dynamic graph render only if there is existing data...
					if (data["result"]) {
						currentGeoJson = data["result"];
						
						var xdiff = data.bounds.east - data.bounds.west;
						var ydiff = data.bounds.north - data.bounds.south;
				  
						var centerx = xdiff / 2 + data.bounds.west;
						var centery = ydiff / 2 + data.bounds.south;
				  
						map.setCenter(new google.maps.LatLng(centery, centerx));
			  
						var sw = new google.maps.LatLng(data.bounds.south, data.bounds.west);
						var ne = new google.maps.LatLng(data.bounds.north, data.bounds.east);
						map.fitBounds(new google.maps.LatLngBounds(sw, ne));

						overlay.draw();						

						startTime = new Date(Date.parse(data["start"]));
						endTime = new Date(Date.parse(data["end"]));
		  
						d3.select('#slidertext').text(startTime);
	
						// Dynamic Graph
						tau = 2 * Math.PI;
						angle = tau / data["result"].length;
						$.each(data["result"], function (i, v) {
							data["result"][i].x = (width / 4) * Math.cos(i * angle) + (width / 2);
							data["result"][i].y = (height / 4) * Math.sin(i * angle) + (height / 2);
						});
						
						console.log("Color Map:");
						console.dir(colorMapping);

						link = dynamicGraph.select("g#dglinks")
							.selectAll(".link")
							.data(data["graph"], edgeid);
						enter = link.enter().append("line")
							.classed("link", true)
							.style("opacity", 0.0)
							.style("stroke-width", 1.0);
						enter.transition()
							.duration(transition_time)
							.style("opacity", 0.0)
							.style("stroke", "#FFFFFF")
							.style("stroke-width", 1.0);
						link.exit()
							.transition()
							.duration(transition_time)
							.style("opacity", 0.0)
							.style("stroke-width", 0.0)
							.remove();
		  
						node = dynamicGraph.select("g#dgnodes")
							.selectAll(".node")
							.data(data["result"], trackid);
						enter = node.enter().append("circle")
							.classed("node", true)
							.attr("r", 15)
							.style("opacity", 0.0)
							.style("fill", function (d) {
								var comm = d.comm;
								var c = colorMapping[comm] || color(d.index);
								return c;
							});
						enter.transition()
							.duration(transition_time)
							.attr("r", 10)
							.style("opacity", 1.0)
							.style("stroke", "gray")
							.style("fill", function (d) {
								var comm = d.comm;
								var c = colorMapping[comm] || color(d.index);
								return c;
							});
						enter.call(force.drag)
							.append("title")
							.text(function (d) {
								return d.track_id;
							});
						node.exit()
							.transition()
							.duration(transition_time)
							.style("opacity", 0.0)
							.attr("r", 0.0)
							.style("fill", "black")
							.remove();
		  

						force.nodes(data["result"])
							.links(data["graph"])
							.start();
						force.on("tick", function () {
							node.attr("cx", function (d) { return d.x; })
								.attr("cy", function (d) { return d.y; });
							link.attr("x1", function(d) { return d.source.x; })
								.attr("y1", function(d) { return d.source.y; })
								.attr("x2", function(d) { return d.target.x; })
								.attr("y2", function(d) { return d.target.y; });
						});
						
					}
	  
				});
			}
		});
	
		function openCommunity(d) {
			d3.event.stopPropagation();
			d3.event.preventDefault();
			var comm = d.node_comm;
			var node = d.nodename;
			if (comm === node) {
				// do something here
			}
			else {
				var table = $("#track-table").val();
				var level = $("#level").val(); //$("#level").editable('getValue', true);
				$("#comm-id").val(comm); //$("#comm-id").editable('setValue', comm);
		  
				$.get("community/settable/" + table)
					.then(function(){
						$.get("community/setcomm/" + comm + '/' + level)
							.then( function() {
								refreshFunction();
							});
					});
			}
		}	
		
    
	};
	reloadPanels = refreshFunction;
	resetPanels = function() {
		var doReset = true;
		refreshFunction(doReset);
	}
  
	$("#refresh").click(reloadPanels);

	$("#applyCommunityFilter").click(function(e) {
		e.stopPropagation();
		e.preventDefault();	
		updateCommunities();
	});
	//$("#loadCommunitiesFromFilter").click(updateConfig);  
  
	$("#reset").click(function () {
		Reset(true);
		$("#communityBrowserForm").show();
		$("#communityBrowserGraph").hide();		
	});

	$("#heatmap-remove").click(function () {
		heatmap.setMap(null);    
	});

	$("#heatmap").click(renderHeatMap);

});

function renderHeatMap() {

	$.ajax({
		"url":"heatmap/map",
		"type" : "GET"
	}).done(function(data){
		eval("var heatdata = " + data);
		heatmap.setMap(null);
		heatmap.setData(heatdata);
		heatmap.set('radius', heatmap.get('radius') ? null : 15);
		heatmap.setMap(map);
	});

}

function Reset(full) {
	//console.log("Current Bounds: "+map.getBounds());

	heatmap.setMap(null);
	//d3.select('#community-id').text("ID: None");
	dynamicGraph.select("g#dgnodes").selectAll(".node").remove();
	dynamicGraph.select("g#dglinks").selectAll(".link").remove();

	communityBrowser.select("g#cbnodes").selectAll(".node").remove();
	communityBrowser.select("g#cblinks").selectAll(".link").remove();
	
	communityBrowser.call( function() {
		var zoom = d3.behavior.zoom().translate([0,0]).scale(1);
		communityBrowser.call(zoom.on("zoom", redrawCommunity));
		//console.log("reset community browser graph zoom scale");		
	});
	dynamicGraph.call( function() {
		var zoom = d3.behavior.zoom().translate([0,0]).scale(1);
		dynamicGraph.call(zoom.on("zoom", redraw));
		//console.log("reset dynamic graph zoom scale");	
	});	
    
	map.setCenter(new google.maps.LatLng(0, 0));
	map.setZoom(2);

	colorMapping = {};
	currentGeoJson = [];
	overlay.draw();
}

d3.select('#time-slider').call(timeSlider = d3.slider().on("slide", function(evt, value) {
	SetCircles(value);
	SetRelationships(value);
}));
