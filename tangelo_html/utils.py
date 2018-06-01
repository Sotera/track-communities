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

import os
import sys

# The following project path should be replaced with where you installed virtualenv using python 2.7
# It is included here to make sure the runtime uses the Impala client API that comes with the virtualenv
# and not the one that may have already been installed on the cluster
sys.path.insert(0,'<root project using virtualenv>/lib/python2.7/site-packages')
import impala
print "****impala.__file__: " + impala.__file__
from impala.dbapi import connect

def slurp(filePath):
    # read contents of file to string
    with open(filePath) as x: data = x.read()
    return data

def slurpA(filePath):
    # same as slurp but return Array of lines instead of string
    with open(filePath) as x: data = x.read().splitlines()
    return data

def spit(filePath, data, overwrite=False):
    # write all contents to a file
    mode= 'w' if overwrite else 'a'
    with open(filePath, mode) as x: x.write(data)

def exists(filePath):
    return os.path.exists(filePath)

class impalaopen(object):
    
    def __init__(self, host):
        self.client = None
        (self.host_ip,self.host_port) = host.split(":")

    def __enter__(self):
        self.client = connect(host=self.host_ip, port=self.host_port) 
        return self.client.cursor()

    def __exit__(self, type, value, traceback):
        self.client.close()
