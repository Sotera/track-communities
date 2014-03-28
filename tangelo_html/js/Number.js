Number.prototype.toDeg = function() {
  return this * 180 / Math.PI;
}

Number.prototype.toRad = function() {
  return this * Math.PI / 180;
}