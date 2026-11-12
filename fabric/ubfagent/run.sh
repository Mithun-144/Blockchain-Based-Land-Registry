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

#######################################################################################################################







kubectl apply -f ./sawtooth-core/docker/compose/sawtooth-create-pbft-keys.yaml

kubectl get pods |grep pbft-keys >> ./sawtooth-core/docker/compose/text.txt


file_path=./sawtooth-core/docker/compose/text.txt
# Read the first line of the file
last_line=$(tail -n 1 "$file_path")

# Extract the first word from the line
first_word=$(echo "$last_line" | awk '{print $1}')

# Print the first word
echo "First word: $first_word"

sleep 10

echo "############################################### GENERSTED KEYS ######################################################"

kubectl logs $first_word >> ./sawtooth-core/docker/compose/new.txt

 


while IFS= read -r line;do 	
        echo "  $line" >>  ./sawtooth-core/docker/compose/pbft-keys-configmap.yaml
     #echo "  $line" >>  test.yaml
done < "./sawtooth-core/docker/compose/new.txt"
echo "completed"

echo "############################################ ADDED KEY IN PBFT KEY CONFIG FILE #######################################"


kubectl apply -f ./sawtooth-core/docker/compose/pbft-keys-configmap.yaml

##########################################################################################


####################################################################################33t




#echo "count : ${array_name[@]}"


# Read the data string passed from Node.js

#ipsArrays="$1"
# Parse the data string back into an array
#IFS=',' read -ra data <<< "$ipsArrays"


length=${#ip[@]}


file="./sawtooth-core/docker/compose/pbft.yaml"


for element in "${ip[@]}"
do
  echo "Run script Element: $element"
done





# ###################################################################################33t

array_ip=()
count=0
while IFS= read -r line;do 	
         #echo "  $line" 
           ((count++))         
        if [ "$line" = "    externalIPs:" ]; then
           let "count += 1"
           array_ip+=("$count")
           ((count--))
        fi
done < "sawtooth-core/docker/compose/pbft.yaml"




lengthd=${#array_ip[@]}

# Iterate over the arrays
for ((i=0; i<lengthd; i++))
do
    # Access elements from both arrays using the same index
    element="${array_ip[$i]}"
    content="- "${ip[$i]}
    echo "$count"
    cat <<'EOF' | sed -i "${element}c$(printf "%s" "${content//&/\\&}")" sawtooth-core/docker/compose/pbft.yaml
        nodeName: nbf10
EOF

    cat <<'EOF' | sed -i "${element}s/^/      /" sawtooth-core/docker/compose/pbft.yaml
          
EOF
done



echo "#################################### FILE UPDATED ############################################"


kubectl apply -f ./sawtooth-core/docker/compose/pbft.yaml


echo "#################################### NETWORK IS CREATING ..  ############################################"

