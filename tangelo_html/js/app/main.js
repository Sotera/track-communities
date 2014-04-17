/* Initialization */
XDATA.LOGGER.registerActivityLogger(XDATA["LOGGER_URI"], XDATA["LOGGER_COMPONENT"], XDATA["LOGGER_COMPONENT_VER"]);
XDATA.LOGGER.logSystemActivity("Application startup initiated.");

var color = d3.scale.category20();
var colorMapping = {};

var width = 500;
var height = 500;

/*** Create scales to handle zoom coordinates ***/
var xScaleCommunity = d3.scale.linear()
   .domain([0,width]);
var yScaleCommunity = d3.scale.linear()
   .domain([0,height]);
var dynxScaleCommunity = d3.scale.linear()
   .domain([0,width]);
var dynyScaleCommunity = d3.scale.linear()
   .domain([0,height]);

/*** Configure Force Layout ***/
var dynamicForce = d3.layout.force()
	.on("tick", tickDynamic)
	.charge(-500)
	.linkDistance(200)
	.linkStrength(2)
	.gravity(0.1)
	.friction(0.2)
	.size([width, height]); 
var communityForce = d3.layout.force()
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
function communityZoom() {
	 communityVis.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}
var dynamicZoomer = d3.behavior.zoom()
	.scaleExtent([0.01,100])
	.on("zoom", dynamicZoom);
function dynamicZoom() {
	 dynamicVis.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

/*** Configure drag behaviour ***/
var drag = d3.behavior.drag()
	.origin(function(d) { return d; }) //center of circle
	.on("dragstart", dragstarted)
	.on("drag", dragged)
	.on("dragend", dragended);
var dyndrag = d3.behavior.drag()
	.origin(function(d) { return d; }) //center of circle
	.on("dragstart", dyndragstarted)
	.on("drag", dyndragged)
	.on("dragend", dyndragended);

/*** Stylized tool tip behaviour ***/
var communityTooltip = d3.tip()
	.attr('class', 'd3-tip')
	.html(function(d) { 
		var html = '<small>'
			+ '<strong>Node Name:</strong> '+d.nodename+'<br/>'
			+ '<strong>Community:</strong> '+d.node_comm+"/"+d.level+'<br/>'
			+ '<strong>Members:</strong> '+d.num_members+'<br/>'
			+ '</small>';
		return html;
	});

window.addEventListener("resize", setSize, false);
window.addEventListener("resize", setDynamicSize, false);

var communitySVG = d3.select("#communityGraph").append("svg:svg")
    .attr("width", "100%")
    .attr("height", "100%");
var communityGraph = communitySVG.append("g")
	.attr("class", "graph")
	.call(communityZoomer);
	
var dynamicSVG = d3.select("#dynamicGraph").append("svg:svg")
    .attr("width", "100%")
    .attr("height", "100%");
var dynamicGraph = dynamicSVG.append("g")
	.attr("class", "graph")
	.call(dynamicZoomer);	

// Add a transparent background rectangle to catch
// mouse events for the zoom behaviour.
// Note that the rectangle must be inside the element (graph)
// which has the zoom behaviour attached, but must be *outside*
// the group that is going to be transformed.
var rect = communityGraph.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
	.style("cursor", "move")
	.on("dblclick.zoom", zoomToFit);
var dynrect = dynamicGraph.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
	.style("cursor", "move")
	.on("dblclick.zoom", dynzoomToFit);	
	
var communityVis = communityGraph.append("svg:g")
	.attr("class", "plotting-area");
communityVis.call(communityTooltip);					

var dynamicVis = dynamicGraph.append("svg:g")
	.attr("class", "plotting-area");				
					
/***	GLOBALS		***/			
var overlay;
var mapsvg;
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
var lastKnownQuery = "";
var doLastKnownQuery = false;

var communityNode, communityLabel, communityLink;
var dynamicNode, dynamicLabel, dynamicLink;
var geolabels, geocircles;

var graphStructure = {};
var MAX_GRAPH_SIZE = 1000; // default, but is configurable in the UI



/*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*/


$(function () {
	
	d3.select('#slidertext').text(moment(startTime).utc().format("YYYY-MM-DDTHH:mm:ss"));
  
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
		//XDATA.LOGGER.logSystemActivity("System has captured current map bounding area.");
	});

	
	//create the overlay on which we will draw our heatmap
	overlay = new google.maps.OverlayView();
	overlay.onAdd = function () {
	
		var layer = d3.select(this.getPanes().overlayMouseTarget).append("div").attr("class", "mapOverlay");
		mapsvg = layer.append("svg");
		g = mapsvg.append("g");

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

			geocircles = g.selectAll("circle")
				.data(currentGeoJson, trackid)
				.attr('cx', function(d) {
					var coordinates = googleMapProjection([d.coordinates[0][0], 0]);
					return coordinates[0];
				})
				.attr('cy', function(d) {
					var coordinates = googleMapProjection([0, d.coordinates[0][1]]);
					return coordinates[1];
				})
				.attr('dx', function(d) {
					var coordinates = googleMapProjection([d.coordinates[0][0], 0]);
					return coordinates[0];
				})
				.attr('dy', function(d) {
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
				
			geolabels = g.selectAll("text")
				.data(currentGeoJson, trackid)
				.attr('dx', function(d) {
					var coordinates = googleMapProjection([d.coordinates[0][0], 0]);
					return coordinates[0];
				})
				.attr('dy', function(d) {
					var coordinates = googleMapProjection([0, d.coordinates[0][1]]);
					return coordinates[1];
				});		
			
			geolabels.enter().append('svg:text')
				.attr("class", "label")
				.attr('dx', function(d) {
					var coordinates = googleMapProjection([d.coordinates[0][0], 0]);
					return coordinates[0];
				})
				.attr('dy', function(d) {
					var coordinates = googleMapProjection([0, d.coordinates[0][1]]);
					return coordinates[1];
				})				
				.attr("fill", "black")
				.style("opacity", function(d, i) {
					var lab = $("#labelsEnabled");
					if (lab.prop('checked') === true) {
						return 1.0;
					}
					return 0;						
				})
				.text( function(d) { 
					return d.track_id; 
				});

			geolabels.exit().remove();

		};
	};
	overlay.setMap(map);
	XDATA.LOGGER.logSystemActivity("System has created map component.");

	$("#play").click(function () {
		animate = !animate;
    
		var buttonLabel = "Play";
		if (animate) {
			XDATA.LOGGER.logUserActivity("User has toggled track playback to ON.", "select_option",  XDATA.LOGGER.WF_EXPLORE);
			buttonLabel = "Pause";
			timeout = setInterval(AnimateTracks, animateInterval);
		} else {
			XDATA.LOGGER.logUserActivity("User has toggled track playback to OFF.", "select_option",  XDATA.LOGGER.WF_EXPLORE);
			clearInterval(timeout);
		}
		$("#play").text(buttonLabel);
    
		if (timeSlider.slider("option", "value") >= 100) {
			timeSlider.slider({ value: 0});
		}
	});
  
	var refreshFunction = function (doReset) {
	
		Reset(doReset);
		$("#communityBrowserForm").hide();
		$("#communityBrowserTooLarge").hide();
		$("#communityBrowserGraph").hide();	

    
		$.ajax({
			url: 'community/getcomm/',      
			type: 'GET',
			success: function(data) {
				var comm = data.split("/")[0];
				var lev = data.split("/")[1];
				
				var capturedQuery = capturedGeo || "";

				try {
					var dateValues = $("#range-slider").slider("values");
					var mintime = moment(dateValues[0]).format("YYYY-MM-DD 00:00:00");
					var maxtime = moment(dateValues[1]).format("YYYY-MM-DD 23:59:59");
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
				else if (doLastKnownQuery === true && lastKnownQuery !== "") {
					serviceCall = '?'+lastKnownQuery;
					doLastKnownQuery = false;
				}
				else if (capturedGeo) {
					serviceCall = '?'+capturedQuery;
					lastKnownQuery = capturedQuery.concat(""); // make a new copy of the value stored
				}
				else if (comm && lev && comm !== "0") {
					serviceCall = '?comm="'+comm+'"&lev="'+lev+'"';
				}
				else {
					serviceCall = '?lev="'+lev;
				}
				console.log(serviceCall);

				$.getJSON('myservice'+serviceCall, function (data) {
	
					console.log("Retrieved Data Object");
					console.dir(data);
					
					if (data["gephinodes"] && data["gephinodes"].length <= MAX_GRAPH_SIZE) {
						$("#communityBrowserForm").hide();
						$("#communityBrowserTooLarge").hide();
						$("#communityBrowserGraph").show();					
					
						// Handle heat map overlay...
						if ($('#heatMapEnabled').is(':checked')) {
							renderHeatMap();
						}		
						
						if ( $("#level").val() === "1" ) {
							graphStructure = {};
						}

						// Community Browser	
						tau2 = 2 * Math.PI;
						angle2 = tau2 / data["gephinodes"].length;
						$.each(data["gephinodes"], function (i, v) {
							var d = data["gephinodes"][i];
							d.x = (width / 4) * Math.cos(i * angle2) + (width / 2);
							d.y = (height / 4) * Math.sin(i * angle2) + (height / 2);
							
							if ( $("#level").val() === "1" ) {
								graphStructure[d.nodename] = {
									x: d.x,
									y: d.y
								};
							}
							
						});

						communityLink = communitySVG.selectAll("line.link").data(data["gephigraph"]);
						
						communityForce.nodes(data["gephinodes"])
							.links(data["gephigraph"])
							.start();
							
						linkgroup = communityVis.append("g")
							.attr("class", "linkgroup")
							.selectAll("link")
							.data(data["gephigraph"])
							.enter();
		
						communityLink = linkgroup.insert("svg:line", ".node")
							.attr("class", "link")
							.attr("stroke", "black")
							.style("stroke-width", function(d) {
								return parseInt(d.weight) * 0.1;
							});		

						nodegroup = communityVis.append("g")
							.attr("class", "nodegroup")
							.selectAll("circle")
							.data(data["gephinodes"])
							.enter();

						communityNode = nodegroup.append("circle")
							.attr("class", "node")
							.style("cursor", "pointer")
							.on("mousedown", function(d) {
								var html = "";
								html = "ID="+d.nodename+"; COMM="+d.node_comm+"; LVL="+d.level+"; MEMBERS="+d.num_members;
								$("#selectedCommunityText").html(html);	
								html = '&nbsp;&nbsp;(<a id="openSelectedCommunity" class="xbtn xbtn-mini" href="#">Open<i class="icon-play"></i></a>)';
								$("#selectedCommunityButtonSpan").html(html);
								
								$("#openSelectedCommunity").click(function(e) {
									e.preventDefault();
									var text = $("#selectedCommunityText").html();
									var parts = text.split(';');
									var comm = parts[1].split('=')[1];
									var level = parts[2].split('=')[1];
									//if (level === 0) level = 1;
									//var service = '?comm="'+comm+'"&lev="'+level+'"';
									var table = $("#track-table").val();
									
									$("#level").select2("val", level);
									$("#comm-id").val(comm.toString());
									$('#comm-id').clearableTextField();	
									capturedGeo = "";				

									$.get("community/settable/" + table)
										.then(function(){
											$.get("community/setcomm/" + comm + '/' + level)
												.then( function() {
													refreshFunction();
												});
										});
			
								});			
													
							})
							.on("dblclick", openCommunity)
							.attr("r", function (d) {
								return parseInt(d.num_members) + 4;
							})
							.attr("fill", function(d) {
								var c = color(d.nodename);
								colorMapping[d.nodename] = c;
								return c;
							})
							.on('mouseover', communityTooltip.show)
							.on('mouseout', communityTooltip.hide)						
							.call(drag);
							
						/*
						communityNode.call(drag)
							.append("title")
							.text(function (d) {
								return d.nodename + " / " + d.node_comm;
							});
						*/							
						  
						communityLabel = nodegroup.append("text")
							.style("pointer-events", "none")
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
			  
							d3.select('#slidertext').text(moment(startTime).utc().format("YYYY-MM-DDTHH:mm:ss"));
							
							// Dynamic Graph
							tau = 2 * Math.PI;
							angle = tau / data["result"].length;
							$.each(data["result"], function (i, v) {
								data["result"][i].x = (width / 4) * Math.cos(i * angle) + (width / 2);
								data["result"][i].y = (height / 4) * Math.sin(i * angle) + (height / 2);
								
								if ( $("#level").val() === "1" ) {
									data["result"][i].x = graphStructure[data["result"][i].track_id].x;
									data["result"][i].y = graphStructure[data["result"][i].track_id].y;
								}							
								
							});

							dynamicLink = dynamicSVG.selectAll("line.link").data(data["graph"]);
							
							dynamicForce.nodes(data["result"])
								.links(data["graph"])
								.start();
								
							linkgroup = dynamicVis.append("g")
								.attr("class", "linkgroup")
								.selectAll("link")
								.data(data["graph"])
								.enter();
			
							dynamicLink = linkgroup.insert("svg:line", ".node")
								.attr("class", "link")
								.style("opacity", 0.0)
								.style("stroke", "#FFFFFF")
								.style("stroke-width", 1.0);

							nodegroup = dynamicVis.append("g")
								.attr("class", "nodegroup")
								.selectAll("circle")
								.data(data["result"])
								.enter();

							dynamicNode = nodegroup.append("circle")
								.style("cursor", "pointer")
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
								})
								.call(dyndrag);
								
							dynamicNode.call(dyndrag)
								.append("title")
								.text(function (d) {
									return d.track_id;
								});						
							  
							dynamicLabel = nodegroup.append("text")
								.style("pointer-events", "none")
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
									return d.track_id;
								});		
								
							setDynamicSize();						
							dynrect.style("fill", "black");

							}
						}
						else {
							$("#communityBrowserForm").hide();
							$("#communityBrowserTooLarge").show();
							$("#communityBrowserGraph").hide();		

							// Handle heat map overlay...
							if ($('#heatMapEnabled').is(':checked')) {
								renderHeatMap();
							}
							
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
				
				$("#level").select2("val", level);
				$("#comm-id").val(node);
				$('#comm-id').clearableTextField();	
				capturedGeo = "";				

				$.get("community/settable/" + table)
					.then(function(){
						$.get("community/setcomm/" + node + '/' + level)
							.then( function() {
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
		capturedGeo = "";
		updateCommunities();
	});
	
	$("#captureCommunity").click(function(e) {
		e.stopPropagation();
		e.preventDefault();	
		filterCommunities();
	});
	
	$("#capturePreviousCommunity").click(function(e) {
		e.stopPropagation();
		e.preventDefault();
		doLastKnownQuery = true;
		filterCommunities();
	});	
  
	$("#reset").click(function () {
		Reset(true);
		$("#communityBrowserForm").show();
		$("#communityBrowserTooLarge").hide();
		$("#communityBrowserGraph").hide();		
	});

	$("#heatmap-remove").click(function () {
		heatmap.setMap(null);    
	});

	$("#heatmap").click(renderHeatMap);
	
	$("#resetCommunityZoom").click(function(e) {
		e.preventDefault();
		zoomToFit();
	});

});



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
	
	communityVis.selectAll("circle.node").remove();
	communityVis.selectAll("line.link").remove();
	communityVis.selectAll("text.label").remove();	
    
	if (resetMap === true) { 
		map.setCenter(new google.maps.LatLng(0, 0));
		map.setZoom(2);
	}
	
	timeSlider.slider({value: 0 });
	
	$("#selectedCommunityText").html('n/a');	
	$("#selectedCommunityButtonSpan").html('');	

	colorMapping = {};
	currentGeoJson = [];
	overlay.draw();
}


$(document).ready( function() {
	$("#track-table").select2({
		width: '200',
		placeholder: "Select a data set...",
		minimumResultsForSearch: -1,
		ajax: {
			url: "community/tables",
			dataType: 'json',
			results: function (data, page) { 
				var results = [];
				for (var i=0, len=data.tables.length; i<len; i++) {
					var t = data.tables[i];
					results.push({
						id: t,
						text: t
					});
				}
				return {"results": results};
			}
		},
		initSelection : function (element, callback) {
			var data = {id: element.val(), text: element.val()};
			callback(data);
		}				
	});
	$("#level").select2({
		width: "resolve",
		placeholder: "...",
		minimumResultsForSearch: -1,
		allowClear: false,
		data: []
	});	
	$("#heatMapEnabled").on( "change", function() {
		var hm = $("#heatMapEnabled");
		if (hm.prop('checked') === true) {
			if ( $("#track-table").val() !== "") {
				renderHeatMap();
			}
		}
		else {
			heatmap.setMap(null);
		}
	});
	$("#labelsEnabled").on( "change", function() {
		var lab = communityVis.selectAll("text.label")
			.style("opacity", function(d, i) {
				var lab = $("#labelsEnabled");
				if (lab.prop('checked') === true) {
					return 1.0;
				}
				return 0;						
			});
			
		var map = g.selectAll("text.label")
			.style("opacity", function(d,i) {
				var lab = $("#labelsEnabled");
				if (lab.prop('checked') === true) {
					return 1.0;
				}
				return 0;						
			});				
		
		var dyn = dynamicVis.selectAll("text.label")
			.style("opacity", function(d,i) {
				var lab = $("#labelsEnabled");
				if (lab.prop('checked') === true) {
					return 1.0;
				}
				return 0;						
			});
	});			
	
	$('#comm-id').clearableTextField();
	
	timeSlider = $("#time-slider").slider({
	  slide: function(evt, ui){
		SetCircles(ui.value);
		SetRelationships(ui.value);
	  }
	});			
	
});
