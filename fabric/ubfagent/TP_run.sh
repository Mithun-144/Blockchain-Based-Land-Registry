#!/bin/bash

myString="$1"

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

cd ./sawtooth-core/docker/compose/client




count=0
while IFS= read -r line;do 	
           ((count++))         
        if [ "$line" = "//add ip" ]; then
            echo "$count"
	    content="const ip = \"${ip[0]}\";"
    cat <<'EOF' | sed -i "${count}c$(printf "%s" "${content//&/\\&}")" client.js
        nodeName: nbf10
EOF

        fi
     #echo "  $line" >>  test.yaml
done < "client.js"


sleep 3

cd ..
cd ./handler

lengthd=${#ip[@]}

cip=0
count=0
while IFS= read -r line;do
           ((count++))
        if [ "$line" = "//add url" ]; then
            cip=${count}
        fi
     #echo "  $line" >>  test.yaml
done < "Processor.js"


echo "cip : ${cip}"

for ((i=0; i<lengthd; i++))
do
    content="const url_${i} = \"tcp://${ip[$i]}:4004\";"
    cat <<'EOF' | sed -i "${cip}c$(printf "%s" "${content//&/\\&}")" Processor.js
        nodeName: nbf10
EOF
    ((cip++))
    echo "${cip}  : ${content}"

done


#############################################################################33


#############################################################################33

sleep 2

c=0
count=0
while IFS= read -r line;do
           ((count++))
        if [ "$line" = "//start tp" ]; then
            c=${count}
        fi
     #echo "  $line" >>  test.yaml
done < "Processor.js"


echo "c : ${c}"

# Iterate over the arrays
for ((i=0; i<lengthd; i++))
do
    # Access elements from both arrays using the same index
    ((c++))
    element="${ip[$i]}"
    content="const transactionProcessors_${i} = new TransactionProcessor(url_${i})"
    contents="transactionProcessors_${i}.addHandler(new Handler())"
    contentt="transactionProcessors_${i}.start()"
    cat <<'EOF' | sed -i "${c}c$(printf "%s" "${content//&/\\&}")" Processor.js
        nodeName: nbf10
EOF

    ((c++))
    cat <<'EOF' | sed -i "${c}c$(printf "%s" "${contents//&/\\&}")" Processor.js
        nodeName: nbf10
EOF
    ((c++))
    cat <<'EOF' | sed -i "${c}c$(printf "%s" "${contentt//&/\\&}")" Processor.js
        nodeName: nbf10
EOF

done









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

#docker-compose -f docker-compose.yaml up -d


docker tag pbft-handler:latest 10.210.0.37:5000/pbft-handler:latest
docker tag pbft-client:latest 10.210.0.37:5000/pbft-client:latest
docker push 10.210.0.37:5000/pbft-client:latest
docker push 10.210.0.37:5000/pbft-handler:latest

kubectl create deployment handler --image=10.210.0.37:5000/pbft-handler:latest


kubectl create deployment client --image=10.210.0.37:5000/pbft-client:latest


var=$(pwd)
echo "The current working directory $var."



content="- "${ip[0]}
#content="- 10.210.12.231"

    cat <<'EOF' | sed -i "14c$(printf "%s" "${content//&/\\&}")" handler.yaml
        nodeName: nbf10
EOF

    cat <<'EOF' | sed -i "14s/^/      /" handler.yaml
          
EOF


    cat <<'EOF' | sed -i "14c$(printf "%s" "${content//&/\\&}")" client.yaml
        nodeName: nbf10
EOF

    cat <<'EOF' | sed -i "14s/^/      /" client.yaml
          
EOF



kubectl delete svc client-service cert-process-service
kubectl apply -f handler.yaml
kubectl apply -f client.yaml
