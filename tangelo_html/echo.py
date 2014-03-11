import tangelo
import cherrypy

#just a sample to test the service is up
@tangelo.restful
def get(sz):
    tangelo.content_type("application/json")
    return { "echo" : sz }

@tangelo.restful
def post(*pargs, **kwargs):
    body = cherrypy.request.body.read()
    path = '.'.join(pargs)
    tangelo.content_type("application/json")
    return { "echo" : { "path" : path, "body" : body }}
