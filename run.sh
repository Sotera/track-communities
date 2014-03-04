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

hive -e "select * from ${table}_network_edges;" > network_edges.tsv

python edgelist.py

hadoop fs -rm /tmp/trackcomms/${table}/input/*
hadoop fs -rm /tmp/trackcomms/${table}/output/*
hadoop fs -mkdir /tmp/trackcomms/${table}/input
hadoop fs -mkdir /tmp/trackcomms/${table}/output

hadoop fs -put edgelist.tsv /tmp/trackcomms/${table}/input/

cd ../distributed-louvain-modularity
python louvain.py /tmp/trackcomms/${table}/input /tmp/trackcomms/${table}/output

cd ../track-communities
rm -Rf output
hadoop fs -get /tmp/trackcomms/${table}/output .

cd output

cd giraph_1
cat part* > output
python ../../getnodes.py
mv nodes.tsv ../../
cd ../../

hadoop fs -rm /tmp/trackcomms/${table}/nodes/*
hadoop fs -mkdir /tmp/trackcomms/${table}/nodes/
hadoop fs -put nodes.tsv /tmp/trackcomms/${table}/nodes/
hive -hiveconf table=${table} -f nodes_comms.sql
hive -hiveconf table=${table} -hiveconf id=${id} -hiveconf latitude=${latitude} -hiveconf longitude=${longitude} -hiveconf dt=${dt} -f join_orig_tracks.sql

echo -e "id\tcomm" | cat - nodes.tsv > nodes.txt
rm nodes.tsv
mv nodes.txt nodes.tsv

echo -e "source\ttarget\tweight" | cat - network_edges.tsv > network_edges.txt
rm network_edges.tsv
mv network_edges.txt network_edges.tsv

echo -e "latitude\tlongitude\tdt\ttrackid\tcomm" > ${table}_tracks_comms_joined.csv
hive -e "select * from ${table}_tracks_comms_joined;" >> ${table}_tracks_comms_joined.csv
echo "DONE!!"
