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
import sys
from subprocess import call

table = sys.argv[1]
last_table = sys.argv[2]
number = int(sys.argv[3])

source_string = ''
target_string = ''

while number > 1:
  source_string = source_string + ', t2.comm_' + str(number) + ' as comm_' + str(number) + '_source'
  target_string = target_string + ', t3.comm_' + str(number) + ' as comm_' + str(number) + '_destination'
  number = number - 1

call("hive -e \"drop table " + table + "_dynamic_graph_w_comms;\"",shell=True)

table_string = "hive -e \"create table " + table + "_dynamic_graph_w_comms as select t1.source, t2.comm_1 as comm_1_source" + source_string + ', t1.destination, t3.comm_1 as comm_1_destination' + target_string + ', t1.firstdate, t1.lastdate, t1.value from ' + last_table + ' t2 join ' + table + '_dynamic_graph t1 on (t2.node = t1.source) join ' + last_table + ' t3 on (t3.node = t1.destination);\"'
print table_string
call(table_string, shell=True)
