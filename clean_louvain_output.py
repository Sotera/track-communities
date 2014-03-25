import os

i = 1
pm = 'louvain_to_gephi/community_itr_'

while os.path.exists(pm + str(i) + '.nodes'):
  f = open(pm + str(i) + '.nodes', 'r')
  o = open(pm + str(i) + '_w_level.nodes.l' , 'w')
  for line in f:
    o.write(line.strip() + '\t' + str(i) + '\n')
  o.close()
  f.close()
  i = i + 1
