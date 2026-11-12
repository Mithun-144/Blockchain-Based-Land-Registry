#!/bin/bash

myString="$1"
#ip=(10.210.12.193 10.210.12.231 10.210.12.233 10.210.12.234 10.210.12.235)
# Set the delimiter to a comma
IFS=','

# Read the values into an array
read -ra ip <<< "$myString"

# Print the elements of the array
for element in "${ip[@]}"
do
  echo "Kub Element: $element"
done



# Set the path to your kubeconfig file
KUBECONFIG="$HOME/.servers/ubfagent/kubeconfig/config"

# Set the KUBECONFIG environmental variable
export KUBECONFIG="$KUBECONFIG"




echo "EEUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU tp_dummy.sh start #############"





######################################################################################################

# Function to check if pbft-0 pod is available
function check_pod_available() {
    echo "Checking if pbft-0 pod is available..."
    status=$(kubectl get deployment pbft-0 -o=jsonpath='{.status.availableReplicas}')
    if [ "$status" == "1" ]; then
        echo "pbft-0 pod is available!"
        return 0
    else
        echo "pbft-0 pod is not available"
        return 1
    fi
}

# Loop until pbft-0 pod is available
while ! check_pod_available; do
    sleep 10
done


##############################################################################

kubectl delete deployment client handler

cd ./sawtooth-core/docker/compose/client
count=0
while IFS= read -r line;do
           ((count++))
        if [ "$line" = "//add ip" ]; then
            echo "$count"
	    content="const ip = \"${ip[0]}\";"
    cat <<'EOF' | sed -i "${count}c$(printf "%s" "${content//&/\\&}")" client.js
EOF

        fi
done < "client.js"


###################################################################################################

sleep 3

cd ..
cd ./certificate_Handler/

# Find the line numbers containing "//add url" and "//start tp"
add_url_line=$(grep -n "//add url" Processor.js | cut -d ":" -f 1)
start_tp_line=$(grep -n "//start tp" Processor.js | cut -d ":" -f 1)

if [[ -z "$add_url_line" ]]; then
  echo "Line '//add url' not found in Processor.js"
  exit 1
fi

if [[ -z "$start_tp_line" ]]; then
  echo "Line '//start tp' not found in Processor.js"
  exit 1
fi

lengthd=${#ip[@]}

# Prepare the dynamic content for "//add url"
add_url_dynamic_content=""
for ((i = 0; i < lengthd; i++)); do
  element="${ip[$i]}"
  content="const url_${i} = \"tcp://${ip[$i]}:4004\";"
  add_url_dynamic_content+="${content}"$'\n'
  echo "add_url_content : ${content}"
done

# Remove carriage return from the "//add url" dynamic content
add_url_dynamic_content="${add_url_dynamic_content//$'\r'/}"

# Create a temporary file to hold the "//add url" dynamic content
add_url_temp_file=$(mktemp)

# Write the "//add url" dynamic content to the temporary file
echo -e "$add_url_dynamic_content" > "$add_url_temp_file"

# Perform replacements for "//add url" in the "Processor.js" file using sed with alternate delimiter #
sed -i -e "${add_url_line} { r $add_url_temp_file" -e 'd' -e '}' Processor.js

# Clean up the temporary file for "//add url"
rm "$add_url_temp_file"

# Prepare the dynamic content for "//start tp"
start_tp_dynamic_content=""
for ((i = 0; i < lengthd; i++)); do
  element="${ip[$i]}"
  content="const transactionProcessors_${i} = new TransactionProcessor(url_${i});"
  contents="transactionProcessors_${i}.addHandler(new CertificateHandler());"
  contentt="transactionProcessors_${i}.start();"
  start_tp_dynamic_content+="\n$content\n$contents\n$contentt"
  echo "start_tp_content : ${content}"
  echo "start_tp_contents : ${contents}"
  echo "start_tp_contentt : ${contentt}"
done

# Remove carriage return from the "//start tp" dynamic content
start_tp_dynamic_content="${start_tp_dynamic_content//$'\r'/}"

# Create a temporary file to hold the "//start tp" dynamic content
start_tp_temp_file=$(mktemp)

# Write the "//start tp" dynamic content to the temporary file
echo -e "$start_tp_dynamic_content" > "$start_tp_temp_file"

# Perform replacements for "//start tp" in the "Processor.js" file using sed with alternate delimiter #
sed -i -e "${start_tp_line} { r $start_tp_temp_file" -e 'd' -e '}' Processor.js



echo "############################################ Calling build_image.sh ############################################"
sleep 10


######################################################################################################




#kubectl delete deployment client  handler

#cd /sawtooth-core/docker/compose/certificate_Handler/

#############################################################################33

# ######################################## BUILD IMAGE ##############################################


docker build -t pbft-handler .

# Get the PID of the last background process
#build_pid=$!

# Wait for the Docker build process to finish
#wait "$build_pid"

# Docker build process has finished
#echo "Docker build completed!"

cd ..

cd ./client
docker build -t pbft-client .

cd ..

docker tag pbft-handler:latest ubfteam/cdac_nbf:pbft-handler
docker tag pbft-client:latest ubfteam/cdac_nbf:pbft-client
docker push ubfteam/cdac_nbf:pbft-client
docker push ubfteam/cdac_nbf:pbft-handler

sleep 2

kubectl create deployment handler --image=ubfteam/cdac_nbf:pbft-handler


kubectl create deployment client --image=ubfteam/cdac_nbf:pbft-client


var=$(pwd)
echo "The current working directory $var."



content="- "${ip[0]}
#content="- master_ip"

    cat <<'EOF' | sed -i "14c$(printf "%s" "${content//&/\\&}")" handler.yaml
EOF

    cat <<'EOF' | sed -i "14s/^/      /" handler.yaml
EOF


    cat <<'EOF' | sed -i "14c$(printf "%s" "${content//&/\\&}")" client.yaml
EOF

    cat <<'EOF' | sed -i "14s/^/      /" client.yaml
EOF



#kubectl delete svc client-service cert-process-service
kubectl apply -f handler.yaml
kubectl apply -f client.yaml



sleep 20
echo"############################# Client and handler service has been created ###################################"
