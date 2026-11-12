
#!/bin/bash

echo "                                  ################################################                                        "
echo "                                  #                    Disclaimer                  #                                       "
echo "                                  ################################################                                        "



echo "NBFLite is for Academia and research teams to quickly setup the network and for easy smart contract deployment. This can be used for developing demo applications and not for production grade applications."
echo "We are not responsible for any damages or losses that may result from unauthorized access, use, or disclosure of your information, or from any other security breaches."
echo "You agree to indemnify and hold us harmless from any claims, liabilities, losses, damages, or expenses arising from or related to your use of the product or your violation of these terms."

# Prompt user to hit Enter to continue
echo -e "\nPlease read the above message carefully. Press Enter to continue..."
read  # Waits for the user to hit Enter

# Continue with the rest of the script
echo "Proceeding with the script execution..."

# Get the Ubuntu version
ubuntu_version=$(lsb_release -r -s)

# Check if it's version 20.04
if [ "$ubuntu_version" != "20.04" ]; then
    echo "Ubuntu "$ubuntu_version" detected. Exiting the script. Please try with Ubuntu 20.04 version"
    exit 0  # Exit with a status code (0 for success)
else

# Your script continues here
echo "Ubuntu version is 20.04. Continuing with the script..."
fi

# Remove broken packages 


echo "                                  ################################################                                        "
echo "                                  #            Fix Broken Package                #"
echo "                                  ################################################                                        "
sleep 2
sudo apt-get -y update
sudo apt --fix-broken install

sleep 2
sudo apt -y autoremove

sleep 2
sudo apt-mark unhold $(sudo apt-mark showhold)

# Update package lists


echo "					################################################					"
echo "					#            Updating package lists            #"
echo "					################################################					"
sleep 2
sudo apt-add-repository -y ppa:git-core/ppa
sudo apt-get -y update



# Install dependencies

echo "					################################################					"
echo "					#             Installing Dependencies          #"
echo "					################################################					"
sleep 2
sudo apt-get -y install build-essential libssl-dev curl 



echo "					################################################					"
echo "					#             Installing Openssh-server        #"
echo "					################################################					"
sleep 2

sudo apt-get install -y openssh-server
# sudo systemctl start sshd
sleep 2

# Install python

echo "					################################################					"
echo "					#             Installing python                #"
echo "					################################################					"
sleep 2

sudo apt-get install -y python  

echo "					################################################					"
echo "					#             Installing python                #"
echo "					################################################					"
sleep 2

sudo apt-get install -y python3



echo "					################################################					"
echo "					#             Installing python-pip            #"
echo "					################################################					"
sleep 2
sudo apt-get install -y python3-pip

echo "					################################################					"
echo "					#             Installing Git                   #"
echo "					################################################					"
sleep 2
sudo apt-get install -y git


# Install unzip, required to install hyperledger fabric.


echo "					################################################					"
echo "					#             Installing Unzip                 #"
echo "					################################################					"
sleep 2
sudo apt-get -y install unzip



# Execute nvm installation script
echo "					################################################					"
echo "					#             Installing NVM                   #"
echo "					################################################					"
sleep 2

#  curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash

bash ./install.sh



# Set up nvm environment without restarting the shell
echo ""
sleep 2
echo ""
export NVM_DIR="${HOME}/.nvm"
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
[ -s "${NVM_DIR}/bash_completion" ] && . "${NVM_DIR}/bash_completion"

source ~/.bashrc



# Install node


echo "					################################################					"
echo "					#             Installing Node                  #"
echo "					################################################					"
sleep 2

nvm install 18.16.0



# Ensure that CA certificates are installed
echo "					################################################					"
echo "					#             Installing Docker                #"
echo "					################################################					"
sleep 2

echo ""
echo "# Ensure that CA certificates are installed"
echo ""
#sudo apt-get -y install apt-transport-https ca-certificates
sudo apt-get -y install apt-transport-https  ca-certificates  curl  gnupg-agent  software-properties-common

sleep 2

sudo install -m 0755 -d /etc/apt/keyrings

# Add Docker repository key to APT keychain
echo ""
echo "# Add Docker repository key to APT keychain"
echo ""

sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sleep 2
# Update where APT will search for Docker Packages
echo ""
echo "# Update where APT will search for Docker Packages..."
echo ""

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sleep 2

# Update package lists
sudo apt-get -y update
sleep 2
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sleep 2
sudo chown $(whoami):$(whoami) /var/run/docker.sock
# Install Docker
echo "					################################################					"
echo "					#             Installing Docker-compose         #                    "
echo "					################################################					"
sleep 2
echo ""
echo "# Installing Docker-Compose"
echo ""
sudo curl -L "https://github.com/docker/compose/releases/download/1.23.2/docker-compose-$(uname -s)-$(uname -m)" \
	-o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose




echo "					################################################					"
echo "					#             Installing MongoDB               #"
echo "					################################################					"
 
sleep 2

sudo rm -rf /tmp/mongodb-27017.sock
sudo apt-get install gnupg curl
sleep 2

curl -fsSL https://www.mongodb.org/static/pgp/server-4.4.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-4.4.gpg \
   --dearmor
sleep 2

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-4.4.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sleep 1
sudo apt-get update
sleep 2
sudo apt-get install -y mongodb-org=4.4.28 mongodb-org-server=4.4.28 mongodb-org-shell=4.4.28 mongodb-org-mongos=4.4.28 mongodb-org-tools=4.4.28

sleep 2
sudo service mongod start
sleep 1
sudo systemctl enable mongod



# Install pm2
echo "					################################################					"
echo "					#             Installing pm2 and ansible       #                    "
echo "					################################################					"
sleep 2

sudo apt update
sudo apt install software-properties-common
sudo apt install -y ansible
sudo apt install -y sshpass

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install pm2 globally
npm install pm2@latest -g
# pm2 update

# Check if pm2 was installed successfully
if ! command -v pm2 &> /dev/null; then
    echo "pm2 installation failed."
    exit 1
fi

echo -n "pm2 has been installed successfully."

# Display pm2 version
pm2 --version
# <<<<<<< HEAD
sudo env PATH=$PATH:$(nvm which current | sed 's|bin/node||')bin $(nvm which current | sed 's|bin/node||')lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER


# =======
# sudo env PATH=$PATH:/home/$USER/.nvm/versions/node/v12.22.12/bin /home/$USER/.nvm/versions/node/v12.22.12/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
# sudo env PATH=$PATH:/home/$USER/.nvm/versions/node/v18.16.0/bin /home/$USER/.nvm/versions/node/v18.16.0/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
# >>>>>>> 9740642afc21c16cd77ead9af0cb1aa4fe85e297

 

# Print installation details for user
echo ''
echo 'Installation completed, versions installed are:'
echo ''
echo -n 'Node:           '
node --version
echo -n 'npm:            '
npm --version
echo -n 'Docker:         '
docker --version
echo -n 'Docker Compose: '
docker-compose --version
echo -n 'Python:         '

python -V
python3 -V


echo "Run Following commands [If Required]"
echo "sudo systemctl enable mongod"
echo "sudo systemctl enable docker"
echo "sudo systemctl enable sshd"
# Restart
echo ''


echo "					################################################					"
echo "					#             adding connector to pm2          #                    "
echo "					################################################					"
sleep 2
cd ./nbf_c
pm2 start './connector-linux' --name connectornew


echo "					################################################					"
echo "					#             adding provision to pm2          #                    "
echo "					################################################					"
sleep 2
cd ../academia_provision_server
pm2 start './Provision-Server-linux' --name provisionnew


echo "					################################################					"
echo "					#             adding config to pm2             #                    "
echo "					################################################					"
sleep 2
cd ../academia_config_server
pm2 start './Config-Server-linux' --name confignew


echo "					################################################					"
echo "					#             adding aa server to pm2          #                    "
echo "					################################################					"
sleep 2
cd ../academia_aa_server
pm2 start './AA-Server-linux' --name aanew


echo "					################################################					"
echo "					#   adding  Admin Backend Server to pm2        #                    "
echo "					################################################					"
sleep 2
cd ../Admin-Backend-Server-Fabric
pm2 start './admin-backend-server-linux' --name Admin-Backend-Server-Fabric


echo "					################################################					"
echo "					# adding Generic-Swagger-Fabric to pm2         #                    "
echo "					################################################					"
sleep 2
cd ../Swagger-Fabric
pm2 start './generic-swagger-fabric-api-final-linux' --name Generic-Swagger-Fabric 


echo "                                  ################################################                                        "
echo "                                  # adding Generic-Swagger-Sawtooth to pm2         #                                      "
echo "                                  ################################################                                        "
sleep 2
cd ../Swagger-Sawtooth
pm2 start './swagger_testing-linux' --name Generic-Swagger-Sawtooth





echo "					################################################					"
echo "					# adding Template-Studio-Server-Fabric to pm2  #                    "
echo "					################################################					"
sleep 2
cd ../Template-Studio-Server-Fabric
pm2 start './chaincode-generating-module-linux' --name Template-Studio-Server-Fabric




echo "                                  ################################################                                        "
echo "                                  # adding Template-Studio-Server-Sawtooth to pm2  #                                      "
echo "                                  ################################################                                        "
sleep 2
cd ../Template-Studio-Server-Sawtooth
pm2 start './ubf_smartcontract_api-linux' --name Template-Studio-Server-Sawtooth



pm2 save
sudo mkdir /opt/servers


echo "					################################################					"
echo "					#             copy nbf-agent to opt/server     #                    "
echo "					################################################					"
sleep 2
sudo cp -r ../nbf-agent /opt/servers
sudo mv /opt/servers/nbf-agent /opt/servers/ubfagent
cd /opt/servers
sudo tar -cvf ubfagent.tar ubfagent
cd -
sudo rm -rf /opt/servers/ubfagent


echo "					################################################					"
echo "					#     copy nbf-samplerest to opt/server        #                    "
echo "					################################################					"
sleep 2
sudo cp -r ../nbf-samplerest /opt/servers
cd /opt/servers
sudo tar -cvf nbf-samplerest.tar nbf-samplerest
cd -
sudo rm -rf /opt/servers/nbf-samplerest


echo "                                  ################################################                                        "
echo "                                  #     -Running Dockerized UI  #                                                         "
echo "                                  ################################################                                        "
sleep 2
cd ../academia_UI
# tar -xf nbf-dashboard.tar
cat nbf-academia.tar | docker load
export REST_PROXY_IP=$(hostname -I|awk '{print $1}')
docker-compose up -d 
# docker run --name  nbf-academia-dashboard -p 80:80 nbf-academia_web  -e - REST_PROXY_IP=${REST_PROXY_IP:-0.0.0.0} 
#docker exec -it nbf-academia-dashboard sh /run/setenv.sh
#docker run -itd -p 80:80 --name nbf-ui-academia nbf-academia
# cd nbf-dashboard
# nvm install 16
# nvm use 16
# npm install 
# pm2 start "npm start" --name "NBF-ACADEMIA-UI"


echo "					################################################					"
echo "                                                                                      "
echo "                                                                                      "
echo "\e[1;31m					  RESTART THE TERMINAL TO REFELCT THE CHANGES          \e[0m"
echo "                                                                                      "
echo "                                                                                      "
echo "					################################################					"




