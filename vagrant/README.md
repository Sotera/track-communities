


## Dependencies
- Vagrant: http://www.vagrantup.com
- Virtual Box: https://www.virtualbox.org/wiki/Downloads
- XData Vagrant Box (xdata-0.1.box) from http://goo.gl/PCwt1P (Use IE / Firefox. Chrome fails at the end of the download)
  - Add the box to vagrant using the name xdata-vm1 (if it is not
    named xdata-vm1 you can modify this in the Vagrantfile as
    described below
  - `vagrant box add xdata-vm1 xdata-0.1.box`

## Getting Started
Copy the *vagrant/* folder from the track-communities project to where
you would like to run your VM.

If you already have the xdata-0.1.box installed in vagrant and it is
named xdata-vm1 you just need to run `vagrant up` and you should be
ready to go.  You can check the installed vagrant boxes by running
`vagrant box list`

If the box is named differently you can modify the **Vagrantfile** by
either changing the **config.vm.box** to the name it is installed as
in your environment or uncommenting the **config.vm.box_url** property
and giving it the absolute file path to the downloaded xdata-0.1.box.
After this is done run `vagrant up` to get started.


## Running
The provisioner should set everything up for you. You can take a look
at the **Vagrantfile** and see the **config.vm.network** to see all of
the configured ports that are mapped from localhost to the vm.

When you login to the vm you should use the account **bigdata**,
password **bigdata** It should be setup with passwordless sudo.  If
you use `vagrant ssh` to login to the box.  Just run `sudo -u bigdata
-i` since all of the permissions defaulted to the **bigdata** account.

### Impala

**Impala** does not start by default.  There is a script in the
  bigdata home directory **start-impala.sh** that will start all of
  the impala services.
  
### Tangelo

**Tangelo** also will not be started.  It is setup for you to just run
  `tangelo start` and `tangelo stop`.
  
  config - /etc/tangelo.conf<br/>
  root - /srv/software/track-communities/tangelo_html<br/>
  host - 0.0.0.0<br/>
  pids - /var/tmp/tanglo.[pid]<br/>
  logs - /var/log/tangelo<br/>
  <br/>
  check [http://localhost:8000] in your browser for the page 
  
### Track Communities

**Track Communities** should be able to run out of the box from
  **/srv/software/track-communities/** by running `./example.sh` 
  
If you are using the gephi plugin you will need to start the comm
server by running `python ~/go_proxy.py &` 
