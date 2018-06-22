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

#!/usr/bin/env python

import os
import re
import sys
from subprocess import call

table = sys.argv[1]

garbage = open("garbage.out","w")

v = 'output/graphx/level_0_vertices'
os.system("cat " + v + "/part-* > " + v + "/output")

f = open(v + '/output','r')
o = open('louvain_to_gephi/graphx/community_itr_1.nodes','w')

nodeMap = {}

for line in f:
  id = re.search(r'\(([a-zA-Z0-9]+)', line).group(1)
  name = re.search(r'(name):([a-zA-Z0-9\-]+)', line).group(2)
  comm = re.search(r'(communityName):([a-zA-Z0-9\-]+)', line).group(2)
  nodeMap[id] = name
  o.write(name + '\t' + comm + '\n')
f.close()
o.close()

call("hadoop fs -mkdir /tmp/trackcomms/" + table + "/output/graphx/comm_1", stdout=garbage, shell=True)
call("hadoop fs -put louvain_to_gephi/graphx/community_itr_1.nodes /tmp/trackcomms/" + table + "/output/graphx/comm_1", stdout=garbage, shell=True)

f = open('edgelist.tsv','r')
o = open('louvain_to_gephi/graphx/graph_itr_0.edges','w')

for line in f:
  if len(line.split('\t')) == 3:
    source,weight,edgelist = line.split('\t')
    edgelist = edgelist.strip().split(',')
    for e in edgelist:
      o.write('\t'.join((source,e.split(':')[0],e.split(':')[1])) + '\n')

o.close()
f.close()

# Here's the looping piece

i = 1
v = 'output/graphx/level_'+str(i)+'_vertices'
e = 'output/graphx/level_'+str(i)+'_edges'
while os.path.exists(e):
  os.system("cat " + v + "/part-* > " + v + "/output")
  os.system("cat " + e + "/part-* > " + e + "/output")
  
  level = str(i+1)
  f = open(v + '/output','r')
  o = open('louvain_to_gephi/graphx/community_itr_' + level + '.nodes','w')

  for line in f:
    id = re.search(r'\(([a-zA-Z0-9]+)', line).group(1)
    name = re.search(r'(name):([a-zA-Z0-9\-]+)', line).group(2)
    comm = re.search(r'(communityName):([a-zA-Z0-9\-]+)', line).group(2)
    nodeMap[id] = name
    o.write(name + '\t' + comm + '\n')
  f.close()
  o.close()

  call("hadoop fs -mkdir /tmp/trackcomms/" + table + "/output/graphx/comm_" + level, stdout=garbage, shell=True)
  call("hadoop fs -put louvain_to_gephi/graphx/community_itr_" + level + ".nodes /tmp/trackcomms/" + table + "/output/graphx/comm_" + level, stdout=garbage, shell=True)

  f = open(e + '/output','r')
  o = open('louvain_to_gephi/graphx/graph_itr_' + str(i) + '.edges','w')
  for line in f:
    match = re.search(r'Edge\(([a-zA-Z0-9]+),([a-zA-Z0-9]+),([0-9]+)\)', line)
    o.write('\t'.join((nodeMap[match.group(1)],nodeMap[match.group(2)], match.group(3))) + '\n')
  o.close()
  f.close()
  
  i = i + 1
  v = 'output/graphx/level_'+str(i)+'_vertices'
  e = 'output/graphx/level_'+str(i)+'_edges'

