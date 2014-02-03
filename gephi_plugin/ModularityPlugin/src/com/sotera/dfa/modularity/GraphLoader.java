
package com.sotera.dfa.modularity;


import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.Stack;
import javax.swing.JComboBox;
import javax.swing.JSlider;
import javax.swing.SwingUtilities;
import org.gephi.graph.api.Edge;
import org.gephi.graph.api.Graph;
import org.gephi.graph.api.GraphController;
import org.gephi.graph.api.GraphModel;
import org.gephi.graph.api.Node;
import org.gephi.project.api.ProjectController;
import org.gephi.utils.longtask.spi.LongTask;
import org.gephi.utils.progress.ProgressTicket;
import org.openide.util.Exceptions;
import org.openide.util.Lookup;

/**
 *
 * @author ekimbrel
 */

public class GraphLoader implements LongTask,Runnable{

    
    
    private static GraphLoader instance;
    private static String NO_FILTER_OPTION = "Clear Filters";
    
    private File graphDirectory;
    private int currentViewLevel = -1;
    private Thread worker = new Thread(this);
    private GraphData graphData;
    private String currentFilter;
    private JComboBox filterbox;
    private JSlider zoomslider;
    
    private enum LOADER_STATES{
        UN_INITIALIZED,
        INITIALIZED,
    }
    private LOADER_STATES state;
    
    
    
    class ViewHistory{
        int level;
        String filter;
        
        public ViewHistory(int level, String filter){
            this.level = level;
            this.filter = filter;
        }
    }
    
    Stack<ViewHistory> historyStack = new Stack<ViewHistory>();
    
    
    
    private GraphLoader(){
        // only allow this class to call the constructor.
        state = LOADER_STATES.UN_INITIALIZED;
    }
    
    public static GraphLoader getInstance(){
        if (instance == null){
            instance = new GraphLoader();
        }
        return instance;
    }
  
    
    /**
     * Clear the current work space and start a new one
     * with the highest level graph file.
     * @param file 
     */
    public synchronized void loadNewModularityProject(File file) throws InterruptedException{  
        cancel();
        worker.join(); // wait for any previous worker to finish.
        historyStack.clear();
        graphDirectory = file;
        state = LOADER_STATES.UN_INITIALIZED;
        worker = new Thread(this);
        worker.start();
    }
    
    
    /**
     * Clear any filter and zoom to the specified level
     * @param level
     */
    public synchronized void zoomToLevel(int level){
        if (level <0 || level > graphData.getNumberOfLevels() -1){
            throw new IllegalArgumentException("Invalid level: "+level);
        }
        
        if (currentViewLevel != level){
            cancel();
            historyStack.push(new ViewHistory(currentViewLevel,currentFilter));
            currentViewLevel = level;
            currentFilter = null; // clear filter on zoom
            worker = new Thread(this);
            worker.start();
        }        
        
    }
    
    
    /**
     * Apply a filter to the current level in the graph.
     * @param filter 
     */
    public synchronized void applyFilter(String filter){
        if (currentFilter == null || !currentFilter.equals(filter)){
            historyStack.push(new ViewHistory(currentViewLevel,currentFilter));    
            currentFilter = (NO_FILTER_OPTION.equals(filter)) ? null : filter;
            cancel();
            worker = new Thread(this);
            worker.start();
        }        
    }
    
    
    
    /**
     * Zoom down one level in the graph and apply the filter
     * @param id 
    */
    void drillDownAndFilter(String id) {
        if (currentViewLevel > 0){
          historyStack.push(new ViewHistory(currentViewLevel,currentFilter));
          cancel();
          currentViewLevel = currentViewLevel -1;
          currentFilter = id;
          worker = new Thread(this);
          worker.start();
        }   
    }
     
    
    /**
     * Change to the previous zoom and filter.
     */
    public void back(){
        if (!historyStack.isEmpty()){
            cancel();
            ViewHistory history = historyStack.pop();
            currentViewLevel = history.level;
            currentFilter = history.filter;
            worker = new Thread(this);
            worker.start(); 
        }
        
    }
    
    
    /**
     * Return a graph model, creats a new project if needed.
     * @return  GraphModel
     */
    private GraphModel getGraphModel()
    {
        ProjectController pc = Lookup.getDefault().lookup(ProjectController.class);
        if(pc.getCurrentProject() == null)
        {
            pc.newProject();
        }
        
        //Start by initializing the gra
        GraphModel graphModel = Lookup.getDefault().lookup(GraphController.class).getModel();
        return graphModel;
    }
    
    
    
    /**
     * Manipulate the graph. and / remove nodes and edges.  USE thread.start()
     * as to not block the UI
     */
    @Override
    public void run() {
        
        GraphModel model = getGraphModel();
       
        
        if (LOADER_STATES.UN_INITIALIZED == state){
            try {
                // load the current view level into the graph        
               graphData = new GraphData(this.graphDirectory,model.factory()); 
            } catch (IOException ex) {
                Exceptions.printStackTrace(ex);
            }
            currentViewLevel = graphData.getNumberOfLevels()-1;
            currentFilter = null;
            state = LOADER_STATES.INITIALIZED;
        } 
       
        
        Graph grph = model.getGraph();
        grph.clear();
        List<Node> nodes = graphData.getNodes(model.factory(), currentViewLevel, currentFilter);
        for (Node n : nodes){
            if (Thread.interrupted()){
                return;
            }   
            grph.addNode(n);
        }
            
        List<Edge> edges = graphData.getEdges(model,currentViewLevel, this.currentFilter);
        for (Edge e : edges){
            if (Thread.interrupted()){
                return;
            }
            grph.addEdge(e);
        }  
  
        updateUILevel();   
    }

    
   
    
    // SHOULD USE CALL BACKS INSTEAD OF HAVING REFERNCE TO UI COMPONMENTS.
    
    public void setFilterBox( JComboBox filterbox){
        this.filterbox = filterbox;
    }
    
    public void setZoomSlider( JSlider zoomslider){
        this.zoomslider = zoomslider;
    }
    
    
    /**
     * Update UI controls for the current level and filter.
     */
    private void updateUILevel(){
        
        
     final int level = this.currentViewLevel;  
     final String filter = this.currentFilter;
     final int numberOfLevels = graphData.getNumberOfLevels();
     
     
     SwingUtilities.invokeLater(new Runnable() {
                @Override
                    public void run() {
                        Set<String> options = graphData.getFilterOptions(level);
                        String[] optionsArray = options.toArray(new String[0]);
                        Arrays.sort(optionsArray);
                        String[] foo = new String[optionsArray.length +1];
                        foo[0] = NO_FILTER_OPTION;
                        System.arraycopy(optionsArray, 0, foo, 1, foo.length -1);
                        
                        filterbox.setModel(new JComboBox(foo).getModel());
                        if (null !=filter){
                            filterbox.setSelectedItem(filter);
                        }
                        if ( zoomslider.getMaximum() != numberOfLevels -1){
                            zoomslider.setMaximum(numberOfLevels -1);
                        }
                        zoomslider.setValue(currentViewLevel);
                    }
                });        
    }
    
    
    
    
    /**
     * stop the current worker
     * @return 
     */
    @Override
    public boolean cancel() {    
        if (worker.isAlive()){
            worker.interrupt();
        }
        return true;
    }

    
    
    @Override
    public void setProgressTicket(ProgressTicket pt) {
        throw new UnsupportedOperationException("Not supported yet.");
    }
    
}
