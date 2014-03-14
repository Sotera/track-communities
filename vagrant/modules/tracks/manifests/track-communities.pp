class tracks::track-communities {

  $app = "track-communities"
  $download_destination = "/tmp/${app}.zip"
  $install_dir = "/srv/software"
  $url = "https://github.com/Sotera/track-communities.git"

  exec { "git-clone-track":
     unless      => "ls /srv/software/track-communities",
     cwd         => "/srv/software",
     command     => "sudo git clone ${url}",
  }

  exec { "chown-${app}":
     command     => "chown bigdata:bigdata -R ${install_dir}/${app}",
     require     => Exec["git-clone-track"],
  }

  # pull amp updates 
  exec { "git-pull-${app}":
     cwd         => "/srv/software/track-communities/",
     command     => "git pull",
     user        => 'bigdata',
     require     => Exec["chown-${app}"],
  }

  exec { "chmod-${app}":
     cwd         => "${install_dir}/${app}",
     command     => "chmod 744 example.sh && chmod 744 run.sh",
     user        => 'bigdata',
     require     => Exec["git-pull-${app}"],
  }

  file {"/home/bigdata/tangelo_html":
    ensure => link,
    target  => "${install_dir}/${app}/tangelo_html",
    require     => Exec["git-pull-${app}"],
  }


}