Track Communities
===================
This analytic assigns relationships between tracks based on (a configurable definition of) geospatial and temporal co-occurrence.

It then runs [Distributed Louvain Modularity](http://sotera.github.io/distributed-louvain-modularity/) on the aggregated network of constructed relationships to allow analysis of tracks within communities.  A web-based tool is provided to browse the network/s of communities, view them on a map, and observe co-location highlights within a dynamic graph.

![Track Communities UI](https://raw.githubusercontent.com/Sotera/track-communities/master/docs/track-communities-example.png)

## Prerequisites
*	Install Vagrant: http://www.vagrantup.com
*	Install Virtual Box: https://www.virtualbox.org/wiki/Downloads
*	Download VM (xdata-0.1.box) <br/>
  https://drive.google.com/uc?id=0B54T370AV5JDUEF3T21qWXRpeEU&export=download <br/>
  _Note: Use IE / Firefox. Chrome fails at the end of the download._

## Getting Started

##### Load VM into Vagrant
_Note: Version is currently === 0.1_ <br/>
1.  [change directory to where you placed xdata-0.1.box]

2.	> vagrant box add xdata-vm-[version] xdata-0.1.box

3.  create "VM_Home" directory to store local VM files (ex: C:\Users\<your home directory\Documents\VMs\xdata-vm\)]

4.	> cd "VM_Home" directory

5.	> vagrant init xdata-vm-[version]


##### Option A: Use Vagrant Provisioning


##### Option B: Use Manual Installation

## Customization
TODO

