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

import cherrypy
import json

from utils import *

#simple disk cache

def loadDefaults():
    webroot = cherrypy.config.get("webroot")
    clear()
    if exists(webroot + "/session/cache.default"):
        update(json.loads(slurp(webroot + "/session/cache.default")))

def clear():
    spit(cherrypy.config.get("webroot") + "/session/cache", '{}', True)
    
#merge overwrite of options <Dictionary> 
def update(options):
    config = get()
    config = dict(config, **options)
    spit(cherrypy.config.get("webroot") + "/session/cache", json.dumps(config), True)
    return config

#returns the whole cache obj
def get():
    data = slurp(cherrypy.config.get("webroot") + "/session/cache")
    return json.loads(data)

#initialize / load defaults
loadDefaults()
