
###################################################################################

Note:  For setting up the single node Baas setup ubuntu version 20.04 is required.

####################################################################################

## Base Virtual Machine and Network Setup VM Checklist for Project Deployment

1. **Create a New Virtual Machine**
   - Create a new VM as per project requirements.

2. **Operating System**
   - Install **Ubuntu 20.04** on the VM.

3. **Internet Connectivity**
   - Ensure the **internet is enabled and accessible** on the VM.

4. **SSH Access**
   - **SSH should be installed** on the VM.
   - The VM should be **accessible via SSH from the base (host) machine**.

5. **User Permissions**
   - The VM user should have **sudo permissions** to execute administrative commands.

6. **Firewall Configuration**
   - The **firewall should be disabled**.
   - If the firewall is enabled, ensure **port 22 is open** for SSH access.

7. **Python Installation**
   - **Python should be installed** on the VM.

8. **Disk Space Availability**
   - Ensure the VM has **sufficient disk space** available for installation and application usage.

9. **Verify Package Manager**
   - Open the **command prompt / terminal** and run:
   sudo apt update


- The command should execute successfully.
- There should be **no errors or warnings** during execution.

10. **Check Time Synchronization**
- The **system time should be properly synchronized**.

11. **Verify System Locks**
- Ensure there are **no system or process locks** present in the system.


# Disclaimer:
NBFLite is for Academia and research teams to quickly setup 
the network and for easy smart contract deployment. This can be used for 
developing demo applications and not for production grade applications. 
We are not responsible for any damages or losses that may result from 
unauthorized access, use, or disclosure of your information,or from 
any other security breaches. You agree to indemnify and hold us harmless 
from any claims,liabilities, losses, damages, or expenses arising 
from or related to your use of the product or your violation of these terms.

# installing prerequistes pacakges and setup the backend servers

1. Run setup.sh shell script file.

    To run the script -----> "./setup.sh"

2- insert Url here or format of URL.
e.g use local host ip (e.g: localhost/superadminreg) 
for role based login please refer to user manual



<---------------------To test the application following are the login credentials---------------------------->

#######  SuperAdmin Login Details   ############
URL   :     <localhost (or) System IP>/superadminreg     #added
email:      superadmin@cdac.in
password:   Cdac@123


#######    Admin Login Details      ###########
URL   :     <localhost (or) System IP>/adminLogin  	#added
email:      admin@cdac.in
password:   Cdachyd@123


#######    Deptadmin Login Details     ##############
URL   :     <localhost (or) System IP>/register     #added
email:      deptadmin@cdac.in
password:   Cdac@123$


#    ******** AFTER COMPLETION OF SCRIPT RUNNING RESTART THE TERMINAL TO REFELECT THE CHANGES ********
