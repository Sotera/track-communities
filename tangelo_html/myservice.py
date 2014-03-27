import json
import tangelo
import itertools
import cache
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

def getWholeGephiGraph(comm=None, level=None, host="localhost", port="21000"):
    gephinodes, gephigraph = subgraph(comm, level, host, port)
    response = {}
    response["gephinodes"] = gephinodes
    response["gephigraph"] = gephigraph
    return response

def getNodes(comm=None, level=None, host="localhost", port="21000"):
    nodetable = cache.get().get("table","") + '_good_nodes'
    node_comm_filter_string = ""
    if comm != None:
        node_comm_filter_string = " and comm=" + comm
    nodequery = "select node, comm, num_members, level from " + nodetable + " where level=" + level + node_comm_filter_string
    with impalaopen(host + ':' + port) as client:
        qResults = client.execute(nodequery)
        mapping = {}
        idx = 0
        for record in qResults.data:
            node,comm,num_members,level = record.split('\t')
            mapping[node] = {"index":idx,"nodename":node,"node_comm":comm,"level":level,"num_members":num_members}
            idx = idx + 1
    return mapping


def subgraph(comm=None, level=None, host="localhost", port="21000"):
    edgetable = cache.get().get("table","") + '_good_graph'

    mapping = getNodes(comm,level,host,port)
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

        for i in mapping.keys():
            nodes.append({"index":mapping[i]["index"],"nodename":mapping[i]["nodename"],"node_comm":mapping[i]["node_comm"],"level":mapping[i]["level"],"num_members":mapping[i]["num_members"]})
        return nodes, edges


def linkages(comm=None, level=None, nodemap=None, host="localhost", port="21000"):
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

def run(database="default", table="", host="localhost", port="21000", trackId=None, comm=None, lev=None):
    if comm == None:
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
    return response
