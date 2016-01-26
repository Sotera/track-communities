#
# Copyright 2016 Sotera Defense Solutions Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License”);
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import sys
import datetime
from datetime import datetime,timedelta


def formatTime(newtime):
  global ts
  mins = 0
  if ts == 'minute':
    nextrowtime = datetime.strptime(newtime, '%Y-%m-%d %H:%M:%S') + timedelta(minutes=1)
    nt = nextrowtime.replace(second=0, microsecond=0).strftime('%Y-%m-%d %H:%M:%S')
  elif ts == '10min':
    nextrowtime = datetime.strptime(newtime, '%Y-%m-%d %H:%M:%S') + timedelta(minutes=10)
    nt = nextrowtime.replace(minute=(nextrowtime.minute - (nextrowtime.minute % 10)), second=0, microsecond=0).strftime('%Y-%m-%d %H:%M:%S')
  elif ts == 'hour':
    nextrowtime = datetime.strptime(newtime, '%Y-%m-%d %H:%M:%S') + timedelta(minutes=60)
    nt = nextrowtime.replace(minute=0, second=0, microsecond=0).strftime('%Y-%m-%d %H:%M:%S')
  elif ts == 'day':
    nextrowtime = datetime.strptime(newtime, '%Y-%m-%d %H:%M:%S') + timedelta(days=1)
    nt = nextrowtime.replace(hour=0, minute=0, second=0, microsecond=0).strftime('%Y-%m-%d %H:%M:%S')
  elif ts == 'month':
    nextrowtime = datetime.strptime(newtime, '%Y-%m-%d %H:%M:%S') + timedelta(days=31)
    nt = nextrowtime.replace(day=1, hour=0, minute=0, second=0, microsecond=0).strftime('%Y-%m-%d %H:%M:%S')
  elif ts == 'year':
    nextrowtime = datetime.strptime(newtime, '%Y-%m-%d %H:%M:%S') + timedelta(days=365)
    nt = nextrowtime.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0).strftime('%Y-%m-%d %H:%M:%S')
  # Need to think about this.
  # elif ts == 'all':
  #  nextrowtime = datetime.strptime(newtime, '%Y-%m-%d %H:%M:%S') + timedelta(days=365)
  #  nt = nextrowtime.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0).strftime('%Y-%m-%d %H:%M:%S')
  return nt

ts = sys.argv.pop()
lastvalue = lastsource = lastdest = lasttime = firsttracktime = lasttracktime = None


for line in sys.stdin:
  dt,source,dest = line.split('\t')
  dest = dest.strip() 
  dt_parse = datetime.strptime(dt, '%Y-%m-%d %H:%M:%S')

  if lastsource == None:
    lastsource = source
    lastdest = dest
    lasttime = dt
    firsttracktime = dt
    lasttracktime = dt
    lastvalue = 1
    continue

  nt = formatTime(lasttime)

  if lastsource == source and lastdest == dest:

    if nt == dt or lasttime == dt:
      lasttime = dt
      lasttracktime = dt
      lastvalue = lastvalue + 1
      continue
    else:
      if lasttracktime != None:
        #print "1\n"
        print '\t'.join((source,dest,firsttracktime,nt,str(lastvalue))) 
        firsttracktime = dt
        lasttime = dt
        lasttracktime = None
        lastvalue = 1
        continue
      else:
        # Needs to change
        #print "2\n"
        print '\t'.join((source,dest,firsttracktime,nt,str(lastvalue))) 
        firsttracktime = dt
        lasttime = dt
        lasttracktime = None
        lastvalue = 1
        continue
  else:
    if lasttracktime != None:
      #print "3\n"
      print '\t'.join((lastsource,lastdest,firsttracktime,nt,str(lastvalue))) 
    else:
      # Needs to change
      #print "4\n"
      print '\t'.join((lastsource,lastdest,firsttracktime,nt,str(lastvalue))) 
    firsttracktime = dt
    lasttime = dt
    lasttracktime = None 
    lastsource = source
    lastdest = dest 
    lastvalue = 1
    continue

nt = formatTime(lasttime)
print '\t'.join((lastsource,lastdest,firsttracktime,nt,str(lastvalue)))
