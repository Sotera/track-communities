Track Communities
===================
This tool is a synthesis of analytic components and visualization techniques that allow a user to browse a network of communities based on geo-temporal co-occurence, follow tracks of movement, and observe co-location highlights within a dynamic graph.

![Track Communities UI](https://raw.githubusercontent.com/Sotera/track-communities/master/docs/track-communities-example.png)

## What Does It Do?
1. Utilizes **[Aggregate Micro Paths](http://sotera.github.io/aggregate-micro-paths/)** to infer movement patterns based on given geo-temporal data.  This produces a graph object that has constructed relationships based off of a configurable definition of geospatial and temporal co-occurence from the inferred tracks of movement.
2. Scales the data with **[Distributed Louvain Modularity](http://sotera.github.io/distributed-louvain-modularity/)**, building hierachical levels of community that can be browsed and visualized as a series of expanding networks of community.
3. Constructs dynamic graph data to help highlight specific tracks of movement and the co-occurence events in a given geo-temporal frame.
4. Provides a visualization tool that allows a user to browse aggregated networks of communities, follow tracks of movement on a map, and observe co-location highlights in the form of a dynamic graph.

## Easy Start

##### Prerequisites
*	Install Vagrant:                   http://www.vagrantup.com
*	Install Virtual Box:               https://www.virtualbox.org/wiki/Downloads
*	Download XDATA VM (xdata-0.1.box): http://sotera.github.io/xdata-vm/ <br/>
  _Note: Use IE / Firefox. Chrome fails at the end of the download._

##### Load VM into Vagrant
_Note: Version is currently === 0.1_


1. Add the XDATA VM box definition to Vagrant.


    $ vagrant box add  &nbsp;&nbsp;&nbsp; xdata-vm-**[version]**  &nbsp;&nbsp;&nbsp; **[path_to_file]**\xdata-0.1.box

2. Create a location for hosting your VM files.


    $ mkdir **[path_to_virtual_machines_home]**\xdata-vm-**[version]**
    
    
3. Initialize a new VM based on the XDATA VM box configuration.


    $ cd **[path_to_virtual_machines_home]**\xdata-vm-**[version]** <br/>
    $ vagrant init xdata-vm-**[version]**

##### Install Project Components

_Note: xdata-vm-0.2.box release should have these pre-loaded for you._

###### Option A: Use Vagrant Provisioning
There is a folder called 'vagrant' within this project.  Copy the contents of the folder to the location of your vagrant initialization (above).

###### Option B: Use Manual Installation
See the XDATA Installation .docx AND/OR .txt file included within project for details on manual installation of required components.

##### Additional Configurations

Start your virtual machine.
```    
    $ vagrant up
```
SSH into the VM as _bigdata_, then edit the following configuration file to add additional properties.  These configuration changes should allow you to protect your single VM machine from memory and node count issues that may crop up processing example data in later steps.
```
    $ vi /etc/hadoop/conf/mapred-site.xml
    
    <property>
      <name>mapred.child.java.opts</name>
      <value>-Xmx1024m</value>
    </property>

    <property>
        <name>mapred.tasktracker.map.tasks.maximum</name>
        <value>3</value>
    </property>
    
    <property>
        <name>mapred.tasktracker.reducer.tasks.maximum</name>
        <value>3</value>
    </property>

```
Stop your virtual machine.
```
    $ vagrant halt
```

## Example Code / Customization
TODO

