/* Tangelo Framework Configuration, Tab Controls */

TRACK_TABLE = "";
COMM_ID = "";
LEVEL = "";
GRAPH_STRING = "";


function setConfig() {
  $.get("community/current").done(function(cfg){
	
	// track table information
    d3.select("#track-table").property("value", cfg.table);
	$("#track-table").select2("val", cfg.table);
	
	d3.select("#graph_stat_string").text(cfg.graph_stat_string);
	
	// community information
    //d3.select("#comm-id").property("value", cfg.community);
    d3.select("#level").property("value", cfg.level || cfg.graph_num_levels);
	//$("#level").setValue(cfg.graph_num_levels);
	
	LEVEL = cfg.level || cfg.graph_num_levels;
    
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
  comm = ""; //$("#comm-id").editable('getValue', true); //COMM_ID; //$("#comm-id").val();
  level = ""; //$("#level").editable('getValue', true);  //$("#level").val();
  
	$('#level').editable({
		type: "select2",
		value: LEVEL,
		placement: "right",
		title: "Select Community Level",
		emptytext: "Community Level",
		select2: {
			width: "resolve",
			allowClear: false,					
			ajax: {
				url: "/community/current",
				dataType: 'json',
				results: function (data, page) { 
					var results = [];
					var num = data.graph_num_levels;
					for (var i=0; i < num; i++) {
						results.push({
							id: parseInt(i+1),
							text: "Level " + parseInt(i+1).toString()				
						});
					}
					return {"results": results};
				},
				initSelection : function (element, callback) {
					var data = {id: element.val(), text: element.val()};
					callback(data);
				}	
			}
		},			
		display: function(value) {
			if (value) {
				$(this).html("LVL: "+value);
			}
			else {
				$(this).empty();
			}
		}				
	});

	try {
		$('#comm-id').editable('destroy', {});
	} catch(e) {
		// todo: some other process is killing the data?
	}	
	$("#comm-id").editable({
		value: COMM_ID || "",
		placement: "right",
		title: "Enter Community Identifier",
		emptytext: "Community Identifier",
		display: function(value) {
			if (value) {
				$(this).html("ID: "+value);
			}
			else {
				$(this).empty();
			}
		}		
	});			
			

  $.get("community/settable/" + table)
    .then(function(){
	  if (comm && level && comm !== "0" && false) {
		$.get("community/setcomm/" + comm + '/' + level)
			.then(reloadPanels);
	  }
	  else {
		resetPanels();
	 }
  });
}

function updateCommunities() {
  var table, comm, level;
  table = $("#track-table").val();
  comm = $("#comm-id").editable('getValue', true); //COMM_ID; //$("#comm-id").val();
  level = $("#level").editable('getValue', true);  //$("#level").val();
	

  $.get("community/settable/" + table)
    .then(function(){
	  if (comm && level) {
		$.get("community/setcomm/" + comm + '/' + level)
			.then(reloadPanels);
	  }
	  else {
		resetPanels();
	 }
  });

}
