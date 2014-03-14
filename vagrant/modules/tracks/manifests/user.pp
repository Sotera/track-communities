class tracks::user {

    file { 'bigdata-sudoers':
         path    => '/etc/sudoers.d/bigdata',
         source  => "puppet:///modules/tracks/sudoer-bigdata",
         ensure  => file,
         owner   => 'root',
         group   => 'root',
         mode    => '0440',
         replace => true,
     }

}