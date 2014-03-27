drop table ${hiveconf:table}_nodes_comms_1;
create external table ${hiveconf:table}_nodes_comms_1
(
node string,
comm_1 string
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
location '/tmp/trackcomms/${hiveconf:table}/output/giraph_1/';

drop table ${hiveconf:table}_good_nodes;
create table ${hiveconf:table}_good_nodes(
node string,
comm string,
num_members string
)
PARTITIONED BY (level string)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t';

drop table ${hiveconf:table}_good_graph;
create external table ${hiveconf:table}_good_graph
(
source string,
source_comm string,
target string,
target_comm string,
weight string,
level string
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
location '/tmp/trackcomms/${hiveconf:table}/output/graph/';

