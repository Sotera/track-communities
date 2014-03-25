import sys

nodes = {}
lastsource = None
for line in sys.stdin:
  source, target, weight = line.strip().split('\t')
  if lastsource == None or lastsource == source:
    if nodes.get(source) == None:
      nodes[source] = target + ':' + weight
    else:
      nodes[source] =  nodes[source] + ',' + target + ':' + weight
  else:
    for key in nodes.keys():
      print key + '\t0\t' + nodes[key]
    nodes = {}
    nodes[source] = target + ':' + weight
  lastsource = source

for key in nodes.keys():
  print key + '\t0\t' + nodes[key]

