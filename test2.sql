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

