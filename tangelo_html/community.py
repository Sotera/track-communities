#
# Copyright 2016 Sotera Defense Solutions Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import tangelo
import cherrypy
import json
import random
from utils import *
import cache
import settings

database = cache.get().get("database", "")
table = cache.get().get("table", "")

#/community/gettable
def gettable(*args):
    return cache.get().get("database", ""), cache.get().get("table", "")

#/community/tables
def tables(*args):
    with impalaopen(":".join(settings.IMPALA)) as curr:
        curr.execute("show tables")        
        tangelo.content_type("application/json")
        return json.dumps({ 'tables' : [ table[:-20] for table in curr if table[0].endswith("tracks_comms_joined") ]})

#/community/settable/<name>
def settable(*args):
    if args:
        cache.update({ "table" : args[0] })
    with impalaopen(":".join(settings.IMPALA)) as curr:
        query = "select level, count(distinct source) from " + database + "." + args[0]  + "_good_graph group by level order by level desc limit 50;"
        curr.execute(query)
        graph_stat_string = ""
        num_levels = 2
        i = 0
        for line in curr:
            (level,nodes) = line
            if i == 0:
                num_levels = int(level)
            i = i + 1
            graph_stat_string = graph_stat_string + "Level: " + str(level) + ", " + str(nodes) + " nodes "
        
        query = "select min(dt), max(dt), min(cast(intersectx as double)), max(cast(intersectx as double)), min(cast(intersecty as double)), max(cast(intersecty as double)) from " + cache.get().get("database", "") + "." + cache.get().get("table", "") + "_tracks_comms_joined where track_id != 'ship(1.0)' and track_id != 'ais(3.0)'"
        curr.execute(query)
        for line in curr:
            (mindt,maxdt,minlat,maxlat,minlon,maxlon) = line
            cache.update({ "mindt" : mindt,
                           "maxdt" : maxdt,
                           "minlat" : minlat,
                           "minlon" : minlon,
                           "maxlat" : maxlat,
                           "maxlon" : maxlon })

        cache.update({ "graph_stat_string" : graph_stat_string + "" ,
                       "graph_num_levels" : num_levels,
                       "level" : str(num_levels), 
                       "community" : '-' })
    return "0"

#/community/getcomm/
def getcomm(*args):
    return cache.get().get("community", "") + "/" + cache.get().get("level", "")

#/community/commkml/
def commkml(*args):
    return slurp(cherrypy.config.get("webroot") + "/session/output.kml")

#/community/current
def getcurrent(*args):
    c = cache.get()
    tangelo.content_type("application/json")    
    return { "table" : c["table"], "community" : c["community"], "level" : c["level"], "graph_stat_string" : c["graph_stat_string"], "graph_num_levels": c["graph_num_levels"], "mindt":c["mindt"],"maxdt":c["maxdt"],"minlat":c["minlat"],"minlon":c["minlon"],"maxlat":c["maxlat"],"maxlon":c["maxlon"] }

#/community/setcomm/<comm_name>/<level>
def setcomm(*args):
    if not args:
        return tangelo.HTTPStatusCode(400, "No community name")
   
    c = cache.update({ "community" : args[0], 
                       "level" : args[1] })

    comm = c["community"]
    level = c["level"]
    table = c["table"] + "_tracks_comms_joined"
    rows = []
    with impalaopen(":".join(settings.IMPALA)) as curr:
        query = "select count(*) from " + database + "." + table + " where comm_" + str(level) + " = '" + comm + "'"
        curr.execute(query)
        count = curr.fetchall()[0] 
        print count[0]
        query = "select intersectx, intersecty, dt, track_id from " + database + "." + table + " where comm_" + str(level) + " = '" + comm + "' order by track_id, dt asc limit " + str(count[0]) 
        curr.execute(query)
        rows = curr.fetchall()

    whens = {}
    coords = {}
    for i in rows:
        (latitude, longitude, dt, track) = i
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


