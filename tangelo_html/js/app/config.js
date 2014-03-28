/* Tangelo Framework Configuration, Tab Controls */

function setConfig() {
  $.get("community/current").done(function(cfg){
    d3.select("#track-table").property("value", cfg.table);
    d3.select("#comm-id").property("value", cfg.community);
    d3.select("#level").property("value", cfg.level);
    d3.select("#graph_stat_string").text(cfg.graph_stat_string);
  });

}

function showConfig() {
  $.get("community/current").done(function(cfg){
    d3.select("#track-table").property("value", cfg.table);
    d3.select("#comm-id").property("value", cfg.community);
    d3.select("#level").property("value", cfg.level);
    d3.select("#graph_stat_string").text(cfg.graph_stat_string);
  });
}

function updateConfig() {
  var table, comm, level;
  table = $("#track-table").val();
  comm = $("#comm-id").val();
  level = $("#level").val();

  $.get("community/settable/" + table)
    .then(function(){
      $.get("community/setcomm/" + comm + '/' + level);
  });
}