import impala
import json
import tangelo
import itertools

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

def run(database="default", table="ais_small_final_tracks_comms_joined", host="xdata", port="21000", trackId=None, comm=None):
        response = {}
        
        query = "select * from %s" % (table)
        
        if trackId != None:
            query = query + " where track_id = %s" % (trackId)
        elif comm != None:
            query = query + " where comm = %s" % (comm)
        else:
            return response
        
        query = query + " order by track_id, dt limit 100000"
        
        client = impala.ImpalaBeeswaxClient(host + ':' + port)
        client.connect()
        
        qResults = client.execute(query)
        
        results = convert_results(qResults, "true")
        
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
                                 "comm": record["comm"],
                                 "index": trackIndex,
                                 "coordinates": [],
                                 "timestamps": []
                                }
                trackIndex = trackIndex + 1
                geoResults.append(currentTrack)
                
            coords = [ recordx,
                       recordy
                     ]
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
        
        return response
