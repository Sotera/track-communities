# This value should match the table value in the .ini file
ini_file=$1

table=$(sed -n 's/.*table_name *: *\([^ ]*.*\)/\1/p' < ../aggregate-micro-paths/hive-streaming/conf/${ini_file})
id=$(sed -n 's/.*table_schema_id *: *\([^ ]*.*\)/\1/p' < ../aggregate-micro-paths/hive-streaming/conf/${ini_file})
latitude=$(sed -n 's/.*table_schema_lat *: *\([^ ]*.*\)/\1/p' < ../aggregate-micro-paths/hive-streaming/conf/${ini_file})
longitude=$(sed -n 's/.*table_schema_lon *: *\([^ ]*.*\)/\1/p' < ../aggregate-micro-paths/hive-streaming/conf/${ini_file})
dt=$(sed -n 's/.*table_schema_dt *: *\([^ ]*.*\)/\1/p' < ../aggregate-micro-paths/hive-streaming/conf/${ini_file})
temporal_split=$(sed -n 's/.*temporal_split *: *\([^ ]*.*\)/\1/p' < ../aggregate-micro-paths/hive-streaming/conf/${ini_file})

# 1st Run Triplines
cd ../aggregate-micro-paths/hive-streaming
python AggregateMicroPath.py -c ${ini_file}

cd ../../track-communities
hive -hiveconf ts=${temporal_split} -hiveconf table=${table} -f query.sql

hadoop fs -rm -r /tmp/trackcomms/${table}/output
hadoop fs -mkdir /tmp/trackcomms/${table}/output

cd ../distributed-louvain-modularity
python louvain.py /user/hive/warehouse/${table}_edgelist /tmp/trackcomms/${table}/output

cd ../track-communities
rm -Rf output
hadoop fs -get /tmp/trackcomms/${table}/output .

rm -Rf louvain_to_gephi
hive -e "select * from ${table}_edgelist;" > edgelist.tsv
python louvain_to_gephi.py

python gogo.py
hadoop fs -rm -r /tmp/trackcomms/${table}/output/graph
hadoop fs -mkdir /tmp/trackcomms/${table}/output/graph
hadoop fs -put goodgraph.out /tmp/trackcomms/${table}/output/graph

hadoop fs -rm -r /tmp/trackcomms/${table}/output/giraph_1/_logs
hadoop fs -rm -r /tmp/trackcomms/${table}/output/giraph_1/_SUCCESS
hive -hiveconf table=${table} -f nodes_comms.sql

last_table_num=`python comm_mapping.py ${table}`
rm garbage.out

last_table=${table}_nodes_comms_${last_table_num}

hive -hiveconf table=${table} -hiveconf id=${id} -hiveconf latitude=${latitude} -hiveconf longitude=${longitude} -hiveconf dt=${dt} -hiveconf last_table=${last_table} -f join_orig_tracks.sql

python finamic_graph.py ${table} ${last_table} ${last_table_num}

echo "DONE!!"
