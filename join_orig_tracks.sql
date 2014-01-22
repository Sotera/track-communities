drop table ${hiveconf:table}_tracks_comms_joined;
create table ${hiveconf:table}_tracks_comms_joined 
(
intersectx string,
intersecty string,
dt string,
track_id string,
comm string
);

insert overwrite table ${hiveconf:table}_tracks_comms_joined 
select a.${hiveconf:latitude}, a.${hiveconf:longitude}, a.${hiveconf:dt}, a.${hiveconf:id}, b.comm
from ${hiveconf:table} a join nodes_comms b on (a.${hiveconf:id} = b.node);
