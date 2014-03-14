class tracks::amp {

  $app = "aggregate-micro-paths"
  $download_destination = "/tmp/${app}.zip"
  $install_dir = "/srv/software"
  $url = "https://github.com/Sotera/aggregate-micro-paths.git"

  # pull amp updates 
  exec { "git-pull-${app}":
     cwd         => "/srv/software/aggregate-micro-paths",
     command     => "sudo git pull",
  }

}