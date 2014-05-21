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

Read additional info at the [wiki](https://github.com/Sotera/track-communities/wiki/Easy-Start).
