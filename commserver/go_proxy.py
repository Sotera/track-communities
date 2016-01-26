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

import urllib2

tangelo_host="http://localhost:8000/community/setcomm/"

@route('/setcomm/<name>')
def index(name=''):
    req = urllib2.Request(tangelo_host + name)
    response = urllib2.urlopen(req)

run(host='0.0.0.0', port=8787)
