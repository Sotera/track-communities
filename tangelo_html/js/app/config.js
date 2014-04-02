/* Tangelo Framework Configuration, Tab Controls */

function setConfig() {
  $.get("community/current").done(function(cfg){
	
	// track table information
    d3.select("#track-table").property("value", cfg.table);
	$("#track-table").select2("val", cfg.table);
	//d3.select("#graph_stat_string").text(cfg.graph_stat_string);
	
	// community information
    //d3.select("#comm-id").property("value", cfg.community);
    //d3.select("#level").property("value", cfg.level || cfg.graph_num_levels);
	//d3.select("#graph_num_levels").property("value", cfg.graph_num_levels);
	//$("#level").setValue(cfg.graph_num_levels);
    
  });

}

function showConfig() {
  // TODO: THIS DOESN'T APPEAR TO BE NECESSARY GIVEN SETCONFIG()
  /*
  $.get("community/current").done(function(cfg){
	
	// track table information
    //d3.select("#track-table").property("value", cfg.table);
	//d3.select("#graph_stat_string").text(cfg.graph_stat_string);
	
	// community information
    //d3.select("#comm-id").property("value", cfg.community);
    //d3.select("#level").property("value", cfg.graph_num_levels);
    
  });
  */
}

function updateConfig() {
	var table, comm, level;
	table = $("#track-table").val();

	// Save the selected data set table name...
	$.get("community/settable/" + table)
		.then( function(){
			// ... then get information about that table... 
			$.get("community/current").done(function(cfg){
				// ... then update the visualization.
				d3.select("#graph_stat_string").text(cfg.graph_stat_string);
				d3.select("#level").property("value", cfg.graph_num_levels);
				d3.select("#graph_num_levels").property("value", cfg.graph_num_levels);

				// Update Community Level List
				var lvlData = [];
				var levels = $("#graph_num_levels").val() || 0;
				for (var i=1; i <= levels; i++) {
					lvlData.push({
						id: i.toString(),
						text: i.toString()
					});			
				}
				$("#level").select2({
					width: "resolve",
					placeholder: "No data set loaded...",
					allowClear: false,
					data: lvlData
				});			

				// Finish up and refresh display.
				$("#community-info-box").show();				
				$("#graph_num_levels").val(levels)
				$("#level").val(levels);
				resetPanels();
		
			});
		});

		
}

function updateCommunities() {
  var table, comm, level;
  table = $("#track-table").val();
  comm = $("#comm-id").val() || "";
  level = $("#level").val() || "";
  
  if (table) {
	  $.get("community/settable/" + table)
		.then(function(){
		  if (comm !== "" && level !== "") {
			$.get("community/setcomm/" + comm + '/' + level)
				.then(reloadPanels);
		  }
		  else {
			resetPanels();
		 }
	  });
  }

}
