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
