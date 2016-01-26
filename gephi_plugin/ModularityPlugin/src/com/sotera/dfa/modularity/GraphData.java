/*
 *
 *  Licensed to the Apache Software Foundation (ASF) under one
 *  or more contributor license agreements.  See the NOTICE file
 *  distributed with this work for additional information
 *  regarding copyright ownership.  The ASF licenses this file
 *  to you under the Apache License, Version 2.0 (the
 *  "License"); you may not use this file except in compliance
 *  with the License.  You may obtain a copy of the License at
 *       http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */


package com.sotera.dfa.modularity;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FilenameFilter;
import java.io.IOException;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.gephi.graph.api.Edge;
import org.gephi.graph.api.Graph;
import org.gephi.graph.api.GraphFactory;
import org.gephi.graph.api.GraphModel;
import org.gephi.graph.api.Node;
import org.gephi.graph.api.NodeData;

/**
 *
 * @author ekimbrel
 */
public class GraphData {
    
    
    private class SimpleEdge{
        String source;
        String target;
        int weight;
        
        public SimpleEdge(String source, String target, int weight){
            this.source = source;
            this.target = target;
            this.weight = weight;
        }
    }
    
    
    // edges are stored in a map under a key that represents
    // their community.  If the edge has is in two different communites
    // it is stored under this key
    private static String BI_COMMUNITY_EDGE_KEY = 
            "com.sotera.dfa.modularity.BI_COMMUNITY_EDGE_KEY";
    
    
    private static String EDGE_FILENAME =  "graph_itr_LEVEL.edges";
    private static String NODE_FILENAME =  "community_itr_LEVEL.nodes";
    
    // the number of levels viewable in this graph
    private int topLevel = -1;
    
    // for each level of the graph a map of the communites
    // at this level to the nodes in that community.
    private List<Map<String,List<Node>>> nodeLevelMap;
    
    // for each level in the graph a map of the communities at this level
    // to the edges in that community.
    // a specail key is used to keep edges that span two communities.
    private List<Map<String,List<SimpleEdge>>> edgeLevelMap;
    
    
    
    
    public GraphData(File file, GraphFactory factory) throws IOException{
        
        int levels = GraphData.verifyGraphDirectory(file);
        if (-1 == levels ){
            throw new IllegalArgumentException("Invalid Directory");
        }
        
        topLevel = levels-1;
        
        nodeLevelMap = new LinkedList<Map<String,List<Node>>>();
        edgeLevelMap = new LinkedList<Map<String,List<SimpleEdge>>>();  
        
        readGraphData(file,factory);
    }
    
    
    /**
     * Read in the graph data and create all nodes
     * and edges to be used to generate graphs at each level.
     * @param file
     * @param factory 
     */
    private void readGraphData(File file, GraphFactory factory) throws IOException{
        
        this.edgeLevelMap.clear();
        this.nodeLevelMap.clear();
        
        // read in each level
        for (int currentLevel = 0; currentLevel <= topLevel; currentLevel++ ){
            int edgeLevel = currentLevel;
            int nodeLevel = currentLevel + 1 ;
            
            Map<String,List<Node>> nodes = new HashMap<String,List<Node>>();
            Map<String,List<SimpleEdge>> edges = new HashMap<String,List<SimpleEdge>>();
            edges.put(BI_COMMUNITY_EDGE_KEY, new LinkedList<SimpleEdge>());
            
           
            String edgeFile = file.getPath()+"/"+EDGE_FILENAME
                    .replace("LEVEL", Integer.toString(edgeLevel));
            
            // there is no node file for the highest level
            String nodeFile = file.getPath()+"/"+NODE_FILENAME
                    .replace("LEVEL", Integer.toString(nodeLevel));
                    
            
            
            int maxNodeSize = 1;
            int minNodeSize = - 1;
            if (currentLevel > 0){
                for (List<Node> list : nodeLevelMap.get(currentLevel -1).values()){
                    int size =list.size();
                    if (size > maxNodeSize){
                        maxNodeSize = size;
                    }
                    if (size < minNodeSize || minNodeSize == -1){
                        minNodeSize = size;
                    }
                }
                
            }
            
            
            // read in the available communities for this level.
            Map<String,String> nodeCommunities = new HashMap<String,String>();
            Map<String,Node> nodeIdMap = new HashMap<String,Node>();
            if (null != nodeFile){
                BufferedReader in = new BufferedReader(new FileReader(nodeFile));
                
                String line = null;
                while ( (line = in.readLine()) != null){
                    String [] tokens = line.split("\t");
                    nodeCommunities.put(tokens[0], tokens[1]);
                    Node n = factory.newNode(tokens[0]);
                    float size = 1;
                    if (currentLevel > 0){
                        size = nodeLevelMap.get(currentLevel -1).get(tokens[0]).size();
                        size = 1+ ( (size-minNodeSize)/maxNodeSize * 100);
                    }
                   
                    n.getNodeData().setSize(size); // todo, node size.
                    n.getNodeData().getAttributes().setValue("community", tokens[1]);
                    n.getNodeData().getAttributes().setValue("level", currentLevel);
                    if (!nodes.containsKey(tokens[1])){
                        nodes.put(tokens[1], new LinkedList<Node>());
                    }
                    nodes.get(tokens[1]).add(n);
                    nodeIdMap.put(tokens[0],n);
                }
                in.close();
            }
            
            // process the edge file
            BufferedReader in = new BufferedReader(new FileReader(edgeFile));
            String line = null;
            while( (line = in.readLine()) != null ){
                
                 String[] tokens = line.trim().split("\t");
                 String sourceId = tokens[0];
                 String targetId = tokens[1];
                 int weight = Integer.parseInt(tokens[2]);
                 Node source = nodeIdMap.get(sourceId);
                 Node target = nodeIdMap.get(targetId);
                 if (source != null && target != null){
                     
                     //Edge e = factory.newEdge(source,target,1,true);   //TODO edge weights
                     String c1 = nodeCommunities.get(sourceId);
                     String c2 = nodeCommunities.get(targetId);
                     SimpleEdge e = new SimpleEdge(sourceId,targetId,weight);
                     if (null != c1 && c1.equals(c2)){
                         // edges are in the same community
                         if (!edges.containsKey(c1)){
                             edges.put(c1, new LinkedList<SimpleEdge>());
                         }
                         edges.get(c1).add(e);
                     }
                     else{
                         edges.get(BI_COMMUNITY_EDGE_KEY).add(e);
                     }
                 }
                
                
            }
            
            this.edgeLevelMap.add(edges);
            this.nodeLevelMap.add(nodes);
        }
   
        
    }
    
    
    
    /**
     * @return the numberOfLevels
     */
    public int getNumberOfLevels() {
        return topLevel + 1;
    }

    
    
    
    
    /**
     * Checks to see if a directory contains the required files
     * to create a graph data object
     * 
     * if valid returns the highest completed iteration (level)
     * otherwise returns -1
     * @param file
     * @return 
     */
    public static int verifyGraphDirectory(File file){
        
        if (!file.isDirectory()){
            return -1;
        }
        
        FilenameFilter ff = new GraphFileNameFilter();
        String[] files = file.list(ff);
        
        
        if (files.length % 2 != 0) return -1;
        
        boolean[] edgefilespresent = new boolean[files.length/2 +1];
        boolean[] nodefilespresent = new boolean[files.length/2 +1];
        // there shouldnt be a node file for itr_0 so nodefilespresent[0] will remain false
        // there should be an edge file for itr + 1 so edgefiles[edgefiles.length-1] will reamin false
        nodefilespresent[0] = true;
        edgefilespresent[edgefilespresent.length-1] = true;
        
        
        for (String filename : files){
            String ext = filename.substring(filename.length()-6,filename.length());
            String itrStr = filename.substring(0,filename.length() -6)
                   .replace("community_itr_", "")
                   .replace("graph_itr_", "");
           
           
           try{
                int index = Integer.parseInt(itrStr);
                if (".nodes".equals(ext)){
                    nodefilespresent[index] = true;
                }
                else if (".edges".equals(ext)){
                    edgefilespresent[index] = true;
                }
                
           } catch (NumberFormatException e){
               return -1;
           } catch (ArrayIndexOutOfBoundsException ex){
               return -1;
           }
        }
        
        boolean valid = true;
        for (int i = 0; i < nodefilespresent.length ; i++){
            valid = valid && edgefilespresent[i] && nodefilespresent[i];
        }
        
        return (valid) ? nodefilespresent.length -1 : -1;  
    }
    
    
    
    // Filter used to disregard files that do not meet 
    // our pre defined naming convention
    static class GraphFileNameFilter implements FilenameFilter{

        @Override
        public boolean accept(File dir, String filename) {
            String extension = filename.substring(filename.length()-6, filename.length());
            if (!extension.equals(".nodes") && !extension.contains(".edges")){
                return false;
            }
             return filename.startsWith("community_itr_") || filename.startsWith("graph_itr_");             
        }   
    }
    
    
    
    /**
     * Get the list of community filters available at a level
     * @param level
     * @return 
     */
    public Set<String> getFilterOptions(int level){
        if (level < 0 || level > topLevel){
            throw new IllegalArgumentException("Invalid level: "+level+" max: "+topLevel);
        }
        return nodeLevelMap.get(level).keySet();
    }
    
    
    /**
     * Return a list of nodes at a given level
     * @param level
     * @param communityFilter
     * @return 
     */
    public List<Node> getNodes(GraphFactory factory, int level,String communityFilter){
       if (level < 0 || level > topLevel){
            throw new IllegalArgumentException("Invalid level: "+level+" max: "+topLevel);
        }
       
        // create a list of selected nodes
        List<Node> selectedNodes = new LinkedList<Node>();
        Set<String> keyset = null;
        if (null == communityFilter){
            keyset = nodeLevelMap.get(level).keySet();
        }
        else{
            keyset = new TreeSet<String>();
            keyset.add(communityFilter);
        }
           
            
        for (String community : keyset){
            List<Node> nodes = nodeLevelMap.get(level).get(community);
            List<Node> newnodes = new LinkedList<Node>();
            
            // for each node in the set create a new node to be displayed on the graph
            // we then replace the old nodes in the data structure with the new ones.
            
            // We have to do this because when graph.clear is called the old nodes become
            // invalid.
            
            for (Node node : nodes){
                NodeData data = node.getNodeData();
                Node newnode = factory.newNode(node.getNodeData().getId());
                newnode.getNodeData().setColor(data.r(),data.g(),data.b());
                newnode.getNodeData().setSize(node.getNodeData().getSize()); 
                newnode.getNodeData().getAttributes().setValue("community", data.getAttributes().getValue("community"));
                newnode.getNodeData().setX(data.x());
                newnode.getNodeData().setY(data.y());
                //newnode.getNodeData().setColor(255, 0, 0);
                newnodes.add(newnode);
                selectedNodes.add(newnode);
            }
            nodeLevelMap.get(level).put(community, newnodes);      
        }
        return selectedNodes;
       
    }
    
    
    /**
     * Return a list of edges at a given level
     * @param level
     * @param communityFilter
     * @return 
     */
    
    public List<Edge> getEdges(GraphModel model, int level, String communityFilter){
        if (level < 0 || level > topLevel){
            throw new IllegalArgumentException("Invalid level: "+level+" max: "+topLevel);
        }
       
        Graph graph = model.getGraph();
        GraphFactory factory = model.factory();
        
       if (null != communityFilter){
           List<SimpleEdge> simpleEdges = edgeLevelMap.get(level).get(communityFilter);
           List<Edge> edges = new LinkedList<Edge>();
           for (SimpleEdge se : simpleEdges){
               Node source = graph.getNode(se.source);
               Node target = graph.getNode(se.target);
               edges.add(factory.newEdge(source, target,se.weight,true));
           }
           return edges;
       }
       
       else{
           // create a list of all nodes
           Collection<List<SimpleEdge>> values = edgeLevelMap.get(level).values();
           List<Edge> edgeList = new LinkedList<Edge>();
           for (List<SimpleEdge> list : values){
               for (SimpleEdge se : list){
                   Node source = graph.getNode(se.source);
                   Node target = graph.getNode(se.target);
                   edgeList.add(factory.newEdge(source, target,se.weight,true));
              } 
               
           }
           return edgeList;
       }
    }
    
    
    
    
    
    
    
    
}
