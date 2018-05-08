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

#!/usr/bin/env bash 

set -e 

# This value should match the table value in the .ini file
ini_file=$1


export ROOT=/share/staging1_disk1/users/gzheng
#aggregate-micro-paths location
AMP=$ROOT/aggregate-micro-paths
#track-communities
TRACK_COMMS=$ROOT/track-communities
#distributed-louvain-modularity
LOUVAIN=$ROOT/distributed-louvain-modularity

database=$(sed -n 's/.*database_name *: *\([^ ]*.*\)/\1/p' < $AMP/hive-streaming/conf/${ini_file})
table=$(sed -n 's/.*table_name *: *\([^ ]*.*\)/\1/p' < $AMP/hive-streaming/conf/${ini_file})
id=$(sed -n 's/.*table_schema_id *: *\([^ ]*.*\)/\1/p' < $AMP/hive-streaming/conf/${ini_file})
latitude=$(sed -n 's/.*table_schema_lat *: *\([^ ]*.*\)/\1/p' < $AMP/hive-streaming/conf/${ini_file})
longitude=$(sed -n 's/.*table_schema_lon *: *\([^ ]*.*\)/\1/p' < $AMP/hive-streaming/conf/${ini_file})
dt=$(sed -n 's/.*table_schema_dt *: *\([^ ]*.*\)/\1/p' < $AMP/hive-streaming/conf/${ini_file})
temporal_split=$(sed -n 's/.*temporal_split *: *\([^ ]*.*\)/\1/p' < $AMP/hive-streaming/conf/${ini_file})


# 1st Run Triplines
cd $AMP/hive-streaming
python AggregateMicroPath.py -c ${ini_file}

cd $TRACK_COMMS
hive --hiveconf ts=${temporal_split} --hiveconf database=${database} --hiveconf table=${table} -f query.sql

if hadoop fs -test -d /tmp/trackcomms/${table}/output; then
    hadoop fs -rm -r /tmp/trackcomms/${table}/output
fi

hadoop fs -mkdir /tmp/trackcomms/${table}/output

cd $LOUVAIN
python louvain.py /user/hive/warehouse/${table}_edgelist /tmp/trackcomms/${table}/output

cd $TRACK_COMMS
if [ -d output ]; then
    rm -Rf output
fi

hadoop fs -get /tmp/trackcomms/${table}/output .

if [ -d louvain_to_gephi ]; then
    rm -Rf louvain_to_gephi
fi

hive -e "select * from ${table}_edgelist;" > edgelist.tsv
python louvain_to_gephi.py

python gogo.py

if hadoop fs -test -d /tmp/trackcomms/${table}/output/graph; then
    hadoop fs -rm -r /tmp/trackcomms/${table}/output/graph
fi

hadoop fs -mkdir /tmp/trackcomms/${table}/output/graph
hadoop fs -put goodgraph.out /tmp/trackcomms/${table}/output/graph

if hadoop fs -test -e /tmp/trackcomms/${table}/output/giraph_1/_logs; then
    hadoop fs -rm -r /tmp/trackcomms/${table}/output/giraph_1/_logs
fi 

if hadoop fs -test -e /tmp/trackcomms/${table}/output/giraph_1/_SUCCESS; then
    hadoop fs -rm -r /tmp/trackcomms/${table}/output/giraph_1/_SUCCESS
fi 

hive -hiveconf table=${table} -f nodes_comms.sql

last_table_num=`python comm_mapping.py ${table}`
if [ -a garbage.out ]; then
    rm garbage.out
fi

last_table=${table}_nodes_comms_${last_table_num}

hive -e "insert into table ${table}_good_nodes partition (level='1') select node, comm_1, '1' from ${last_table};"

hive -hiveconf table=${table} -hiveconf id=${id} -hiveconf latitude=${latitude} -hiveconf longitude=${longitude} -hiveconf dt=${dt} -hiveconf last_table=${last_table} -f join_orig_tracks.sql

python finamic_graph.py ${table} ${last_table} ${last_table_num}

echo "Done"
