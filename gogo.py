import os

i = 1

output = open('goodgraph.out','w')

while os.path.exists('./louvain_to_gephi/community_itr_' + str(i) + '.nodes'):
  comms = open('./louvain_to_gephi/community_itr_' + str(i) + '.nodes','r')
  comm_hash = {}
  for line in comms:
    node, comm = line.strip().split('\t')
    comm_hash[node] = comm

  edges = open('./louvain_to_gephi/graph_itr_' + str(i-1) + '.edges','r')
  for line in edges:
    source,target,weight = line.strip().split('\t')
    output.write('\t'.join((source,comm_hash[source],target,comm_hash[target],weight,str(i),'\n')))
  i = i + 1
