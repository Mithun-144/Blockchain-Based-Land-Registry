#!/bin/bash

myString="$1"
#ip=(10.210.12.193 10.210.12.195 10.210.13.22 10.210.12.233 10.210.12.234)

# Set the delimiter to a comma
IFS=','

# Read the values into an array
read -ra ip <<< "$myString"

# Print the elements of the array
for element in "${ip[@]}"
do
  echo "Kub Element: $element"
done




######################################################################################################




kubectl delete deployment client  handler

cd Running\ Sawtooth/certificate_Handler/

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

docker tag pbft-handler:latest 10.210.0.37:5000/pbft-handler:latest
docker tag pbft-client:latest 10.210.0.37:5000/pbft-client:latest
docker push 10.210.0.37:5000/pbft-client:latest
docker push 10.210.0.37:5000/pbft-handler:latest

kubectl create deployment handler --image=10.210.0.37:5000/pbft-handler:latest


kubectl create deployment client --image=10.210.0.37:5000/pbft-client:latest


var=$(pwd)
echo "The current working directory $var."



content="- "${ip[0]}
#content="- master_ip"

    cat <<'EOF' | sed -i "14c$(printf "%s" "${content//&/\\&}")" cert_handler_svc.yaml
EOF

    cat <<'EOF' | sed -i "14s/^/      /" cert_handler_svc.yaml
EOF


    cat <<'EOF' | sed -i "14c$(printf "%s" "${content//&/\\&}")" cert_client_svc.yaml
EOF

    cat <<'EOF' | sed -i "14s/^/      /" cert_client_svc.yaml
EOF



kubectl delete svc client-service cert-process-service
kubectl apply -f cert_handler_svc.yaml
kubectl apply -f cert_client_svc.yaml

echo"############################# Client and handler service has been created ###################################"
