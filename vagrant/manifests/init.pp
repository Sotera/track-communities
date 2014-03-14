#sets global path so don't have to specify it every single time.
Exec {
	path => [
		'/usr/local/bin',
		'/opt/local/bin',
		'/usr/bin', 
		'/usr/sbin', 
		'/bin',
		'/sbin'],
}

include tracks::user

include tracks::amp
include tracks::track-communities

class { 'tracks::tangelo': require => Class['tracks::python-ext'] }

include tracks::python-ext
include tracks::tangelo

class { 'tracks::setup-tcomm': require => [Class['tracks::track-communities'], Class['tracks::tangelo']] }
include tracks::setup-tcomm

include tracks::python-pip-ext 
include tracks::impala
