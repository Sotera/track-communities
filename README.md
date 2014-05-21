Track Communities
===================
This tool is a synthesis of analytic components and visualization techniques that allow a user to browse a network of communities based on geo-temporal co-occurence, follow tracks of movement, and observe co-location highlights within a dynamic graph.

![Track Communities UI](https://raw.githubusercontent.com/Sotera/track-communities/master/docs/track-communities-example.png)

## What Does It Do?
1. Utilizes **[Aggregate Micro Paths](http://sotera.github.io/aggregate-micro-paths/)** to infer movement patterns based on given geo-temporal data.  This produces a graph object that has constructed relationships based off of a configurable definition of geospatial and temporal co-occurence from the inferred tracks of movement.
2. Scales the data with **[Distributed Louvain Modularity](http://sotera.github.io/distributed-louvain-modularity/)**, building hierachical levels of community that can be browsed and visualized as a series of expanding networks of community.
3. Constructs dynamic graph data to help highlight specific tracks of movement and the co-occurence events in a given geo-temporal frame.
4. Provides a visualization tool that allows a user to browse aggregated networks of communities, follow tracks of movement on a map, and observe co-location highlights in the form of a dynamic graph.

## Getting Started

##### Prerequisites
*	Install Vagrant: http://www.vagrantup.com
*	Install Virtual Box: https://www.virtualbox.org/wiki/Downloads
*	Download VM (xdata-0.1.box): http://sotera.github.io/xdata-vm/ <br/>
  https://drive.google.com/uc?id=0B54T370AV5JDUEF3T21qWXRpeEU&export=download <br/>
  _Note: Use IE / Firefox. Chrome fails at the end of the download._

##### Load VM into Vagrant
_Note: Version is currently === 0.1_

1. [change directory to where you placed xdata-0.1.box]
2. $ vagrant box add xdata-vm-[version] xdata-0.1.box
3. [create "VM_Home" directory to store local VM files (ex: C:\Users\<your home directory\Documents\VMs\xdata-vm\)]
4. [change directory to your "VM_HOME" directory]
5. $ vagrant init xdata-vm-[version]

##### Option A: Use Vagrant Provisioning
TODO

##### Option B: Use Manual Installation
TODO

## Example Code / Customization
TODO

