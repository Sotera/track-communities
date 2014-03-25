#!/usr/bin/env bash 

set -e 

# This value should match the table value in the .ini file
ini_file=$1


#aggregate-micro-paths location
AMP=/srv/software/aggregate-micro-paths
#track-communities
TRACK_COMMS=/srv/software/track-communities
#distributed-louvain-modularity
LOUVAIN=/srv/software/distributed-louvain-modularity

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
hive -hiveconf ts=${temporal_split} -hiveconf table=${table} -f query.sql

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
if [ -a garbage.out]; then
    rm garbage.out
fi

last_table=${table}_nodes_comms_${last_table_num}

hive -hiveconf table=${table} -hiveconf id=${id} -hiveconf latitude=${latitude} -hiveconf longitude=${longitude} -hiveconf dt=${dt} -hiveconf last_table=${last_table} -f join_orig_tracks.sql

python finamic_graph.py ${table} ${last_table} ${last_table_num}

echo "Done"
