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
GIRAPH=$ROOT/distributed-graph-analytics/dga-giraph

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

if hadoop fs -test -d /tmp/trackcomms/${table}/output/giraph; then
    hadoop fs -rm -r -skipTrash /tmp/trackcomms/${table}/output/giraph
fi

cd $GIRAPH
./bin/dga-mr1-giraph louvain /user/hive/warehouse/${database}.db/${table}_network_edges /tmp/trackcomms/${table}/output/giraph -ca simple.edge.delimiter='\x01'

cd $TRACK_COMMS
if [ -d output/giraph ]; then
    rm -Rf output/giraph
fi

mkdir -p output/giraph
hadoop fs -get /tmp/trackcomms/${table}/output/giraph/* output/giraph

if [ -d louvain_to_gephi/giraph ]; then
    rm -Rf louvain_to_gephi/giraph
fi

mkdir -p louvain_to_gephi/giraph

hive -e "select * from ${database}.${table}_edgelist;" > edgelist.tsv
python louvain_to_gephi_giraph.py ${table}

python gogo.py giraph

if hadoop fs -test -d /tmp/trackcomms/${table}/output/giraph/graph; then
    hadoop fs -rm -r -skipTrash /tmp/trackcomms/${table}/output/giraph/graph
fi

hadoop fs -mkdir /tmp/trackcomms/${table}/output/giraph/graph
hadoop fs -put goodgraph.out /tmp/trackcomms/${table}/output/giraph/graph

if hadoop fs -test -e /tmp/trackcomms/${table}/output/giraph/giraph_0/_logs; then
    hadoop fs -rm -r -skipTrash /tmp/trackcomms/${table}/output/giraph/giraph_0/_logs
fi 

if hadoop fs -test -e /tmp/trackcomms/${table}/output/giraph/giraph_0/_SUCCESS; then
    hadoop fs -rm -r -skipTrash /tmp/trackcomms/${table}/output/giraph/giraph_0/_SUCCESS
fi 

if hadoop fs -test -d /tmp/trackcomms/${table}/output/giraph/comm; then
    hadoop fs -rm -r -skipTrash /tmp/trackcomms/${table}/output/giraph/comm
fi

hive --hiveconf database=${database} --hiveconf table=${table} --hiveconf ga=giraph -f nodes_comms.sql

last_table_num=`python comm_mapping_giraph.py ${table} giraph`
if [ -a garbage.out ]; then
    rm garbage.out
fi

last_table=${table}_nodes_comms_${last_table_num}

hive -e "insert into table ${database}.${table}_good_nodes partition (level='1') select node, comm_1, '1' from ${database}.${last_table};"

hive --hiveconf database=${database} --hiveconf table=${table} --hiveconf id=${id} --hiveconf latitude=${latitude} --hiveconf longitude=${longitude} --hiveconf dt=${dt} --hiveconf last_table=${last_table} -f join_orig_tracks.sql

python finamic_graph.py ${database} ${table} ${last_table} ${last_table_num}

echo "Done"
