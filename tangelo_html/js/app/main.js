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
	.on("zoom", communityZoom)
	.on("zoomstart", function() { 
		XDATA.LOGGER.logUserActivity("User has requested to pan/zoom on community browser.", "scale",  XDATA.LOGGER.WF_EXPLORE);
	});	
function communityZoom() {
	 communityVis.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}
var dynamicZoomer = d3.behavior.zoom()
	.scaleExtent([0.01,100])
	.on("zoom", dynamicZoom)
	.on("zoomstart", function() { 
		XDATA.LOGGER.logUserActivity("User has requested to pan/zoom on dynamic graph.", "scale",  XDATA.LOGGER.WF_EXPLORE);
	});
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
var dynamicTooltip = d3.tip()
	.attr('class', 'd3-tip')
	.html(function(d) { 
		var html = '<small>'
			+ '<strong>Track Name:</strong> '+d.track_id+'<br/>'
			+ '<strong>Community:</strong> '+d.comm+'<br/>'
			+ '</small>';
		return html;
	});
var mapTooltip = d3.tip()
	.attr('class', 'd3-tip')
	.html(function(d) { 
		var html = '<small>'
			+ '<strong>Track Name:</strong> '+d.track_id+'<br/>'
			+ '<strong>Community:</strong> '+d.comm+'<br/>'
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
dynamicVis.call(dynamicTooltip);
	
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
	
	// Note: This is to avoid the geo-circles jumping around the map and back to the initial/start position.
	google.maps.event.addListener(map, 'bounds_changed', function() {
		var currentValue = timeSlider.slider("option", "value")
		SetCircles(currentValue);
		SetRelationships(currentValue);	
	});		

	map.addListener('dragstart', function(e) {
		XDATA.LOGGER.logUserActivity("User has requested to pan on map.", "pan",  XDATA.LOGGER.WF_EXPLORE);
	}, true);
	$map[0].addEventListener('mousewheel', function(e) {
		XDATA.LOGGER.logUserActivity("User has requested to zoom on map.", "zoom",  XDATA.LOGGER.WF_EXPLORE);
		var currentValue = timeSlider.slider("option", "value")
		SetCircles(currentValue);
		SetRelationships(currentValue);		
	}, true);
	$map[0].addEventListener('DOMMouseScroll', function(e) {
		XDATA.LOGGER.logUserActivity("User has requested to zoom on map.", "zoom",  XDATA.LOGGER.WF_EXPLORE);
		var currentValue = timeSlider.slider("option", "value")
		SetCircles(currentValue);
		SetRelationships(currentValue);			
	}, true);		

	//create the overlay on which we will draw our heatmap
	overlay = new google.maps.OverlayView();
	overlay.onAdd = function () {
	
		var layer = d3.select(this.getPanes().overlayMouseTarget).append("div").attr("class", "mapOverlay");
		mapsvg = layer.append("svg");
		g = mapsvg.append("g");
		
		mapsvg.call(mapTooltip);	

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
				.on('mouseover', function(e) {
					XDATA.LOGGER.logUserActivity("User has requested to read track metadata on map.", "hover_start",  XDATA.LOGGER.WF_EXPLORE, {"id": e.track_id});
					mapTooltip.show(e);
				})
				.on('mouseout', function(e) {
					XDATA.LOGGER.logUserActivity("User is no longer reading track metadata on map.", "hover_end",  XDATA.LOGGER.WF_EXPLORE, {"id": e.track_id});
					mapTooltip.hide(e);
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
				.attr('stroke', "black")
				.append("svg:title");
				//.text(function(d) { return d.track_id; });
				
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
			XDATA.LOGGER.logUserActivity("User has toggled track playback to ON.", "start_animation",  XDATA.LOGGER.WF_CREATE);
			buttonLabel = "Pause";
			timeout = setInterval(AnimateTracks, animateInterval);
		} else {
			XDATA.LOGGER.logUserActivity("User has toggled track playback to OFF.", "stop_animation",  XDATA.LOGGER.WF_CREATE);
			clearInterval(timeout);
		}
		$("#play").text(buttonLabel);
    
		if (timeSlider.slider("option", "value") >= 100) {
			XDATA.LOGGER.logSystemActivity("System has stopped timeline playback.");
			timeSlider.slider({ value: 0});
		}
	});
  
	var refreshFunction = function (doReset) {
	
		XDATA.LOGGER.logSystemActivity("System is refreshing application based on set options.");
	
		Reset(doReset);
		$("#communityBrowserForm").hide();
		$("#communityBrowserTooLarge").hide();
		$("#communityBrowserGraph").hide();	
		
		$.blockUI();

		$.ajax({
			url: 'community/getcomm/',      
			type: 'GET',
			success: function(data) {
				XDATA.LOGGER.logSystemActivity("System has retrieved current community information.");
				var comm = data.split("/")[0];
				var lev = data.split("/")[1];
				
				var capturedQuery = capturedGeo || "";

				try {
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
					var parts = lastKnownQuery.split('&');
					
					// zoom map to last saved
					var bounds = {};
					bounds.north = parseFloat(parts[1].split('=')[1].replace(/"/g, ""));
					bounds.south = parseFloat(parts[0].split('=')[1].replace(/"/g, ""));
					bounds.east = parseFloat(parts[3].split('=')[1].replace(/"/g, "")); 
					bounds.west = parseFloat(parts[2].split('=')[1].replace(/"/g, ""));
					var low = parts[4].split('=')[1].replace(/"/g, "");
					var high = parts[5].split('=')[1].replace(/"/g, "");
					
					var xdiff = bounds.east - bounds.west;
					var ydiff = bounds.north - bounds.south;
					var centerx = xdiff / 2 + bounds.west;
					var centery = ydiff / 2 + bounds.south;
					map.setCenter(new google.maps.LatLng(centery, centerx));
							  
					var sw = new google.maps.LatLng(bounds.south, bounds.west);
					var ne = new google.maps.LatLng(bounds.north, bounds.east);
					map.fitBounds(new google.maps.LatLngBounds(sw, ne));
					
					// zoom range slider to last saved
					var l = moment(low).utc().format("YYYY-MM-DDTHH:mm:ss");                                   
					var h = moment(high).utc().format("YYYY-MM-DDTHH:mm:ss");
					$("#txt-low-val").html(l);
					$("#txt-high-val").html(h);					
					$("#range-slider").slider({values: [moment(low).utc(), moment(high).utc()]});
					//timeSlider.slider({value: currentValue })
					
					XDATA.LOGGER.logSystemActivity("System has set geospatial and time bounds information.");

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
				//console.log(serviceCall);
				XDATA.LOGGER.logSystemActivity("System has constructed search service call.");
				XDATA.LOGGER.logSystemActivity("Query to execute: "+serviceCall);

				$.getJSON('myservice'+serviceCall, function (data) {
					XDATA.LOGGER.logSystemActivity("System has retrieved search service call results.");
					//console.log("Retrieved Data Object");
					//console.dir(data);
					
					if (data["gephinodes"] && data["gephinodes"].length <= MAX_GRAPH_SIZE) {
						$("#communityBrowserForm").hide();
						$("#communityBrowserTooLarge").hide();
						$("#communityBrowserGraph").show();					
					
						// Handle heat map overlay...
						if ($('#heatMapEnabled').is(':checked')) {
							//renderHeatMap();
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
							
								XDATA.LOGGER.logUserActivity("User has selected a node in the community graph.", "show_data_info",  XDATA.LOGGER.WF_EXPLORE, {"id":d.nodename});
							
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
									var table = $("#track-table").val();
									
									XDATA.LOGGER.logUserActivity("User has requested to retrieve a node in the community graph.", "execute_query_search",  XDATA.LOGGER.WF_GETDATA, {"id":comm, "level":level});
									
									$("#level").select2("val", level);
									$("#comm-id").val(comm.toString());
									$('#comm-id').clearableTextField();	
									capturedGeo = "";	

									XDATA.LOGGER.logSystemActivity("System has refreshed interaction controls.");

									$.get("community/settable/" + table)
										.then(function(){
											XDATA.LOGGER.logSystemActivity("System has set data table.");
											$.get("community/setcomm/" + comm + '/' + level)
												.error(function() {
													$.unblockUI();
													alert("Requested COMMUNITY_ID/LEVEL does not exist.");		
												})											
												.then( function() {
													XDATA.LOGGER.logSystemActivity("System has set community and level information: "+comm+"/"+level);
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
							.attr("stroke", "black")
							.on('mouseover', function(e) {
								XDATA.LOGGER.logUserActivity("User has requested to read community metadata.", "hover_start",  XDATA.LOGGER.WF_EXPLORE, {"id": e.nodename});
								communityTooltip.show(e);
							})
							.on('mouseout', function(e) {
								XDATA.LOGGER.logUserActivity("User is no longer reading community metadata.", "hover_end",  XDATA.LOGGER.WF_EXPLORE, {"id": e.nodename});
								communityTooltip.hide(e);
							})
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
							
						setSize(false);
						
						XDATA.LOGGER.logSystemActivity("System has generated community browser.");

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

							XDATA.LOGGER.logSystemActivity("System has generated map.");

							startTime = new Date(Date.parse(data["start"]));
							endTime = new Date(Date.parse(data["end"]));
			  
							d3.select('#slidertext').text(moment(startTime).utc().format("YYYY-MM-DDTHH:mm:ss"));
							
							XDATA.LOGGER.logSystemActivity("System has refreshed track playback controls.");
							
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
								.style("stroke", "black")
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
								.on('mouseover', function(e) {
									XDATA.LOGGER.logUserActivity("User has requested to read track metadata on dynamic graph.", "hover_start",  XDATA.LOGGER.WF_EXPLORE, {"id": e.track_id});
									dynamicTooltip.show(e);
								})
								.on('mouseout', function(e) {
									XDATA.LOGGER.logUserActivity("User is no longer reading track metadata on dynamic graph.", "hover_end",  XDATA.LOGGER.WF_EXPLORE, {"id": e.track_id});
									dynamicTooltip.hide(e);
								})								
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
								.attr("stroke", "black")
								.call(dyndrag);
								
							//dynamicNode.call(dyndrag)
							//	.append("title")
							//	.text(function (d) {
							//		return d.track_id;
							//	});						
							  
							dynamicLabel = nodegroup.append("text")
								.style("pointer-events", "none")
								.attr("class", "label")
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
								
							setDynamicSize(false);						
							//dynrect.style("fill", "black");
							
							XDATA.LOGGER.logSystemActivity("System has generated dynamic graph.");
						}
					}
					else {
						$("#communityBrowserForm").hide();
						$("#communityBrowserTooLarge").show();
						$("#communityBrowserGraph").hide();		

						// Handle heat map overlay...
						if ($('#heatMapEnabled').is(':checked')) {
							//renderHeatMap();
						}
						
					}
						
				});
				$.unblockUI();
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
			
				$.blockUI();
				
				level = level -1;
				
				XDATA.LOGGER.logUserActivity("User has requested to load a new community.", "execute_query_search",  XDATA.LOGGER.WF_GETDATA, {"id":node, "level":level});
				
				$("#level").select2("val", level);
				$("#comm-id").val(node);
				$('#comm-id').clearableTextField();	
				capturedGeo = "";
				XDATA.LOGGER.logSystemActivity("System has refreshed interaction controls.");

				$.get("community/settable/" + table)
					.then(function(){
						XDATA.LOGGER.logSystemActivity("System has set data table.");
						$.get("community/setcomm/" + node + '/' + level)
							.error(function() {
								$.unblockUI();
								alert("Requested COMMUNITY_ID/LEVEL does not exist.");		
							})						
							.then( function() {
								XDATA.LOGGER.logSystemActivity("System has set community and level information: "+node+"/"+level);
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

	$("#applyCommunity").click(function(e) {
		e.stopPropagation();
		e.preventDefault();
		var comm = $("#comm-id").val() || "";
		var level = $("#level").val() || "";
		XDATA.LOGGER.logUserActivity("User has requested to load a specified community.", "execute_query_search",  XDATA.LOGGER.WF_GETDATA, {"id":comm, "level":level});
		
		capturedGeo = "";
		updateCommunities();
	});
	
	$("#captureCommunity").click(function(e) {
		e.stopPropagation();
		e.preventDefault();	
		
		var lat0 = map.getBounds().getNorthEast().lat();
		var lng0 = map.getBounds().getNorthEast().lng();
		var lat1 = map.getBounds().getSouthWest().lat();
		var lng1 = map.getBounds().getSouthWest().lng();		
		//bbox = left,bottom,right,top
		//bbox = min Longitude , min Latitude , max Longitude , max Latitude 		
		// minlat=”40”&maxlat=”70”&minlon=”20”&maxlon=”70”
		capturedGeo = 'minlat="'+lat1+'"&maxlat="'+lat0+'"&minlon="'+lng1+'"&maxlon="'+lng0+'"';
		//XDATA.LOGGER.logSystemActivity("System has captured current map bounding area.");
		
		var dateValues = $("#range-slider").slider("values");
		var mintime = moment(dateValues[0]).format("YYYY-MM-DD 00:00:00");
		var maxtime = moment(dateValues[1]).format("YYYY-MM-DD 23:59:59");
		capturedTime = 'mintime="'+mintime+'"&maxtime="'+maxtime+'"';		
		
		XDATA.LOGGER.logUserActivity("User has requested to load searched area/time of interest.", "execute_visual_filter",  XDATA.LOGGER.WF_GETDATA);

		filterCommunities();
	});
	
	$("#capturePreviousCommunity").click(function(e) {
		
		e.stopPropagation();
		e.preventDefault();
		
		XDATA.LOGGER.logUserActivity("User has requested to reload previously searched location/time of interest.", "execute_visual_filter",  XDATA.LOGGER.WF_GETDATA);

		doLastKnownQuery = true;
		filterCommunities();
	});	

});



function Reset(resetMap) {
	//console.log("Current Bounds: "+map.getBounds());

	//heatmap.setMap(null);
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
	
	XDATA.LOGGER.logSystemActivity("System has reset all visualizations.");
}


$(document).ready( function() {

	$.blockUI.defaults.message = null;
	$.blockUI.defaults.onBlock = function() {
		$('body').spin();
		XDATA.LOGGER.logSystemActivity("System has blocked UI interactions.");
	};
	$.blockUI.defaults.onUnblock = function() {
		$('body').spin(false);
		XDATA.LOGGER.logSystemActivity("System has unblocked UI interactions.");
	};
	
	//$(document).ajaxStart($.blockUI).ajaxStop($.unblockUI);

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
	$("#track-table").on("change", function(e) {
		XDATA.LOGGER.logUserActivity("User has adjusted selected data set.", "select_filter_menu_option",  XDATA.LOGGER.WF_GETDATA, {"table":this.value} );
	});
	
	$("#max-graph-size").on("change", function(e) {
		XDATA.LOGGER.logUserActivity("User has adjusted maximum graph size.", "enter_filter_text",  XDATA.LOGGER.WF_GETDATA, {"size":this.value} );	
	});
	
	$("#level").select2({
		width: "resolve",
		placeholder: "...",
		minimumResultsForSearch: -1,
		allowClear: false,
		data: []
	});
	$("#comm-id").on("change", function(e) {
		var id = e.currentTarget.value || "[blank]";
		XDATA.LOGGER.logUserActivity("User has adjusted community identifier.", "enter_filter_text",  XDATA.LOGGER.WF_GETDATA, {"id":id} );
	});
	$("#heatMapEnabled").on( "change", function() {
		var hm = $("#heatMapEnabled");
		if (hm.prop('checked') === true) {
			XDATA.LOGGER.logUserActivity("User has requested heat map display to be ON.", "add_map_layer",  XDATA.LOGGER.WF_CREATE);
			if ( $("#track-table").val() !== "") {
				renderHeatMap();
			}
		}
		else {
			XDATA.LOGGER.logUserActivity("User has requested heat map display to be OFF.", "remove_map_layer",  XDATA.LOGGER.WF_CREATE);
			heatmap.setMap(null);
		}
	});
	$("#labelsEnabled").on( "change", function() {
		var labl = $("#labelsEnabled");
		if (labl.prop('checked') === true) {
			XDATA.LOGGER.logUserActivity("User has requested labels display to be ON.", "set_graph_properties",  XDATA.LOGGER.WF_CREATE);
		}
		else {
			XDATA.LOGGER.logUserActivity("User has requested labels display to be OFF.", "set_graph_properties",  XDATA.LOGGER.WF_CREATE);
		}

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
	
	$('#tangelo-config-cancel').on("click", function(e) {
		XDATA.LOGGER.logUserActivity("User cancelled updating data table and maximum graph size.", "close_modal_tools",  XDATA.LOGGER.WF_CREATE);
	});
	$('div#tangelo-config-panel > div.modal-header > button.close').on("click", function(e) {
		XDATA.LOGGER.logUserActivity("User cancelled updating data table and maximum graph size.", "close_modal_tools",  XDATA.LOGGER.WF_CREATE);
	});
	$('#tangelo-config-defaults').hide(); // hide this since the button doesn't do anything in our application
	
	$('div.navbar a.pointer').on("click", function(e) {
		var v = e.target.attributes["data-target"].value;
		if (v === "#tangelo-config-panel") {
			XDATA.LOGGER.logUserActivity("User opened Track Communities configuration panel.", "open_modal_tools",  XDATA.LOGGER.WF_CREATE);
		}
		else if (v === "#tangelo-info-panel") {
			XDATA.LOGGER.logUserActivity("User opened Track Communities information panel.", "show_instructional_material",  XDATA.LOGGER.WF_CREATE);
		}
		else {
			console.log("somehting opened");
		}
	});

	$('#tangelo-info-panel > div.modal-footer > a.btn').on("click", function(e) {
		XDATA.LOGGER.logUserActivity("User closed Track Communities information panel.", "hide_instructional_material",  XDATA.LOGGER.WF_CREATE);
	});
	$('div#tangelo-info-panel > div.modal-header > button.close').on("click", function(e) {
		XDATA.LOGGER.logUserActivity("User closed Track Communities information panel.", "hide_instructional_material",  XDATA.LOGGER.WF_CREATE);
	});	
	
	$('div#tangelo-control-panel > div#tangelo-drawer-handle').on("click", function(e) {
		try {
			var icon = e.currentTarget.firstChild.className;
			if (icon === "icon-chevron-up") {
				XDATA.LOGGER.logUserActivity("User closed the toolbar control panel.", "close_tools",  XDATA.LOGGER.WF_CREATE);
			}
			else if (icon === "icon-chevron-down") {
				XDATA.LOGGER.logUserActivity("User opened the toolbar control panel.", "open_tools",  XDATA.LOGGER.WF_CREATE);
			}
			else {
				// n/a?
			}
		}
		catch (e) {
			// n/a?
		}
	});
	
	timeSlider = $("#time-slider").slider({
	  slide: function(evt, ui){
		SetCircles(ui.value);
		SetRelationships(ui.value);
	  },
	  change: function(evt, ui){
		if (evt && evt.handleObj && evt.handleObj.type && evt.handleObj.type === "mouseup") {
			var time = d3.select('#slidertext').text();
			XDATA.LOGGER.logUserActivity("User has selected new playback display time.", "set_animation_properties",  XDATA.LOGGER.WF_CREATE, {"time": time});
		}
	  }
	});

	XDATA.LOGGER.logSystemActivity("System has set default interaction controls.");
	
	getConfig();
	
	// Community Info popover //
	popover_cfg.title = "Community Info";
	popover_cfg.placement = "top";
	popover_cfg.content = "<p> View information about your entire community data set. </p>" +
		"<p>Single click a node in the <span class='small-caps'>COMMUNITY BROWSER</span> to see its details in <span class='small-caps'>LAST SELECT</span>. </p>" +
		"<p> Enter <span class='small-caps'>COMMUNITY ID</span> and <span class='small-caps'>LEVEL</span> to go directly to a known community. </p>";
	$("#community-info-help").popover(popover_cfg);	
	$("#community-info-help").on("show.bs.popover", function(e) {
		XDATA.LOGGER.logUserActivity("User is viewing Community Info help.", "show_instructional_material",  XDATA.LOGGER.WF_CREATE);
	});
	$("#community-info-help").on("hide.bs.popover", function(e) {
		XDATA.LOGGER.logUserActivity("User is finished viewing Community Info help.", "hide_instructional_material",  XDATA.LOGGER.WF_CREATE);
	});
	
	// Find Communities Time/Geo popover //
	popover_cfg.title = "Find Communities";
	popover_cfg.placement = "top";
	popover_cfg.content = "<p> Utilize the <span class='small-caps'>MAP</span> and <span class='small-caps'>RANGE SLIDER</span> to search for communities that fit within your criteria. </p>" +
		"<p> The <span class='small-caps'>PREVIOUS</span> button allows you to return to your last utilized spatial-temporal search.</p>";
	$("#find-communities-help").popover(popover_cfg);	
	$("#find-communities-help").on("show.bs.popover", function(e) {
		XDATA.LOGGER.logUserActivity("User is viewing Find Communities help.", "show_instructional_material",  XDATA.LOGGER.WF_CREATE);
	});
	$("#find-communities-help").on("hide.bs.popover", function(e) {
		XDATA.LOGGER.logUserActivity("User is finished viewing Find Communities help.", "hide_instructional_material",  XDATA.LOGGER.WF_CREATE);
	});
	
	// Timeline/Playback popover //
	popover_cfg.title = "Playback Timeline";
	popover_cfg.placement = "top";
	popover_cfg.content = "<p> Use the the <span class='small-caps'>PLAYBACK SLIDER</span> to select a given point in time. </p>" +
		"<p> Click play or slide it manually to observe which tracks are co-located at specific spatial and temporal points. </p>";
	$("#timeline-playback-help").popover(popover_cfg);		
	$("#timeline-playback-help").on("show.bs.popover", function(e) {
		XDATA.LOGGER.logUserActivity("User is viewing Timeline Playback help.", "show_instructional_material",  XDATA.LOGGER.WF_CREATE);
	});
	$("#timeline-playback-help").on("hide.bs.popover", function(e) {
		XDATA.LOGGER.logUserActivity("User is finished viewing Timeline Playback help.", "hide_instructional_material",  XDATA.LOGGER.WF_CREATE);
	});	
	
	// Dynamic Graph popover //
	popover_cfg.title = "Dynamic Graph";
	popover_cfg.placement = "bottom";
	popover_cfg.content = "<p> Visualize which tracks are spatially and temporally co-located by observing edges rendered between track nodes.</p>" +
		"<p> Utilize the <span class='small-caps'>PLAYBACK SLIDER</span> to adjust the time frame of co-location to observe. </p>";
	$("#dynamic-graph-help").popover(popover_cfg);
	$("#dynamic-graph-help").on("show.bs.popover", function(e) {
		XDATA.LOGGER.logUserActivity("User is viewing Dynamic Graph help.", "show_instructional_material",  XDATA.LOGGER.WF_CREATE);
	});
	$("#dynamic-graph-help").on("hide.bs.popover", function(e) {
		XDATA.LOGGER.logUserActivity("User is finished viewing Dynamic Graph help.", "hide_instructional_material",  XDATA.LOGGER.WF_CREATE);
	});
	
	// Community Browser popover //
	popover_cfg.title = "Community Browser";
	popover_cfg.placement = "bottom";
	popover_cfg.content = "<p> Visualize communities that are aggregated based on spatial and temporal co-location.</p>" +
		"<p> Double click a community node to drill further down into a community. </p>" +
		"<p> Hover over a community node to view meta information about that community.</p>";
	$("#community-browser-help").popover(popover_cfg);	
	$("#community-browser-help").on("show.bs.popover", function(e) {
		XDATA.LOGGER.logUserActivity("User is viewing Community Browser help.", "show_instructional_material",  XDATA.LOGGER.WF_CREATE);
	});
	$("#community-browser-help").on("hide.bs.popover", function(e) {
		XDATA.LOGGER.logUserActivity("User is finished viewing Community Browser help.", "hide_instructional_material",  XDATA.LOGGER.WF_CREATE);
	});
	
	// Map popover //
	popover_cfg.title = "Map";
	popover_cfg.placement = "bottom";
	popover_cfg.content = "<p> Visualize tracks spatially moving over time. </p>" +
		"<p> When the heat map is enabled, you can see high volume of track activity in shaded areas. </p>" +
		"<p> Additionally, you can use the map to help construct a spatial-temporal query for finding communities.</p>";
	$("#map-help").popover(popover_cfg);	
	$("#map-help").on("show.bs.popover", function(e) {
		XDATA.LOGGER.logUserActivity("User is viewing Map help.", "show_instructional_material",  XDATA.LOGGER.WF_CREATE);
	});
	$("#map-help").on("hide.bs.popover", function(e) {
		XDATA.LOGGER.logUserActivity("User is finished viewing Map help.", "hide_instructional_material",  XDATA.LOGGER.WF_CREATE);
	});
	
    XDATA.LOGGER.logSystemActivity("Application startup completed.");	
	
});
