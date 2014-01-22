drop table ${hiveconf:table}_tracks_comms_joined;
create table ${hiveconf:table}_tracks_comms_joined as 
select a.intersectx, a.intersecty, a.dt, a.track_id, b.comm
from micro_path_tripline_bins_${hiveconf:table} a join nodes_comms b on (a.track_id = b.node);
