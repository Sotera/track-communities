



var width = 960,
    height = 480;
    
var startTime = new Date();
var endTime = new Date();

var mySlider;
var animate = false;
var playSpeed = .1;

d3.select('#slidertext').text(startTime.toUTCString());
    
var defaultColors = ["red", "blue", "green", "magenta", "sienna", "teal", "goldenrod", "cyan", "indigo", "springgreen"];
    
var currentScale = 153;

var geodata;

var projection = d3.geo.equirectangular()
    .scale(currentScale)
    .translate([width / 2, height / 2])
    .precision(.1);

var path = d3.geo.path()
    .projection(projection);

var graticule = d3.geo.graticule();

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);
    
var g = svg.append("g")
    .attr("id", "group");

g.append("path")
    .datum(graticule.outline)
    .attr("class", "background")
    .attr("d", path);

d3.json("world-50m.json", function(error, world) {
    
  g.insert("path", ".graticule")
      .datum(topojson.feature(world, world.objects.land))
      .attr("class", "land")
      .attr("d", path);

  g.insert("path", ".graticule")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);
    
});

// zoom and pan
var zoom = d3.behavior.zoom()
    .on("zoom",function() {
        g.attr("transform","translate("+ 
            d3.event.translate.join(",")+")scale("+d3.event.scale+")");
  });

svg.call(zoom)

d3.select(self.frameElement).style("height", height + "px");

svg.append("rect")
    .attr("width", 0)
    .attr("height", 0)
    .attr("x", 2)
    .attr("y", 4)
    .attr("opacity", .2)
    .attr("stroke", "black")
    .attr("fill", "black");

$(function () {
    $("#play").click(function () {
        animate = !animate;
        
        var buttonLabel = "Play";
        if (animate) {
            buttonLabel = "Pause";
        }
        $("#play").text(buttonLabel);
        
        if (timeSlider.value() >= 100) {
            timeSlider.value(0);
        }
    });
    
    $("#refresh").click(function () {
        Reset(false);
        
        $.ajax({
            url: 'http://localhost:8787/getcomm/',
            type: 'GET',
            success: function(data) {
                var serviceCall = '?comm="'+data+'"';
                
                $.getJSON('myservice'+serviceCall, function (data) {
                    
                    var xdiff = data.bounds.east - data.bounds.west;
                    var ydiff = data.bounds.north - data.bounds.south;
                    
                    var bigdiff = xdiff > ydiff ? xdiff : ydiff;
                    
                    var newScale = (30000 / bigdiff) + 70;
                    
                    var centerx = xdiff / 2 + data.bounds.west;
                    var centery = ydiff / 2 + data.bounds.south;
                    
                    projection.center([centerx, centery])
                    .scale(Math.round(newScale));
                    
                    g.attr("transform", "translate(0,0)scale(1)");
                    zoom.scale(1);
                    zoom.translate([0,0]);
                    
                    g.selectAll("path")  
                        .attr("d", path.projection(projection));
                    
                    geodata = g.selectAll(".geojson").data(data["result"], trackid);
                    
                    geodata.enter()
                    .append("path")
                    .attr("opacity", .5)
                    .attr("fill", "none")
                    .attr("stroke", function (d) {
                        var trackColor;
                        if (d.index >= defaultColors.length) {
                            trackColor = '#'+pad(Math.floor(Math.random()*16777215).toString(16),6);
                            defaultColors.push(trackColor);
                        } else {
                            trackColor = defaultColors[d.index];
                        }
                        
                        return trackColor;
                    })
                    .attr("d", path);
                    
                    geodata.exit().remove();
                    
                    var geocircles = g.selectAll("circle").data(data["result"], trackid);
                    
                    geocircles.enter().append('svg:circle')
                        .attr('cx', function(d) {
                            var coordinates = projection([d.coordinates[0][0], 0]);
                            return coordinates[0];
                            })
                        .attr('cy', function(d) {
                            var coordinates = projection([0, d.coordinates[0][1]]);
                            return coordinates[1];
                            })
                        .attr('r', 5)
                        .attr("opacity", .5)
                        .attr("fill", function (d) {
                        var trackColor;
                        if (d.index >= defaultColors.length) {
                            trackColor = '#'+pad(Math.floor(Math.random()*16777215).toString(16),6);
                            defaultColors.push(trackColor);
                        } else {
                            trackColor = defaultColors[d.index];
                        }
                        
                        return trackColor;
                    })
                        
                    geocircles.exit().remove();
                    
                    //text
                    var textY = 15;
                    var text = svg.selectAll("text")
                        .data(data["result"], trackid)
                        .enter()
                        .append("text");
                        
                    var textLabels = text
                         .attr("x", 5)
                         .attr("y", function(d) { return textY*d.index+textY })
                         .text( function (d) { return d.track_id; })
                         .attr("font-family", "sans-serif")
                         .attr("font-size", "10px")
                         .attr("fill", function (d) {
                            var trackColor;
                            if (d.index >= defaultColors.length) {
                                trackColor = '#'+pad(Math.floor(Math.random()*16777215).toString(16),6);
                            } else {
                                trackColor = defaultColors[d.index];
                            }
                            
                            return trackColor;
                        });
                         
                    //legend background?            
                    var background = svg.select("rect")
                        .attr("width", 200)
                        .attr("height", data["result"].length * textY);
                        
                    startTime = new Date(Date.parse(data["start"]+" GMT"));
                    endTime = new Date(Date.parse(data["end"]+" GMT"));
                    
                    d3.select('#slidertext').text(startTime.toUTCString());
                });
            }
        });
        
    });
    
    $("#reset").click(function () {
    	Reset(true);
    });
});

function Reset(full) {
    if (geodata != null) {
        geodata.remove();
    }
    g.selectAll("circle").remove();
    svg.selectAll("text").remove();
    
    var background = svg.select("rect")
        .attr("height", 0);
    
    if (full) {   
        projection.center([0, 0]).scale(153);
        g.attr("transform", "translate(0,0)scale(1)");
        zoom.scale(1);
        zoom.translate([0,0]);
        
        g.selectAll("path")  
            .attr("d", path.projection(projection));
        currentScale = 153;
    }
}

d3.select('#time-slider').call(timeSlider = d3.slider().on("slide", function(evt, value) {
    SetCircles(value);
}));

function SetCircles(value) {
    var currentDate = new Date(startTime.getTime() + ((endTime.getTime() - startTime.getTime()) * value / 100));
    d3.select('#slidertext').text(currentDate.toUTCString());
    
    //update circles
    var geocircles = g.selectAll("circle")
        .attr('cx', function(d) {
            var xCoord = 0;
            var yCoord = 0;
            
            var beforeIndex = 0;
            var afterIndex = 0;
            for(var i=0;i<d.timestamps.length;i++) {
                var compareDate = new Date(Date.parse(d.timestamps[i]+" GMT"));
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
                return projection(d.coordinates[beforeIndex])[0];
            } else {
                var beforeTime = new Date(Date.parse(d.timestamps[beforeIndex]+" GMT"));
                var afterTime = new Date(Date.parse(d.timestamps[afterIndex]+" GMT"));
                
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
            
            var coordinates = projection(newCoords);
            return coordinates[0];
        })
        .attr('cy', function(d) {
            var xCoord = 0;
            var yCoord = 0;
            
            var beforeIndex = 0;
            var afterIndex = 0;
            for(var i=0;i<d.timestamps.length;i++) {
                var compareDate = new Date(Date.parse(d.timestamps[i]+" GMT"));
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
                return projection(d.coordinates[beforeIndex])[1];
            } else {
                var beforeTime = new Date(Date.parse(d.timestamps[beforeIndex]+" GMT"));
                var afterTime = new Date(Date.parse(d.timestamps[afterIndex]+" GMT"));
                
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
            
            var coordinates = projection(newCoords);
            return coordinates[1];
        });
}

setInterval(function(){
    if (animate) {
        var currentValue = timeSlider.value()+playSpeed;
        timeSlider.value(currentValue);
        
        if (timeSlider.value() >= 100) {
            animate = false;
            $("#play").text("Play");
        } else {
            SetCircles(currentValue);
        }
        
        d3.select('#time-slider').selectAll("a").attr("style", "left: "+currentValue+"%;");
    }
},10);

function pad(num, size) {
    var s = "000000" + num;
    return s.substr(s.length-size);
}

function trackid(track) {
    return track.track_id;
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
