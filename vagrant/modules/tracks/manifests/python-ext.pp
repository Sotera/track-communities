class tracks::python-ext {

  package { "python-pip" :
    ensure => "installed"
  }

  package { "python-dev" :
    ensure => "installed"
  }

  package { "build-essential" :
    ensure => "installed"
  }

}