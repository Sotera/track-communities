
import os
import impala

def slurp(filePath):
    # read contents of file to string
    with open(filePath) as x: data = x.read()
    return data

def slurpA(filePath):
    # same as slurp but return Array of lines instead of string
    with open(filePath) as x: data = x.read().splitlines()
    return data

def spit(filePath, data, overwrite=False):
    # write all contents to a file
    mode= 'w' if overwrite else 'a'
    with open(filePath, mode) as x: x.write(data)

def exists(filePath):
    return os.path.exists(filePath)

class impalaopen(object):
    
    def __init__(self, host):
        self.client = None
        self.host = host

    def __enter__(self):
        self.client = impala.ImpalaBeeswaxClient(self.host)
        self.client.connect()
        return self.client

    def __exit__(self, type, value, traceback):
        self.client.close_connection()
