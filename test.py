import sys
import datetime
from datetime import datetime
import math


#
# modify a pair of lat or lon coordinates to correctly
# calcuate the shortest distance between them.
#
def wrapDistances(d1,d2):
  if d1 < -90 and d2 > 90:
    d2 = d2 - 360
  elif d2 < -90 and d1 > 90:
    d1 = d1 - 360
  return (d1,d2)

# compute the distance (in kilometers) between two points in lat / Ion
# this method makes use of the haversine formula of computing distance
def computeDistanceKM(lat1, lon1, lat2, lon2):
  #this computes distance in km
  (lat1,lat2) = wrapDistances(lat1,lat2)
  (lon1,lon2) = wrapDistances(lon1,lon2)
  R=6371
  dlat = math.radians(float(lat2)-float(lat1))
  dlon = math.radians(float(lon2)-float(lon1))
  a = float(math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2))
  c = float(2 * math.atan2(math.sqrt(a), math.sqrt(1-a)))
  d = float(R * c)
  return d

lasttrack = None

tracks = {}
for line in sys.stdin:
  x,y,track = line.strip().split('\t')
  if lasttrack == None:
    lasttrack = track
    tracks[track] = x + '_' + y
  elif lasttrack == track:
    places = tracks[track].split(',')
    lastplace = None
    for place in places:
      if place != lastplace:
        print '\t'.join((place, x + '_' + y,str(computeDistanceKM(float(place.split('_')[0]),float(place.split('_')[1]),float(x),float(y)))))
      lastplace = place
    tracks[track] = tracks[track] + ',' + x + '_' + y
  elif lasttrack != track:
    tracks[lasttrack] = None
    lasttrack = track
    tracks[track] = x + '_' + y
