class tracks::setup-tcomm {


  exec { "track-comm-setup":
     unless      => 'ls /tmp/track.setup',
     cwd         => "/srv/software/track-communities/commserver",
     command     => "sudo python setup.py install",
  }

  file {"/home/bigdata/go.py":
    ensure => link,
    target  => "/srv/software/track-communities/commserver/go.py",
    require => Exec['track-comm-setup'],
  }

  file {"/home/bigdata/go_proxy.py":
    ensure => link,
    target  => "/srv/software/track-communities/commserver/go_proxy.py",
    require => Exec['track-comm-setup'],
  }

}