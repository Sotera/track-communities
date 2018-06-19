use ${hiveconf:database};
drop table ${hiveconf:table}_nodes_comms_${hiveconf:level}_single;
create external table ${hiveconf:table}_nodes_comms_${hiveconf:level}_single
(
node string,
comm_${hiveconf:level} string
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
location '/tmp/trackcomms/${hiveconf:table}/output/${hiveconf:ga}/comm_${hiveconf:level}/';

drop table ${hiveconf:table}_nodes_comms_${hiveconf:level};
create table ${hiveconf:table}_nodes_comms_${hiveconf:level} as
select a.*, b.comm_${hiveconf:level} as comm_${hiveconf:level}
from ${hiveconf:table}_nodes_comms_${hiveconf:last_level} a join ${hiveconf:table}_nodes_comms_${hiveconf:level}_single b
on (a.comm_${hiveconf:last_level} = b.node);

drop table ${hiveconf:table}_nodes_comms_${hiveconf:level}_single;
drop table ${hiveconf:table}_nodes_comms_${hiveconf:last_level};
