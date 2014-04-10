/* Initialization */

var color = d3.scale.category20();
var defaultColors = ["red", "blue", "green", "magenta", "sienna", "teal", "goldenrod", "cyan", "indigo", "springgreen"];
var colorMapping = {};

var width = 400, w = 400; //960;
var height = 400, h = 400; //480;

var nodeCircles, dynamicNode,
	linkLines, dynLines,
	circles, labels,
	dynCircles, dynLabels,
	root;
	
	
/*** Create scales to handle zoom coordinates ***/
var xScaleCommunity = d3.scale.linear()
   .domain([0,w]);
var yScaleCommunity = d3.scale.linear()
   .domain([0,h]);
//ranges will be set later based on the size
//of the SVG

/*** Configure Force Layout ***/
var force2 = d3.layout.force()
	.on("tick", tickCommunity)
	.charge(-500)
	.linkDistance(200)
	.linkStrength(2)
	.gravity(0.1)
	.friction(0.2)
	.size([width, height]);
			
/*** Configure zoom behaviour ***/
var communityZoomer = d3.behavior.zoom()
	.scaleExtent([0.01,100])
	.on("zoom", communityZoom);
	//define the event handler function
function communityZoom() {
	//console.log("zoom", d3.event.translate, d3.event.scale);
	scaleFactor = d3.event.scale;
	translation = d3.event.translate;
	tickCommunity(); //update positions
}

/*** Configure drag behaviour ***/
var drag = d3.behavior.drag()
	.origin(function(d) { return d; }) //center of circle
	.on("dragstart", dragstarted)
	.on("drag", dragged)
	.on("dragend", dragended);
function dragstarted(d){ 
	d3.event.sourceEvent.stopPropagation();
	d3.select(this).classed("dragging", true);
	force2.stop(); //stop ticks while dragging
}
function dragged(d){
	if (d.fixed) return; //root is fixed
	//get mouse coordinates relative to the visualization
	//coordinate system:
	var mouse = d3.mouse(vis.node());
	d.x = xScaleCommunity.invert(mouse[0]); 
	d.y = yScaleCommunity.invert(mouse[1]); 
	tickCommunity();//re-position this node and any links
}
function dragended(d){
	d3.select(this).classed("dragging", false);
	force2.resume();
}

/*** Set the position of the elements based on data ***/
function tickCommunity() {
	linkLines.attr("x1", function (d) {
		return xScaleCommunity(d.source.x);
	})
	.attr("y1", function (d) {
		return yScaleCommunity(d.source.y);
	})
	.attr("x2", function (d) {
		return xScaleCommunity(d.target.x);
	})
	.attr("y2", function (d) {
		return yScaleCommunity(d.target.y);
	});

	circles.attr("cx", function (d) {
		return xScaleCommunity(d.x);
	})
	.attr("cy", function (d) {
		return yScaleCommunity(d.y);
	});
				
	labels.attr("dx", function (d) {
		return xScaleCommunity(d.x);
	})
	.attr("dy", function (d) {
		return yScaleCommunity(d.y);
	});				
}

/* Set the display size based on the SVG size and re-draw */
function setSize() {
	var svgStyles = window.getComputedStyle(svg.node());
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
   
	//console.log(xScaleCommunity.range(), yScaleCommunity.range());
	tickCommunity();//re-draw
}

//adapt size to window changes:
window.addEventListener("resize", setSize, false);

var communitySVG = d3.select("#communityGraph").append("svg:svg")
	.style("max-width", 2*w)
	.style("max-height", 2*h);

var communityGraph = communitySVG.append("g")
	.attr("class", "graph")
	.call(communityZoomer);

// Add a transparent background rectangle to catch
// mouse events for the zoom behaviour.
// Note that the rectangle must be inside the element (graph)
// which has the zoom behaviour attached, but must be *outside*
// the group that is going to be transformed.
var rect = communityGraph.append("rect")
	.attr("width", w)
	.attr("height", h)
	.style("fill", "none") 
	.style("pointer-events", "all");  

var communityVis = communityGraph.append("svg:g")
	.attr("class", "plotting-area");
					
					
					
/* ------- */			

var dynamicGraph = d3.select("#dynamic-graph")
	.attr("width", "100%")
	.attr("height", "100%")
	.attr("preserveAspectRatio", "xMidYMid meet")
	.attr("pointer-events", "all")
	.call(d3.behavior.zoom().on("zoom", redraw));
var force = d3.layout.force()
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

var capturedGeo = "";
var capturedTime = "";

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
	
	google.maps.event.addListener(map, 'idle', function() {
		//Do something when the user has stopped zooming/panning
		var lat0 = map.getBounds().getNorthEast().lat();
		var lng0 = map.getBounds().getNorthEast().lng();
		var lat1 = map.getBounds().getSouthWest().lat();
		var lng1 = map.getBounds().getSouthWest().lng();		
		//bbox = left,bottom,right,top
		//bbox = min Longitude , min Latitude , max Longitude , max Latitude 		
		// minlat=”40”&maxlat=”70”&minlon=”20”&maxlon=”70”
		capturedGeo = 'minlat="'+lat1+'"&maxlat="'+lat0+'"&minlon="'+lng1+'"&maxlon="'+lng0+'"';
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
				.attr("stroke", function (d, i) { 
					var c = color(i);
					if ( $("#level").val() === "1" ) {
						c = colorMapping[d.track_id];
					}
					else {
						c = colorMapping[d.comm];
					}
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
				.attr('r', 8)
				.attr("opacity", 1)
				.attr("fill", function (d, i) {
					var c = color(i);
					if ( $("#level").val() === "1" ) {
						c = colorMapping[d.track_id];
					}
					else {
						c = colorMapping[d.comm];
					}
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
	
		Reset(doReset);
		$("#communityBrowserForm").hide();
		$("#communityBrowserGraph").show();
    
		$.ajax({
			url: 'community/getcomm/',      
			type: 'GET',
			success: function(data) {
				var comm = data.split("/")[0];
				var lev = data.split("/")[1]
				
				//console.log("Time Boundaries");
				var capturedQuery = capturedGeo || "";

				try {
					var dateValues = $("#dateRangeSlider").dateRangeSlider("values");
					var mintime = moment(dateValues.min.toString().split('(')[0]).format("YYYY-MM-DD 00:00:00");
					var maxtime = moment(dateValues.max.toString().split('(')[0]).format("YYYY-MM-DD 23:59:59");
					capturedTime = 'mintime="'+mintime+'"&maxtime="'+maxtime+'"';
					if (capturedQuery) {
						capturedQuery = capturedQuery+'&'+capturedTime;
					}
				} catch(error) {
					// console.log("n/a");
				}
	  
				var serviceCall = "";
				if (doReset === true) {
					serviceCall = '?lev="'+lev+'"';
				}
				else if (capturedGeo) {
					serviceCall = '?'+capturedQuery;
				}
				else if (comm && lev && comm !== "0") {
					serviceCall = '?comm="'+comm+'"&lev="'+lev+'"';
				}
				else {
					serviceCall = '?lev="'+lev;
				}
				console.log(serviceCall);

				$.getJSON('myservice'+serviceCall, function (data) {
	
					console.log("Request Data Object");
					console.dir(data);
					
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
					
					/*

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
							//if ( $("#level").val() === "1" ) {
							//	c = color(d.comm_id);
							//	colorMapping[d.comm_id] = c;
							//}
							//else {
								c = color(d.nodename);
								colorMapping[d.nodename] = c;
							//}
							return c;
						});
					enter2.transition()
						.duration(transition_time)
						.attr("r", function(d) { 
							var r = d.num_members; //d.num_members*2+8;
							if ( $("#level").val() === "1" ) {
								r = 10;
							}
							return r;
						})
						.attr('stroke', "gray")
						.attr("fill",function(d,i){ 
							var c = color(i);
							//if ( $("#level").val() === "1" ) {
							//	c = color(d.comm_id);
							//	colorMapping[d.comm_id] = c;
							//}
							//else {
								c = color(d.nodename);
								colorMapping[d.nodename] = c;
							//}
							return c;
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
					*/
					
					var nodes = data["gephinodes"],
						links = data["gephigraph"];

					// Restart the force layout.
					force2.nodes(nodes)
						.links(links)
						.start();

					// Update the links…
					linkLines = communityVis.selectAll("line.link")
						.data(links/*, edgeid*/);

					// Enter any new links.
					linkLines.enter().insert("svg:line", ".node")
						.attr("class", "link")
						.style("stroke-width", function(d) {
							return d.weight * 0.1;
						});						;

					// Exit any old links.
					linkLines.exit().remove();

					// Update the nodes
					nodeCircles = communityVis.selectAll("circle.node")
						.data(nodes/*, nodename*/)
						.style("fill", function(d) {
							return color(d.nodename);
						})
						.enter();

					// Enter any new nodes.
					circles = nodeCircles.append("svg:circle")
						.attr("class", "node")
						.on("dblclick", openCommunity)
						.attr("r", function (d) {
							return parseInt(d.num_members) + 4;
						})
						.style("fill", function(d,i) {
							var c = color(i);
							//if ( $("#level").val() === "1" ) {
							//	c = color(d.comm_id);
							//	colorMapping[d.comm_id] = c;
							//}
							//else {
								c = color(d.nodename);
								colorMapping[d.nodename] = c;
							//}
							return c;
						})
						.call(drag); //attach drag behaviour
				
					labels = nodeCircles.append("svg:text")
						.attr("class", "label")
						.on("dblclick", openCommunity)
						.style("opacity", function(d, i) {
							var lab = $("#labelsEnabled");
							if (lab.prop('checked') === true) {
								return 1.0;
							}
							return 0;						
						})
						.text( function(d) { 
							if (true) {
								return d.nodename; 
							}
							return "";
						});

					// Exit any old nodes.
					//nodeCircles.exit().remove();

					// Set initial size and trigger a tickCommunity() function
					setSize();					

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
						
						// Restart the force layout.
						force.nodes(data["result"])
							.links(data["graph"])
							.start();

						// Update the links…
						dynLines = dynamicGraph.selectAll("line.link")
							.data(data["graph"]/*, edgeid*/);

						// Enter any new links.
						dynLines.enter().insert("svg:line", ".node")
							.attr("class", "link")
							.style("opacity", 0.0)
							.style("stroke-width", 1.0);

						// Update the nodes
						dynamicNode = dynamicGraph.selectAll("circle.node")
							.data(data["result"]/*, nodename*/)
							.style("fill", function(d) {
								return color(d.track_id);
							})
							.enter();

						// Enter any new nodes.
						dynCircles = dynamicNode.append("svg:circle")
							.attr("class", "node")
							.attr("r", 15)
							//.style("opacity", 0.0)
							.style("fill", function (d, i) {
								var c = color(i);
								if ( $("#level").val() === "1" ) {
									c = colorMapping[d.track_id];
								}
								else {
									c = colorMapping[d.comm];
								}
								return c;
							});
						dynCircles.transition()
							.duration(transition_time)
							.attr("r", 10)
							.style("opacity", 1.0)
							.style("stroke", "gray")
							.style("fill", function (d, i) {
								var c = color(i);
								if ( $("#level").val() === "1" ) {
									c = colorMapping[d.track_id];
								}
								else {
									c = colorMapping[d.comm];
								}
								return c;
							});
						dynCircles.call(force.drag)
							.append("title")
							.text(function (d) {
								return d.track_id;
							});							
				
						dynLabels = dynamicNode.append("svg:text")
							.attr("class", "label")
							.attr("fill", "white")
							.style("opacity", function(d, i) {
								var lab = $("#labelsEnabled");
								if (lab.prop('checked') === true) {
									return 1.0;
								}
								return 0;						
							})
							.text( function(d) { 
								if (true) {
									return d.track_id; 
								}
								return "";
							});
							
							force.on("tick", function () {
								dynCircles.attr("cx", function (d) { return d.x; })
									.attr("cy", function (d) { return d.y; });
								dynLines.attr("x1", function(d) { return d.source.x; })
									.attr("y1", function(d) { return d.source.y; })
									.attr("x2", function(d) { return d.target.x; })
									.attr("y2", function(d) { return d.target.y; });
								dynLabels.attr("dx", function (d) {
									return d.x;
								})
								.attr("dy", function (d) {
									return d.y;
								});										
							});							

						/*
						
						//console.log("Color Map:");
						//console.dir(colorMapping);

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
							.data(data["result"], trackid).enter();
						
						dynCircles = node.append("circle")
							.classed("node", true)
							.attr("r", 15)
							.style("opacity", 0.0)
							.style("fill", function (d, i) {
								var c = color(i);
								if ( $("#level").val() === "1" ) {
									c = colorMapping[d.track_id];
								}
								else {
									c = colorMapping[d.comm];
								}
								return c;

							});
						dynCircles.transition()
							.duration(transition_time)
							.attr("r", 10)
							.style("opacity", 1.0)
							.style("stroke", "gray")
							.style("fill", function (d, i) {
								var c = color(i);
								if ( $("#level").val() === "1" ) {
									c = colorMapping[d.track_id];
								}
								else {
									c = colorMapping[d.comm];
								}
								return c;
							});
						dynCircles.call(force.drag)
							.append("title")
							.text(function (d) {
								return d.track_id;
							});
						//node.exit()
						//	.transition()
						//	.duration(transition_time)
						//	.style("opacity", 0.0)
						//	.attr("r", 0.0)
						//	.style("fill", "black")
						//	.remove();
		  
					dynLabels = node.append("svg:text")
						.attr("class", "label")
						.attr("fill", "white")
						.style("opacity", function(d, i) {
							var lab = $("#labelsEnabled");
							if (lab.prop('checked') === true) {
								return 1.0;
							}
							return 0;						
						})
						.text( function(d) { 
							if (true) {
								return "jpb"; //d.track_id; 
							}
							return "";
						});
						
						force.nodes(data["result"])
							.links(data["graph"])
							.start();
						force.on("tick", function () {
							dynCircles.attr("cx", function (d) { return d.x; })
								.attr("cy", function (d) { return d.y; });
							link.attr("x1", function(d) { return d.source.x; })
								.attr("y1", function(d) { return d.source.y; })
								.attr("x2", function(d) { return d.target.x; })
								.attr("y2", function(d) { return d.target.y; });
						});*/
						
					}
	  
				});
			}
		});
	
		function openCommunity(d) {
			d3.event.stopPropagation();
			d3.event.preventDefault();
			var comm = d.node_comm;
			var node = d.nodename;
			
			var table = $("#track-table").val();
			var level = $("#level").val();
			
			if (level > 1) {
				level = level -1;

				$.get("community/settable/" + table)
					.then(function(){
						$.get("community/setcomm/" + node + '/' + level)
							.then( function() {
								$("#level").select2("val", level);
								$("#comm-id").val(node);
								$('#comm-id').clearableTextField();
								capturedGeo = "";
								refreshFunction();
							});
					});
			}
			else {
				// can no longer go deeper into the graph
			}
		}	
		
    
	};
	reloadPanels = function() {
		var doReset = false;
		refreshFunction(doReset);
	};
	resetPanels = function() {
		var doReset = true;
		refreshFunction(doReset);
	};
  
	$("#refresh").click(reloadPanels);

	$("#applyCommunity").click(function(e) {
		e.stopPropagation();
		e.preventDefault();	
		updateCommunities();
	});
	
	$("#captureCommunity").click(function(e) {
		e.stopPropagation();
		e.preventDefault();	
		filterCommunities(); //filterCommunities();
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

function Reset(resetMap) {
	//console.log("Current Bounds: "+map.getBounds());

	heatmap.setMap(null);
	//d3.select('#community-id').text("ID: None");
	dynamicGraph.selectAll("circle.node").remove();
	dynamicGraph.selectAll("line.link").remove();
	dynamicGraph.selectAll("text.label").remove();
	
	communityVis.selectAll("circle.node").remove();
	communityVis.selectAll("line.link").remove();
	communityVis.selectAll("text.label").remove();
	
	dynamicGraph.call( function() {
		var zoom = d3.behavior.zoom().translate([0,0]).scale(1);
		dynamicGraph.call(zoom.on("zoom", redraw));
		//console.log("reset dynamic graph zoom scale");	
	});	
    
	if (resetMap === true) { 
		map.setCenter(new google.maps.LatLng(0, 0));
		map.setZoom(2);
	}

	colorMapping = {};
	currentGeoJson = [];
	overlay.draw();
}

d3.select('#time-slider').call(timeSlider = d3.slider().on("slide", function(evt, value) {
	SetCircles(value);
	SetRelationships(value);
}));
