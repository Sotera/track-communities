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


import os
import impala

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
        self.host = host

    def __enter__(self):
        self.client = impala.ImpalaBeeswaxClient(self.host)
        self.client.connect()
        return self.client

    def __exit__(self, type, value, traceback):
        self.client.close_connection()
