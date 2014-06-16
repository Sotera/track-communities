Track Communities
===================

> Providing data analysts a platform to explore communities of co-occurring tracks (or paths) of movement.

---

Aggregate your track information into communities of geospatial and temporal co-occurrence, visualize those tracks on a geographic map, and observe where and when inferred tracks of movement cross paths.

<br/> ![Track Communities UI](https://raw.githubusercontent.com/Sotera/track-communities/master/docs/track-communities-example.png) <br/> <br/>

This tool is a synthesis of several analytic components and visualization techniques that allow a user to browse a network of communities, follow tracks of movement, and observe co-location highlights within a dynamic graph.

## What Do You Provide? ##
A collection of independent entries that represent an identified object's geographic location at a given point in time.

	Key Data Fields [ ID, TIMESTAMP, LATITUDE, LONGITUDE ]

Specific formatting and analytic tool configurations for using your own data set(s) is provided within the **[wiki](https://github.com/Sotera/track-communities/wiki/)**.

## What Does This Do?
1. Utilizes **[Aggregate Micro Paths](http://sotera.github.io/aggregate-micro-paths/)** to infer movement patterns based on given geo-temporal data and build tracks (or paths) of movement for each unique object in your collection.
2. Determine spacial and temporal co-occurrence for your objects based off the inferred movement patterns.
3. Produce a graph object where relationships are based off the (configurable) definition of geospatial and temporal co-occurrence.
4. Scales the data with **[Distributed Louvain Modularity](http://sotera.github.io/distributed-louvain-modularity/)**, building hierarchical levels of community that can be browsed and visualized as a series of expanding networks of community.
5. Constructs dynamic graph data to help highlight specific tracks of movement and the co-occurrence events in a given geo-temporal frame.
6. Provides a visualization tool that allows a user to browse aggregated networks of communities, follow tracks of movement on a map, and observe co-location highlights in the form of a dynamic graph.

## What Do You Need To Know? ##
In order to utilize your own data sets, some knowledge of the following aspects will be required:
* **[Apache Hive](http://hive.apache.org/)** syntax
* **[Python programming language](https://www.python.org/)**

## Easy Start

Get Track Communities up and running with example data quickly and easily!  Read how at the **[wiki](https://github.com/Sotera/track-communities/wiki/)**.
