/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.sotera.dfa.modularity;

import java.awt.Color;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;

import java.net.MalformedURLException;

import javax.swing.Icon;

import javax.swing.ImageIcon;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingUtilities;
import org.gephi.graph.api.Node;
import org.gephi.tools.spi.NodeClickEventListener;
import org.gephi.tools.spi.Tool;
import org.gephi.tools.spi.ToolEventListener;
import org.gephi.tools.spi.ToolSelectionType;
import org.gephi.tools.spi.ToolUI;
import org.openide.util.lookup.ServiceProvider;

import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import org.openide.util.Exceptions;

/**
 *
 * @author ekimbrel
 */
@ServiceProvider(service = Tool.class)
public class DrillDownTool implements Tool{

    
    private DrillDownUI ui = new DrillDownUI();
    
    @Override
    public void select() {
        
    }

    @Override
    public void unselect() {
        
    }

     @Override
    public ToolEventListener[] getListeners() {
        return new ToolEventListener[]{
                    
                    new NodeClickEventListener() {

                        @Override
                        public void clickNodes(Node[] nodes) {                           
                            
                            if (nodes.length > 1){
                                // over lapping nodes were selected which is invalid
                                ui.setText("More than one node selected, can not drill down", Color.RED);
                            }
                            else if (nodes.length == 1) {
                                Node n = nodes[0];

                                if (null == n) {
                                    ui.setText("NULL node selection.", Color.RED);
                                } else {
                                    String id = n.getNodeData().getId();
                                    final String comm = String.valueOf(n.getNodeData().getId());
                                    //final String comm = String.valueOf(n.getNodeData().getAttributes().getValue("community"));
                                    new Thread(new Runnable() {
                                        @Override
                                        public void run() {

                                            try {
                                                String url = "http://localhost:8787/setcomm/" + URLEncoder.encode(comm, "UTF8").replace("+", "%20");
                                                URL oracle = new URL(url);
                                                URLConnection yc = oracle.openConnection();
                                                //BufferedReader in = new BufferedReader(new InputStreamReader(
                                                yc.getInputStream();
                                            } catch (UnsupportedEncodingException ex) {
                                                Exceptions.printStackTrace(ex);
                                            } catch (MalformedURLException e) {
                                                Exceptions.printStackTrace(e);
                                            } catch (IOException e) {
                                                Exceptions.printStackTrace(e);
                                            }

                                        }
                                    }).start();

                                    //String inputLine;
                                    //while ((inputLine = in.readLine()) != null) 
                                    //    System.out.println(inputLine);
                                    //in.close();
                                    //yc.
                                    ui.setText("" + id, Color.PINK);

                                    GraphLoader loader = GraphLoader.getInstance();
                                    loader.drillDownAndFilter(id);
                                }
  
                                
                            }
                            else{
                                // no node is selected, shoud never occur.
                                ui.setText("No nodes selected", Color.YELLOW);  
                            }
                            
                        }
                    }
        
        
        };
    }

    @Override
    public ToolUI getUI() {
        return ui;
    }

    @Override
    public ToolSelectionType getSelectionType() {
        return ToolSelectionType.SELECTION_AND_DRAGGING;
    }
    
    
    
 
    
    /**
     * The TOOL UI
     */
    private static class DrillDownUI implements ToolUI {

        
        private JLabel label;
        
        @Override
        public JPanel getPropertiesBar(Tool tool) {
            JPanel panel = new JPanel();
            label = new JLabel();
            label.setText("No nodes selected");
            panel.add(label);
            return panel;
        }
        

        public void setText(final String message, final Color color){
            SwingUtilities.invokeLater(new Runnable() {
                @Override
                    public void run() {
                           label.setText(message);
                           label.setForeground(color);
                           
                    }
                }); 
        }
        
        
        @Override
        public Icon getIcon() {
            return new ImageIcon(getClass().getResource("/com/sotera/dfa/modularity/resources/icon.png"));
        }

        @Override
        public String getName() {
            return "Drill Down";
        }

        @Override
        public String getDescription() {
            return "Modularity Plugin Drill Down";
        }

        @Override
        public int getPosition() {
            return 200;
        }
        
    }
    
}
