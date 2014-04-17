import json
import tangelo
import itertools
import cache
import settings
from utils import *

def convert(value, type):
    if type == "tinyint":
        return int(value)
    elif type == "int":
        return int(value)
    elif type == "double":
        return float(value)
    elif type == "string":
        return value
    elif type == "boolean":
        return True if value == "true" else False
    return None

def convert_results(results, fields=False):
    schema = results.schema.fieldSchemas
    converted = []
    for d in results.data:
        parts = d.split("\t")
        if fields:
            row = {}
            for i in range(len(parts)):
                row[schema[i].name] = convert(parts[i], schema[i].type)
        else:
            row = []
            for i in range(len(parts)):
                row.append(convert(parts[i], schema[i].type))
        converted.append(row)
    return converted

def getWholeGephiGraph(comm=None, level=None, host=settings.IMPALA[0], port=settings.IMPALA[1]):
    gephinodes, gephigraph = subgraph(comm, level, host, port)
    response = {}
    response["gephinodes"] = gephinodes
    response["gephigraph"] = gephigraph
    return response

def geoTimeQuery(comm=None, level=None, host=settings.IMPALA[0], port=settings.IMPALA[1], geo=None, time=None):
    level = cache.get().get("graph_num_levels","")
    nodetable = cache.get().get("table","") + '_good_nodes'
    edgestable = cache.get().get("table","") + '_good_graph'
    trackstable = cache.get().get("table","") + '_tracks_comms_joined'

    query = 'select distinct comm_' + str(level) + ' from ' + trackstable + ' where '
    geoThere = False
    if geo["min_lat"] != None:
        locationquery = ' cast(intersectx as double) >= ' + geo["min_lat"].replace('"','') + ' and cast(intersectx as double) <= ' + geo["max_lat"].replace('"','') + ' and cast(intersecty as double) >= ' + geo["min_lon"].replace('"','') + ' and cast(intersecty as double) <= ' + geo["max_lon"].replace('"','')
        query = query + locationquery
        geoThere = True

    if time["min_time"] != None:
        timequery = ' dt >= ' + time["min_time"] + ' and dt <= ' + time["max_time"] 
        if geoThere:
            query = query + ' and '
        query = query + timequery
    #print query
    
    nodequery = 'select node, comm, num_members, level from ' + nodetable + ' where level = "' + str(level) + '" and comm in '
    edgequery = 'select source, target, weight, level from ' +  edgestable + ' where level = "' + str(level) + '" '

    #print nodequery

    #print edgequery
    
    with impalaopen(host + ':' + port) as client:
        qResults = client.execute(query)
        comm_string = '( ' 
        for record in qResults.data:
            comm_string = comm_string + '"' + record.strip() + '", '
        comm_string = comm_string[0:len(comm_string)-2] + ')'
        nodequery = nodequery + comm_string
        edgequery = edgequery + ' and (source_comm in ' + comm_string + ' and target_comm in ' + comm_string + ' )'
    
    with impalaopen(host + ':' + port) as client:
        qResults = client.execute(nodequery)
        mapping = {}
        idx = 0
        for record in qResults.data:
            node,comm,num_members,level = record.split('\t')
            mapping[node] = {"index":idx,"nodename":node,"node_comm":comm,"level":level,"num_members":num_members}
            idx = idx + 1
    
    edges = []
    nodes = []
    with impalaopen(host + ':' + port) as client:
        qResults = client.execute(edgequery)
        for record in qResults.data:
            source,target,weight,level = record.split('\t')
            edges.append({"source":mapping[source]["index"],"sourcename":source,"target":mapping[target]["index"],"targetname":target,"weight":weight})
        for i in mapping.keys():
            nodes.append({"index":mapping[i]["index"],"nodename":mapping[i]["nodename"],"node_comm":mapping[i]["node_comm"],"level":mapping[i]["level"],"num_members":mapping[i]["num_members"]})
    
    response = {}
    response["gephinodes"] = nodes
    response["gephigraph"] = edges
    return response
        

def getNodes(comm=None, level=None, host=settings.IMPALA[0], port=settings.IMPALA[1]):
    nodetable = cache.get().get("table","") + '_good_nodes'
    node_comm_filter_string = ""
    if comm != None:
        node_comm_filter_string = " and comm=" + comm
    nodequery = "select node, comm, num_members, level from " + nodetable + " where level=" + level + node_comm_filter_string
    with impalaopen(host + ':' + port) as client:
        qResults = client.execute(nodequery)
        mapping = {}
        array_map = []
        idx = 0
        for record in qResults.data:
            node,comm,num_members,level = record.split('\t')
            mapping[node] = {"index":idx,"nodename":node,"node_comm":comm,"level":level,"num_members":num_members}
            array_map.append({"index":idx,"nodename":node,"node_comm":comm,"level":level,"num_members":num_members})
            idx = idx + 1
        return mapping, array_map


def subgraph(comm=None, level=None, host=settings.IMPALA[0], port=settings.IMPALA[1]):
    edgetable = cache.get().get("table","") + '_good_graph'

    mapping, array_map = getNodes(comm,level,host,port)
    edge_comm_filter_string = ""
    if comm != None:
        edge_comm_filter_string = " and (source_comm=" + comm + " and target_comm="+ comm + ") "

    edgequery = "select source, target, weight, level from " + edgetable + " where level=" + level + edge_comm_filter_string
    with impalaopen(host + ':' + port) as client:
        qResults = client.execute(edgequery)
        edges = []
        nodes = []
        for record in qResults.data:
            source,target,weight,level = record.split('\t')
            edges.append({"source":mapping[source]["index"],"sourcename":source,"target":mapping[target]["index"],"targetname":target,"weight":weight})

        return array_map, edges


def linkages(comm=None, level=None, nodemap=None, host=settings.IMPALA[0], port=settings.IMPALA[1]):
    if comm == None:
        return []
    table = cache.get().get("table","") + "_dynamic_graph_w_comms"
    query = "select source, destination, firstdate, lastdate, value from " + table + " where comm_"+str(level.replace('"',"")) +"_source= " + comm + " and comm_"+str(level.replace('"','')) + "_destination= " + comm
    with impalaopen(host + ':' + port) as client:
        qResults = client.execute(query)
        edges = []
        for record in qResults.data:
            source,target,start,end,value = record.split('\t')
            edges.append({"source":nodemap[source],"target":nodemap[target],"start":start,"end":end,"value":value})
        return edges

def run(database="default", table="", host=settings.IMPALA[0], port=settings.IMPALA[1], trackId=None, comm=None, lev=None, minlat=None, maxlat=None, minlon=None, maxlon=None, mintime=None, maxtime=None):
    if mintime != None or minlat != None:
        geo = {"min_lat":minlat,"max_lat":maxlat,"min_lon":minlon,"max_lon":maxlon}
        time = {"min_time":mintime,"max_time":maxtime}
        cache.update({ "level" : cache.get().get("graph_num_levels","") })
        return geoTimeQuery(comm,lev,host,port,geo,time)
    if comm == None:
        cache.update({ "level" : lev })
        return getWholeGephiGraph(comm,lev,host,port)
    response = {}
    table = cache.get().get("table", "") + "_tracks_comms_joined"
    query = "select * from %s" % (table)
        
    if trackId != None:
        query = query + " where track_id = %s" % (trackId)
    elif comm != None and lev != None:
        query = query + " where comm_" + str(lev.replace('"','')) + " = %s" % (comm)
    else:
        return response
        
    query = query + " order by track_id, dt limit 10000000"

    results = None
    with impalaopen(host + ':' + port) as client:
        qResults = client.execute(query)
        results = convert_results(qResults, "true")


    nodemap = {}
    bounds = { "north": -1,
               "south": -1,
               "east": -1,
               "west": -1
    }
    start = -1
    end = -1
    geoResults = []
    trackIndex = 0
        
    #convert table results into LineStrings
    for record in results:
        currentTrack = {}
    
        recordx = float(record["intersecty"])
        recordy = float(record["intersectx"])
            
        found = False
        for track in geoResults:
            if track["track_id"] == record["track_id"]:
                currentTrack = track
                found = True
                break
                
        if found == False:
            currentTrack = { "type": "LineString",
                             "track_id": record["track_id"],
                             "comm": record["comm_" + str(lev.replace('"',''))],
                             "index": trackIndex,
                             "coordinates": [],
                             "timestamps": []
            }
            nodemap[record["track_id"]] = trackIndex
            trackIndex = trackIndex + 1
            geoResults.append(currentTrack)
                
        coords = [ recordx, recordy ]
        currentTrack["coordinates"].append(coords)
        currentTrack["timestamps"].append(record["dt"])
            
        if bounds["north"] == -1 or bounds["north"] < recordy:
            bounds["north"] = float(recordy)
                
        if bounds["south"] == -1 or bounds["south"] > recordy:
            bounds["south"] = float(recordy)
                
        if bounds["east"] == -1 or bounds["east"] < recordx:
            bounds["east"] = float(recordx)
                
        if bounds["west"] == -1 or bounds["west"] > recordx:
            bounds["west"] = float(recordx)
            
        if start == -1 or record["dt"] < start:
            start = record["dt"]
                
        if end == -1 or record["dt"] > end:
            end = record["dt"]
        
    response["result"] = geoResults
    response["bounds"] = bounds
    response["start"] = start
    response["end"] = end
    edges = linkages(comm,lev,nodemap,host,port)
    gephinodes, gephigraph = subgraph(comm,lev,host,port)
    response["graph"] = edges
    response["gephinodes"] = gephinodes
    response["gephigraph"] = gephigraph

    cache.update({ "level" : lev })
    return response
