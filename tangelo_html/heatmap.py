import tangelo
import cherrypy
import json
import impala
import cache
from utils import *

def getCurrentHeatMap(*args):
    table = cache.get().get("table");
    query = "select x, y, sum(value) from micro_path_intersect_counts_%s group by x, y" % table
    client = impala.ImpalaBeeswaxClient('localhost:21000')   
    client.connect()
    results = client.execute(query);
    client.close_connection()
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
