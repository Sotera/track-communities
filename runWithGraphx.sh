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
#LOUVAIN=$ROOT/distributed-louvain-modularity
GRAPHX=$ROOT/distributed-graph-analytics/dga-graphx

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

if hadoop fs -test -d /tmp/trackcomms/${table}/output/graphx; then
    hadoop fs -rm -r -skipTrash /tmp/trackcomms/${table}/output/graphx
fi

hadoop fs -mkdir -p /tmp/trackcomms/${table}/output/graphx

cd $GRAPHX
./dga-yarn-graphx louvain -i /user/hive/warehouse/${database}.db/${table}_network_edges -d '\x01' -o /tmp/trackcomms/${table}/output/graphx

cd $TRACK_COMMS
if [ -d output/graphx ]; then
    rm -Rf output/graphx
fi

mkdir -p output/graphx
hadoop fs -mv /tmp/trackcomms/${table}/output/graphx/*/* /tmp/trackcomms/${table}/output/graphx
hadoop fs -get /tmp/trackcomms/${table}/output/graphx/* output/graphx

if [ -d louvain_to_gephi/graphx ]; then
    rm -Rf louvain_to_gephi/graphx
fi

mkdir -p louvain_to_gephi/graphx

hive -e "select * from ${database}.${table}_edgelist;" > edgelist.tsv
python louvain_to_gephi_graphx.py ${table}

python gogo.py graphx

if hadoop fs -test -d /tmp/trackcomms/${table}/output/graphx/graph; then
    hadoop fs -rm -r -skipTrash /tmp/trackcomms/${table}/output/graphx/graph
fi

hadoop fs -mkdir /tmp/trackcomms/${table}/output/graphx/graph
hadoop fs -put goodgraph.out /tmp/trackcomms/${table}/output/graphx/graph

hive --hiveconf database=${database} --hiveconf table=${table} --hiveconf ga=graphx -f nodes_comms.sql

last_table_num=`python comm_mapping.py ${database} ${table} graphx`
if [ -a garbage.out ]; then
    rm garbage.out
fi

last_table=${table}_nodes_comms_${last_table_num}

echo "last_table: " $last_table

hive -e "insert into table ${database}.${table}_good_nodes partition (level='1') select node, comm_1, '1' from ${database}.${last_table};"

hive --hiveconf database=${database} --hiveconf table=${table} --hiveconf id=${id} --hiveconf latitude=${latitude} --hiveconf longitude=${longitude} --hiveconf dt=${dt} --hiveconf last_table=${last_table} -f join_orig_tracks.sql

python finamic_graph.py ${database} ${table} ${last_table} ${last_table_num}

echo "Done"
