import tangelo
import cherrypy
import json
import random
import impala
from utils import *
import cache

#/community/gettable
def gettable(*args):
    return cache.get().get("table", "")

#/community/tables
def tables(*args):
    client = impala.ImpalaBeeswaxClient('localhost:21000')
    client.connect()
    results = client.execute("show tables")
    rows = results.get_data()
    client.close_connection()
    tangelo.content_type("application/json")
    return json.dumps({ 'tables' : [ table[:-20] for table in rows.split('\n') if table.endswith("tracks_comms_joined") ]})

#/community/settable/<name>
def settable(*args):
    if args:
        cache.update({ "table" : args[0] })
    return "0"

#/community/getcomm/
def getcomm(*args):
    return cache.get().get("community", "")

#/community/commkml/
def commkml(*args):
    return slurp(cherrypy.config.get("webroot") + "/session/output.kml")

#/community/current
def getcurrent(*args):
    c = cache.get()
    tangelo.content_type("application/json")    
    return { "table" : c["table"], "community" : c["community"] }

#/community/setcomm/<name>
def setcomm(*args):
    if not args:
        return tangelo.HTTPStatusCode(400, "No community name")
   
    c = cache.update({ "community" : args[0] })
    comm = c["community"]
    table = c["table"] + "_tracks_comms_joined"
    client = impala.ImpalaBeeswaxClient('localhost:21000')
    client.connect()
    count = client.execute("select count(*) from " + table + " where comm = '" + comm + "'")
    count_result = count.get_data()
    print count_result.strip()
    results = client.execute("select * from " + table + " where comm = '" + comm + "' order by track_id, dt asc limit " + count_result.strip())
    client.close_connection()
    rows = results.get_data()

    whens = {}
    coords = {}
    for i in rows.split('\n'):
        latitude, longitude, dt, track, comm = i.strip().split('\t')
        if whens.get(track) == None:
            whens[track] = "<when>" + dt.split('.')[0].replace(' ','T') + "</when>\n"
        else:
            whens[track] = whens[track] + "<when>" + dt.split('.')[0].replace(' ','T') + "</when>\n"

        if coords.get(track) == None:
            coords[track] = "<gx:coord>" + longitude + " " + latitude + " 0</gx:coord>\n"
        else:
            coords[track] = coords[track] + "<gx:coord>" + longitude + " " + latitude + " 0</gx:coord>\n"
    document = "\
<?xml version=\"1.0\" encoding=\"UTF-8\"?> \
<kml xmlns=\"http://www.opengis.net/kml/2.2\" xmlns:gx=\"http://www.google.com/kml/ext/2.2\"><Document>"
    
    for key in whens.keys():
        r = lambda: random.randint(0,255)
        color = '#FF' + ('%02X%02X%02X' % (r(),r(),r()))
        document = document + "<Style id=\"" + key.replace(' ','_') + "\"><IconStyle><color>" + color + "</color><Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon></IconStyle><LabelStyle><scale>0</scale></LabelStyle><LineStyle><color>" + color + "</color><width>3</width></LineStyle></Style>"
        document = document + "<Placemark><name>"+key.replace(' ','_')+"</name><styleUrl>#" + key.replace(' ','_') + "</styleUrl><gx:Track><altitudeMode>relativeToGround</altitudeMode><extrude>1</extrude>"
        document = document + whens[key] + coords[key] + "</gx:Track></Placemark>"
    document = document + "</Document></kml>"
    spit(cherrypy.config.get("webroot") + "/session/output.kml", document, True)
    return "0"

actions = {
    "commkml": commkml,
    "getcomm": getcomm,
    "setcomm": setcomm,
    "gettable": gettable,
    "settable": settable,
    "tables": tables,
    "current": getcurrent
}

@tangelo.restful
def get(action, *args, **kwargs):
    def unknown(*args):
        return tangelo.HTTPStatusCode(400, "invalid service call")
    return actions.get(action, unknown)(*args)

@tangelo.restful
def post(*pargs, **kwargs):
    body = json.loads(cherrypy.request.body.read())
    cache.update(body)
    path = '.'.join(pargs)
    return "0"


