/* Tangelo Framework Configuration, Tab Controls */

function showConfig() {
  // NOT NECESSARY FOR ANY ACTIONS GIVEN NON-SERVER RETRIEVE/SAVE USAGE
  // KEPT HERE DUE TO TANGELO FRAMEWORK REFERENCE.
}

function updateConfig() {
	var table, comm, level;
	
	table = $("#track-table").val();
	// Save the selected data set table name...
	if (table) {
		XDATA.LOGGER.logUserActivity("User selected data table and maximum graph size.", "select_option",  XDATA.LOGGER.WF_GETDATA);
		$.get("community/settable/" + table)
			.then( function(){
				XDATA.LOGGER.logSystemActivity("System has set data table.");
				// ... then get information about that table... 
				$.get("community/current").done(function(cfg){
					XDATA.LOGGER.logSystemActivity("System has retrieved current community information.");
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
						placeholder: "...",
						minimumResultsForSearch: -1,
						allowClear: false,
						data: lvlData
					})
					.on("change", function() {
						XDATA.LOGGER.logUserActivity("User has adjusted community level.", "select_option",  XDATA.LOGGER.GET_DATA);
					});	
					XDATA.LOGGER.logSystemActivity("System has set community interaction controls.");					
					// Handle geo/map filter controls
					if (cfg.mindt && cfg.maxdt) {
						var arr = [];

						$("#dateRangeSliderMsg").html("");					
						// 2012-03-22 03:39:00 // 2012-03-26 20:21:00, 
						arr = cfg.mindt.split(' '); arr = arr[0].toString().split('-');
						var startYear = arr[0];
						var startMonth = arr[1] - 1;
						var startDay = arr[2];
						
						arr = cfg.maxdt.split(' '); arr = arr[0].toString().split('-');
						var endYear = arr[0];
						var endMonth = arr[1] - 1;
						var endDay = arr[2];						
						
						var min =  new Date(startYear, startMonth, startDay).getTime();
						var max =  new Date(endYear, endMonth, endDay).getTime();
						var update_times = function(low, high){
							var l = moment(low).utc().format("YYYY-MM-DDTHH:mm:ss");                                   
							var h = moment(high).utc().format("YYYY-MM-DDTHH:mm:ss");
							$("#txt-low-val").html(l);
							$("#txt-high-val").html(h);
						};
						update_times(min, max);
						var slider = $("#range-slider").slider({
							range: true,
							change: function(evt, ui){
								XDATA.LOGGER.logUserActivity("User has selected new date range filter parameters.", "select",  XDATA.LOGGER.WF_EXPLORE);
								update_times(ui.values[0], ui.values[1]);
							},
							slide: function(evt, ui){
								update_times(ui.values[0], ui.values[1]);
							},
							max: max,
							min: min,
							values: [min, max]
						});	
					}
					else {
						$("#dateRangeSliderMsg").html("Not available.");	
					}
					XDATA.LOGGER.logSystemActivity("System has set geospatial and time bounds information.");					

					// Finish up and refresh display.
					$("#community-info-box").toggle(true);	
					MAX_GRAPH_SIZE = $("#max-graph-size").val();
					
					$("#graph_num_levels").val(levels);
					
					$("#level").select2("val", levels);
					$("#level").select2("enable", true);
					
					$("#comm-id").val("");
					$("#comm-id").prop("disabled", false );
					$('#comm-id').clearableTextField();
					
					$("#applyCommunity").prop("disabled", false);
					
					XDATA.LOGGER.logSystemActivity("System has refreshed interaction controls.");					
					
					resetPanels();
			
				});
			});
	}
}

function updateCommunities() {
  var table = $("#track-table").val();
  var comm = $("#comm-id").val() || "";
  var level = $("#level").val() || "";
  
  XDATA.LOGGER.logUserActivity("User has requested a community visualization update.", "execute_query",  XDATA.LOGGER.WF_GETDATA);
  
  if (table) {
	  $.get("community/settable/" + table)
		.then(function(){
		  XDATA.LOGGER.logSystemActivity("System has set data table.");
		  if (comm !== "" && level !== "") {
			$.get("community/setcomm/" + comm + '/' + level)
				.then( function() {
					XDATA.LOGGER.logSystemActivity("System has set community and level information.");
					reloadPanels();
				});
		  }
		  else {
			resetPanels();
		 }
	  });
  }
  else {
	XDATA.LOGGER.logSystemActivity("System cannot process request: data table not set.");
  }

}

function filterCommunities() {
  var table = $("#track-table").val();
  var comm = $("#comm-id").val() || "";
  var level = $("#level").val() || "";
  
  XDATA.LOGGER.logUserActivity("User has requested geo-time community search.", "execute_query",  XDATA.LOGGER.WF_GETDATA);  
  
  if (table) {
	  $.get("community/settable/" + table)
		.then(function(){
		  XDATA.LOGGER.logSystemActivity("System has set data table.");
		  
		  var n = $("#graph_num_levels").val();
		  $("#level").select2("val", n);
		  $("#comm-id").val("");
		  $('#comm-id').clearableTextField();
		  XDATA.LOGGER.logSystemActivity("System has refreshed interaction controls.");
		  
		  reloadPanels();
	  });
  }
  else {
	XDATA.LOGGER.logSystemActivity("System cannot process request: data table not set.");
  }  

}
