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
    'impyla'
  ],
  license='Apache License, Version 2.0'
)
