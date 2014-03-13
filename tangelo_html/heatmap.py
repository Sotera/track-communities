import tangelo
import cherrypy
import json
import impala
import cache
from utils import *


def generateHeatMap(*args):
    table = cache.get().get("table");
    query = "select x, y, sum(value) from micro_path_intersect_counts_%s group by x, y" % table
    client = impala.ImpalaBeeswaxClient('localhost:21000')   
    client.connect()
    results = client.execute(query);
    client.close_connection()
    out = cherrypy.config.get("webroot") + "/session/heatmap_" + table + ".dat"
    spit(out, results.get_data(), True)
    return "0"

def getCurrentHeatMap(*args):
    table = cache.get().get("table");
    _in = cherrypy.config.get("webroot") + "/session/heatmap_" + table + ".dat"
    sz_tmpl = "{ location: new google.maps.LatLng(%s, %s),  weight: %s }"
    data = slurpA(_in)
    tangelo.log(str(len(data)))
    tangelo.log(data[0])
    tangelo.log(",".join(data[0].split("\t")))
    #tangelo.content_type("application/json")    
    fmt = lambda row : "{ location: new google.maps.LatLng(%s, %s), weight: %s }" % tuple(row.split("\t"))
    return "[" + ",".join([fmt(row) for row in data]) + "]"
    
actions = {
    "map" : getCurrentHeatMap,
    "generate" : generateHeatMap
}

@tangelo.restful
def get(action,*args, **kwargs):
    def unknown(*args):
        return tangelo.HTTPStatusCode(400, "invalid service call")
    return actions.get(action, unknown)(*args)
