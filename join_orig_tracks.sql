drop table ${hiveconf:table}_tracks_comms_joined;
create table ${hiveconf:table}_tracks_comms_joined as
select a.${hiveconf:latitude} as intersectx, a.${hiveconf:longitude} as intersecty, a.${hiveconf:dt} as dt, a.${hiveconf:id} as track_id, b.*
from ${hiveconf:table} a join ${hiveconf:last_table} b on (a.${hiveconf:id} = b.node);

