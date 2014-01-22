drop table ${hiveconf:table}_network_test;
create table ${hiveconf:table}_network_test
(
source string,
target string,
distance double
);

add file test.py;

from (select  micro_path_tripline_bins_${hiveconf:table}.intersectX, micro_path_tripline_bins_${hiveconf:table}.intersectY, micro_path_tripline_bins_${hiveconf:table}.track_id, micro_path_tripline_bins_${hiveconf:table}.dt
from  micro_path_tripline_bins_${hiveconf:table}
distribute by  micro_path_tripline_bins_${hiveconf:table}.track_id
sort by micro_path_tripline_bins_${hiveconf:table}.track_id, micro_path_tripline_bins_${hiveconf:table}.dt asc
) m

insert overwrite table ${hiveconf:table}_network_test
select transform(m.intersectX,m.intersectY,m.track_id)
using 'python test.py'
as source, target, distance;


drop table ${hiveconf:table}_gotime;
create table ${hiveconf:table}_gotime as
select source, target, count(*) count, avg(distance) as distance from ${hiveconf:table}_network_test group by source, target;

drop table ${hiveconf:table}_nodes;
create table ${hiveconf:table}_nodes as
select a.id, sum(a.outdegree) as outdegree, sum(a.indegree) as indegree, split(a.id,'_')[0] as latitude,
split(a.id,'_')[1] as longitude
from
(select source as id, sum(count) as outdegree, 0 as indegree
from ${hiveconf:table}_gotime
group by source
union all
select target as id, 0 as outdegree, sum(count) as indegree
from ${hiveconf:table}_gotime
group by target) a
group by a.id,  split(a.id,'_')[0], split(a.id,'_')[1];

