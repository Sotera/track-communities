f = open('output','r')
o = open('nodes.tsv','w')

for line in f:
  vals = line.split('\t')
  o.write(vals[0].strip() + '\t' + vals[1].strip() + '\n')
f.close()
o.close()
