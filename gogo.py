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

ga = sys.argv[1]

i = 1

output = open('goodgraph.out','w')
p = './louvain_to_gephi/' + ga

while os.path.exists(p + '/community_itr_' + str(i) + '.nodes'):
  comms = open(p + '/community_itr_' + str(i) + '.nodes','r')
  comm_hash = {}
  for line in comms:
    node, comm = line.strip().split('\t')
    comm_hash[node] = comm

  edges = open(p + '/graph_itr_' + str(i-1) + '.edges','r')
  for line in edges:
    source,target,weight = line.strip().split('\t')
    output.write('\t'.join((source,comm_hash[source],target,comm_hash[target],weight,str(i),'\n')))
  i = i + 1
