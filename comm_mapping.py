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
from subprocess import call

table = sys.argv[1]
garbage = open('garbage.out','w')
i = 2
ret = call("hadoop fs -ls /tmp/trackcomms/" + table + "/output/giraph_" + str(i) + "/",stdout=garbage,shell=True)
while ret == 0:
  call("hadoop fs -rm -r /tmp/trackcomms/" + table + "/output/giraph_" + str(i
) + "/_logs",stdout=garbage,shell=True)
  call("hadoop fs -rm -r /tmp/trackcomms/" + table + "/output/giraph_" + str(i
) +"/_SUCCESS",stdout=garbage,shell=True)
  call('hive -hiveconf table=' + table + ' -hiveconf level=' + str(i) + ' -hiveconf last_level=' + str(i-1) + ' -f bigtables.sql',stdout=garbage,shell=True)
  
  call('hive -hiveconf table=' + table + ' -hiveconf level=' + str(i) + ' -hiveconf last_level=' + str(i-1) + ' -f nodetables.sql',stdout=garbage,shell=True)
  i += 1
  ret = call('hadoop fs -ls /tmp/trackcomms/' + table + '/output/giraph_' + str(i) + '/',stdout=garbage,shell=True)

print str(i-1)
