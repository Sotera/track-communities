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

i = 1
pm = 'louvain_to_gephi/community_itr_'

while os.path.exists(pm + str(i) + '.nodes'):
  f = open(pm + str(i) + '.nodes', 'r')
  o = open(pm + str(i) + '_w_level.nodes.l' , 'w')
  for line in f:
    o.write(line.strip() + '\t' + str(i) + '\n')
  o.close()
  f.close()
  i = i + 1
