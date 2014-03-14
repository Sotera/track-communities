class tracks::impala {

  file { 'start_impala':
       path    => '/home/bigdata/start_impala.sh',
       source  => "puppet:///modules/tracks/start_impala.sh",
       ensure  => file,
       owner   => 'bigdata',
       group   => 'bigdata',
       mode    => '0755',
       replace => true,
  }

}