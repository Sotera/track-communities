/* Tangelo Framework Configuration, Tab Controls */

function setConfig() {
  $.get("community/current").done(function(cfg){
	//TODO: Manually force them to pick table on load to avoid GO/RESET/REFRESH issue.
	
	// track table information
    //d3.select("#track-table").property("value", cfg.table);
	//$("#track-table").select2("val", cfg.table);
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
	if (table) {
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
						minimumResultsForSearch: -1,
						allowClear: false,
						data: lvlData
					});			
					
					// Handle geo/map filter controls
					if (cfg.mindt && cfg.maxdt) {
						var arr = [];
					
						$("#dateRangeSliderMsg").html("<p>&nbsp;</p>");
					
						// 2012-03-22 03:39:00 // 2012-03-26 20:21:00, 
						arr = cfg.mindt.split(' '); arr = arr[0].toString().split('-');
						var startYear = arr[0];
						var startMonth = arr[1] - 1;
						var startDay = arr[2];
						
						arr = cfg.maxdt.split(' '); arr = arr[0].toString().split('-');
						var endYear = arr[0];
						var endMonth = arr[1] - 1;
						var endDay = arr[2];						
						
						$("#dateRangeSlider").dateRangeSlider({
							valueLabels: "show",
							bounds:{
								min: new Date(startYear, startMonth, startDay),
								max: new Date(endYear, endMonth, endDay)
							},
							defaultValues:{
								min: new Date(startYear, startMonth, startDay),
								max: new Date(endYear, endMonth, endDay)
							}				
						});					
					
					}
					else {
						$("#dateRangeSliderMsg").html("Not available.");	
						try {
							$("#dateRangeSlider").dateRangeSlider("destroy");						
						} catch (error) {
						
						}
					}					

					// Finish up and refresh display.
					$("#community-info-box").toggle(true);				
					
					$("#graph_num_levels").val(levels);
					
					$("#level").select2("val", levels);
					$("#level").select2("enable", true);
					
					$("#comm-id").val("");
					$("#comm-id").prop("disabled", false );
					$('#comm-id').clearableTextField();
					
					$("#applyCommunity").prop("disabled", false);
					
					resetPanels();
			
				});
			});
	}

		
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

function filterCommunities() {
  var table, comm, level;
  table = $("#track-table").val();
  comm = $("#comm-id").val() || "";
  level = $("#level").val() || "";
  
  if (table) {
	  $.get("community/settable/" + table)
		.then(function(){
		
		  var n = $("#graph_num_levels").val();
		  $("#level").select2("val", n);
		  $("#comm-id").val("");
		  $('#comm-id').clearableTextField();
		  
		  if (comm !== "" && level !== "") {
			$.get("community/setcomm/" + comm + '/' + level)
				.then(reloadPanels);
		  }
		  else {
			reloadPanels();
		 }
	  });
  }

}
