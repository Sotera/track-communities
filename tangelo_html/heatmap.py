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
