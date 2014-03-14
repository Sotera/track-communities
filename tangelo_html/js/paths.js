
//dynamic graph init
var color = null;
var force = null;
var dg_graph = null;
var dg_svg = null;
var transition_time = 1000;

var width = 960,
height = 480;

var overlay;
var svg;
var g;
var googleMapProjection;
var currentGeoJson = [];
var map;
var heatmap = new google.maps.visualization.HeatmapLayer({ data: []});      
var startTime = new Date();
var endTime = new Date();

var mySlider;
var animate = false;
var playSpeed = .1;
var animateInterval = 10;

d3.select('#slidertext').text(startTime);

var defaultColors = ["red", "blue", "green", "magenta", "sienna", "teal", "goldenrod", "cyan", "indigo", "springgreen"];

dg_svg = d3.select("#graph");

force = d3.layout.force()
  .charge(-500)
  .linkDistance(100)
  .gravity(0.2)
  .friction(0.6)
  .size([width, height]);

color = d3.scale.category20();


function showConfig() {
  $.get("community/current").done(function(cfg){
    d3.select("#track-table").property("value", cfg.table);
    d3.select("#comm-id").property("value", cfg.community);
  });
}

function updateConfig() {
  var table, comm;
  table = $("#track-table").val()
  comm = $("#comm-id").val()

  $.get("community/settable/" + table)
    .then(function(){
      $.get("community/setcomm/" + comm);
  });
  
  // $.ajax({
  //   url : "community/", 
  //   contentType: "application/json",
  //   data: JSON.stringify({ "table" : table, "community" : comm }),
  //   dataType: "json",
  //   type: "POST"
  // });

}

var timeout = null;
$(function () {

  //create google map
  var $map=$("#map");
  map = new google.maps.Map($map[0], {
    zoom: 2,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: new google.maps.LatLng(0, 0)
    //        mapTypeControl: false
  });

  //create the overlay on which we will draw our heatmap
  overlay = new google.maps.OverlayView();

  overlay.onAdd = function () {

    var layer = d3.select(this.getPanes().overlayMouseTarget).append("div").attr("class", "SvgOverlay");
    svg = layer.append("svg");
    g = svg.append("g");//.attr("id", "polys");

    overlay.draw = function () {
      var markerOverlay = this;
      var overlayProjection = markerOverlay.getProjection();

      // Turn the overlay projection into a d3 projection
      googleMapProjection = function (coordinates) {
        var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
        var pixelCoordinates = overlayProjection.fromLatLngToDivPixel(googleCoordinates);
        return [pixelCoordinates.x+4000, pixelCoordinates.y+4000];
      }

      path = d3.geo.path().projection(googleMapProjection);

      geodata = g.selectAll("path")
	.data(currentGeoJson, trackid)
	.attr("d", path);

      geodata.enter()
	.append("svg:path")
	.attr("opacity", .5)
	.attr("fill", "none")
	.attr("stroke", function (d) { return getColor(d.index); })
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
	.attr("fill", function (d) { return getColor(d.index); })
	.attr('stroke', "gray")
	.append("svg:title")
	.text(function(d) { return d.track_id; });
      
      geocircles.exit().remove();

    };

    /*
      google.maps.event.addListener(map, 'zoom_changed', function() {
      //		console.log("zoom_changed");
      });
    */

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
  
  $("#refresh").click(function () {
    Reset(false);
    
    $.ajax({
      //url: 'http://localhost:8787/getcomm/',
      url: 'community/getcomm/',      
      type: 'GET',
      success: function(data) {
        var serviceCall = '?comm="'+data+'"';

	d3.select('#community-id').text("Community ID: "+data);
	
	$.getJSON('myservice'+serviceCall, function (data) {
	  
	  currentGeoJson = data["result"];
	  
	  var xdiff = data.bounds.east - data.bounds.west;
          var ydiff = data.bounds.north - data.bounds.south;
          
          var centerx = xdiff / 2 + data.bounds.west;
          var centery = ydiff / 2 + data.bounds.south;
          
	  map.setCenter(new google.maps.LatLng(centery, centerx));
	  
	  var sw = new google.maps.LatLng(data.bounds.south, data.bounds.west);
	  var ne = new google.maps.LatLng(data.bounds.north, data.bounds.east);
	  map.fitBounds(new google.maps.LatLngBounds(sw, ne));
	  
          //projection.center([centerx, centery])
          //.scale(Math.round(newScale));

	  overlay.draw();

	  startTime = new Date(Date.parse(data["start"]));
	  endTime = new Date(Date.parse(data["end"]));
	  
	  d3.select('#slidertext').text(startTime);

	  //dynamic graph stuff

	  tau = 2 * Math.PI;
	  angle = tau / data["result"].length;
	  $.each(data["result"], function (i, v) {
	    data["result"][i].x = (width / 4) * Math.cos(i * angle) + (width / 2);
	    data["result"][i].y = (height / 4) * Math.sin(i * angle) + (height / 2);
	  });

	  
	  link = dg_svg.select("g#links")
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
	  
	  //create nodes
	  node = dg_svg.select("g#nodes")
	    .selectAll(".node")
	    .data(data["result"], trackid);

	  enter = node.enter().append("circle")
	    .classed("node", true)
	    .attr("r", 15)
	    .style("opacity", 0.0)
	    .style("fill", "red");
	  enter.transition()
	    .duration(transition_time)
	    .attr("r", 10)
	    .style("opacity", 1.0)
	    .style("stroke", "gray")
	    .style("fill", function (d) {
	      return defaultColors[d.index];
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
	  //force.nodes(graph.nodes)
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

	  //store edge data
	});
      }
    });
    
  });
  
  $("#reset").click(function () {
    Reset(true);
  });

  $("#heatmap-remove").click(function () {
      heatmap.setMap(null);    
  });

  $("#heatmap").click(function () {
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
  });

});

function Reset(full) {
  console.log("Current Bounds: "+map.getBounds());

  d3.select('#community-id').text("Community ID: None");
  dg_svg.select("g#nodes").selectAll(".node").remove();
  dg_svg.select("g#links").selectAll(".link").remove();
  
  map.setCenter(new google.maps.LatLng(0, 0));
  map.setZoom(2);

  currentGeoJson = [];
  overlay.draw();
}

d3.select('#time-slider').call(timeSlider = d3.slider().on("slide", function(evt, value) {
  SetCircles(value);
  SetRelationships(value);
}));

function SetRelationships(value) {
  console.log("Start Here"); 
  console.log("Start Here");   
  var currentDate = new Date(startTime.getTime() + ((endTime.getTime() - startTime.getTime()) * value / 100));
  link = dg_svg.select("g#links")
    .selectAll(".link")
    .style("stroke-width", function(d) {
      return d.value;
    })
    .style("opacity", function(d) {
      startD = new Date(d.start);
      endD = new Date(d.end);
      console.log(startD + ' <= ' + currentDate + ' < ' + endD);
      
      if ( startD <= currentDate && currentDate < endD ) {
        console.log("Match");
        return 1.0;
      }
      else {
        console.log("Nope");
        return 0.0;
      }
    });
}

function SetCircles(value) {
  var currentDate = new Date(startTime.getTime() + ((endTime.getTime() - startTime.getTime()) * value / 100));
  d3.select('#slidertext').text(currentDate);
  
  //update circles
  var geocircles = g.selectAll("circle")
    .attr('cx', function(d) {
      var xCoord = 0;
      var yCoord = 0;
      
      var beforeIndex = 0;
      var afterIndex = 0;
      for(var i=0;i<d.timestamps.length;i++) {
        var compareDate = new Date(Date.parse(d.timestamps[i]));
        if (currentDate > compareDate) {
          beforeIndex = i;
          afterIndex = i;
        } else if (currentDate < compareDate) {
          afterIndex = i;
          break;
        } else {
          beforeIndex = i;
          afterIndex = i;
          break;
        }
      }
      
      if (beforeIndex == afterIndex) {
        return googleMapProjection(d.coordinates[beforeIndex])[0];
      } else {
        var beforeTime = new Date(Date.parse(d.timestamps[beforeIndex]));
        var afterTime = new Date(Date.parse(d.timestamps[afterIndex]));
        
        var indexDiff = new Date(afterTime.getTime() - beforeTime.getTime());
        var currentDiff = new Date(currentDate.getTime() - beforeTime.getTime());
        
        var percent = currentDiff / indexDiff;
        
        var beforeX = d.coordinates[beforeIndex][0];
        var afterX = d.coordinates[afterIndex][0];
        
        var beforeY = d.coordinates[beforeIndex][1];
        var afterY = d.coordinates[afterIndex][1];
        
        xCoord = (afterX - beforeX) * percent + beforeX;
        yCoord = (afterY - beforeY) * percent + beforeY;
      }
      
      var brng = bearing(beforeY, afterY, beforeX, afterX);
      var dist = distance(beforeY, afterY, beforeX, afterX);
      var newCoords = destination(beforeY, beforeX, brng, dist * percent);
      
      var coordinates = googleMapProjection(newCoords);
      return coordinates[0];
    })
    .attr('cy', function(d) {
      var xCoord = 0;
      var yCoord = 0;
      
      var beforeIndex = 0;
      var afterIndex = 0;
      for(var i=0;i<d.timestamps.length;i++) {
        var compareDate = new Date(Date.parse(d.timestamps[i]));
        if (currentDate > compareDate) {
          beforeIndex = i;
          afterIndex = i;
        } else if (currentDate < compareDate) {
          afterIndex = i;
          break;
        } else {
          beforeIndex = i;
          afterIndex = i;
          break;
        }
      }
      
      if (beforeIndex == afterIndex) {
        return googleMapProjection(d.coordinates[beforeIndex])[1];
      } else {
        var beforeTime = new Date(Date.parse(d.timestamps[beforeIndex]));
        var afterTime = new Date(Date.parse(d.timestamps[afterIndex]));
        
        var indexDiff = new Date(afterTime.getTime() - beforeTime.getTime());
        var currentDiff = new Date(currentDate.getTime() - beforeTime.getTime());
        
        var percent = currentDiff / indexDiff;
        
        var beforeX = d.coordinates[beforeIndex][0];
        var afterX = d.coordinates[afterIndex][0];
        
        var beforeY = d.coordinates[beforeIndex][1];
        var afterY = d.coordinates[afterIndex][1];
        
        xCoord = (afterX - beforeX) * percent + beforeX;
        yCoord = (afterY - beforeY) * percent + beforeY;
      }
      
      var brng = bearing(beforeY, afterY, beforeX, afterX);
      var dist = distance(beforeY, afterY, beforeX, afterX);
      var newCoords = destination(beforeY, beforeX, brng, dist * percent);
      
      var coordinates = googleMapProjection(newCoords);
      return coordinates[1];
    });
}

function AnimateTracks() {
  var currentValue = timeSlider.value()+playSpeed;
  timeSlider.value(currentValue);

  if (timeSlider.value() >= 100) {
    animate = false;
    $("#play").text("Play");
    clearInterval(timeout);
  } else {
    SetCircles(currentValue);
    SetRelationships(currentValue);
  }

  d3.select('#time-slider').selectAll("a").attr("style", "left: "+currentValue+"%;");
}

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

Number.prototype.toDeg = function() {
  return this * 180 / Math.PI;
}

Number.prototype.toRad = function() {
  return this * Math.PI / 180;
}
