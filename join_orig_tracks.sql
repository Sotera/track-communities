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

drop table ${hiveconf:table}_dynamic_graph_w_comms;
create table ${hiveconf:table}_dynamic_graph_w_comms as
select a.source, b.comm, a.destination, a.firstdate, a.lastdate, a.value
from ${hiveconf:table}_dynamic_graph a join nodes_comms b on (a.source = b.node);

drop table ${hiveconf:table}_dynamic_graph_w_comms_final;
create table ${hiveconf:table}_dynamic_graph_w_comms_final as
select a.source, a.comm as sourcecomm, a.destination, b.comm as destcomm, a.firstdate, a.lastdate, a.value
from ${hiveconf:table}_dynamic_graph_w_comms a join nodes_comms b on (a.destination = b.node);

drop table ${hiveconf:table}_dynamic_graph_w_comms;

