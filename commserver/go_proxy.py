from bottle import route, run, template, response

import urllib2

tangelo_host="http://localhost:8000/community/setcomm/"

@route('/setcomm/<name>')
def index(name=''):
    req = urllib2.Request(tangelo_host + name)
    response = urllib2.urlopen(req)

run(host='0.0.0.0', port=8787)
