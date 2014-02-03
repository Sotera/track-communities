from setuptools import setup, find_packages

setup(
  name='commserver',
  version='0.1',
  description='Simple Server linking Louvain Modularity Output with Aggregate Micropathing Output',
  long_description='Simple Server linking Louvain Modularity Output with Aggregate Micropathing Output',
  author='Justin Gawrilow',
  author_email='justin.gawrilow@soteradefense.com',
  url='',
  packages=find_packages(),
  scripts = ['go.py'],
  keywords='louvain',
  install_requires=[
    'bottle',
  ],
  license='Apache License, Version 2.0'
)
