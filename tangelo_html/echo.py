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
