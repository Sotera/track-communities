class tracks::python-pip-ext {

  exec { "pip-install-impyla":
    command	=> "sudo pip install impyla",
  } 

}

