#
# Copyright 2016 Sotera Defense Solutions Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License”);
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

from bottle import route, run, template, response
import random
import impala
import json

comm = ''
outputkml = ''
table = 'FILL_THIS_IN'

@route('/commkml/')
def index():
    response.set_header('Access-Control-Allow-Origin', '*')
    global outputkml
    return outputkml

@route('/getcomm/')
def index():
    response.set_header('Access-Control-Allow-Origin', '*')
    global comm
    return comm

@route('/gettables/')
def gettables():
    client = impala.ImpalaBeeswaxClient('localhost:21000')
    client.connect()
    results = client.execute("show tables")
    rows = results.get_data()
    client.close_connection()
    response.set_header('Access-Control-Allow-Origin', '*')
    response.set_header('Content-Type', 'application/json')
    return json.dumps({ 'tables' : [ table for table in rows.split('\n') if table.endswith("tracks_comms_joined") ]})

@route('/settable/<name>')
def index(name=''):
    global table
    table = name
    response.set_header('Access-Control-Allow-Origin', '*')
    response.set_header('Content-Type', 'text/plain')
    return "0"

@route('/setcomm/<name>')
def index(name=''):
    global comm
    global outputkml
    comm = name
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
    output = open('output.kml','w')
    outputkml = document
    output.write(document)
    response.set_header('Access-Control-Allow-Origin', '*')
    response.set_header('Content-Type', 'text/plain')
    return "0"
        
run(host='0.0.0.0', port=8787)
