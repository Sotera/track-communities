import sys

nodes = {}
f = open('network_edges.tsv','r')
for line in f:
  source, target, weight = line.strip().split('\t')
  if nodes.get(source) == None:
    nodes[source] = target + ':' + weight
  else:
    nodes[source] =  nodes[source] + ',' + target + ':' + weight

out = open('edgelist.tsv','w')
for key in nodes.keys():
  out.write(key + '\t0\t' + nodes[key] + '\n')
