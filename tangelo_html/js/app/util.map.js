/* Utility Functions, map and overlay helpers */

function SetCircles(value) {
  var currentDate = new Date(startTime.getTime() + ((endTime.getTime() - startTime.getTime()) * value / 100));
  d3.select('#slidertext').text(moment(currentDate).utc().format("YYYY-MM-DDTHH:mm:ss"));
  
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
