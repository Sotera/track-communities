import sys

for line in sys.stdin:
  x,y,dt,links = line.strip().split('\t')
  links = eval(links)
  for source in links:
    i = 0
    while i < len(links):
      if source != links[i]:
        print '\t'.join((x,y,dt,source, links[i]))
      i = i + 1
