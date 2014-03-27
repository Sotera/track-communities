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
