
import os

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

