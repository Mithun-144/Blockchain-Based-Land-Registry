# Ansible scripts for installing prerequistes


## Installing ansible

``` 
sudo apt update
sudo apt install software-properties-common
sudo apt install ansible -y
```


```:warning: Remove the host file from .ssh folder for ambiguity in the username of the VM's the file path is '$HOME/.ssh/known_hosts'```
## Configuration

1. Edit the hosts file for providing host details such as IP.
    > Following there is sample hosts file
    > ```yaml
    > [prereq]
    > <username> ansible_host=<ssh-connection>   ansible_user=<userName> ansible_password=<passwordForUser>
    > ``` 
    > username :- username for host.
    > 
    >ssh-connection:- cmd for ssh connection e.g. ``` <username@IP> ```
    >
    > passwordForUser:- password for that user
    
2. *Test the connectivity to the host with following command*
   
    ```
    ansible <group> -m ping -i hosts
    ```


## Run Ansible Script

1. For installing prerequistes on the host

    ```
    ansible-playbook install-pre.yaml -i hosts --extra-vars "ansible_sudo_pass=<password> userName=<username>"
    ```

2. Install node and setup servers on the host

    ```
    ansible-playbook setup-server.yaml -i hosts --extra-vars "ansible_sudo_pass=<password> userName=<username>"
    ```