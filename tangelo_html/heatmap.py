import tangelo
import cherrypy
import json
import cache
import settings
from utils import *

def getCurrentHeatMap(*args):
    table = cache.get().get("table");
    query = "select x, y, sum(value) from micro_path_intersect_counts_%s group by x, y" % table
    with impalaopen(":".join(settings.IMPALA)) as client:
        results = client.execute(query);
        data = results.get_data()
        fmt = lambda row : "{ location: new google.maps.LatLng(%s, %s), weight: %s }" % tuple(row.split("\t"))
        return "[" + ",".join([fmt(row) for row in data.split("\n")]) + "]"
    
actions = {
    "map" : getCurrentHeatMap,
}

@tangelo.restful
def get(action,*args, **kwargs):
    def unknown(*args):
        return tangelo.HTTPStatusCode(400, "invalid service call")
    return actions.get(action, unknown)(*args)
