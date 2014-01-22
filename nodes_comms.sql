drop table nodes_comms;
create external table nodes_comms
(
node string,
comm string
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
location '/tmp/trackcomms/${hiveconf:table}/nodes/';

