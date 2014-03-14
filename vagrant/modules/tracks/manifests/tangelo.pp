class tracks::tangelo {

  exec { "pip-install-tangelo":
    command	=> "sudo pip install tangelo",
  } 

  file {"/home/bigdata/stop_tangelo.sh":
    owner   => 'bigdata',
    group   => 'bigdata',
    mode    => '755',
    source  => "puppet:///modules/tracks/stop_tangelo.sh",
  }

  file {"/home/bigdata/start_tangelo.sh":
    owner   => 'bigdata',
    group   => 'bigdata',
    mode    => '755',
    source  => "puppet:///modules/tracks/start_tangelo.sh",
  }

  file {"/var/log/tangelo":
    ensure  => "directory",
    owner   => 'bigdata',
    group   => 'bigdata',
    mode    => '777',
  }


  file {"/etc/tangelo.conf":
    owner   => 'bigdata',
    group   => 'bigdata',
    mode    => '755',
    source  => "puppet:///modules/tracks/tangelo.conf",
  }


}