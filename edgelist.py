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

import sys

nodes = {}
lastsource = None
for line in sys.stdin:
  source, target, weight = line.strip().split('\t')
  if lastsource == None or lastsource == source:
    if nodes.get(source) == None:
      nodes[source] = target + ':' + weight
    else:
      nodes[source] =  nodes[source] + ',' + target + ':' + weight
  else:
    for key in nodes.keys():
      print key + '\t0\t' + nodes[key]
    nodes = {}
    nodes[source] = target + ':' + weight
  lastsource = source

for key in nodes.keys():
  print key + '\t0\t' + nodes[key]

