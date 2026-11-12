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




echo "EEUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU dummy_run.sh start #############"









#######################################################################################################################







kubectl apply -f ./sawtooth-core/docker/compose/sawtooth-create-pbft-keys.yaml

sleep 10

#kubectl get pods |grep pbft-keys > ./sawtooth-core/docker/compose/text.txt
kubectl get pods |grep pbft-keys >> ./sawtooth-core/docker/compose/text.txt


#kubectl get pods | grep pbft-keys | sed '1{/^$/d;}' >> ./sawtooth-core/docker/compose/text.txt

#kubectl get pods | grep pbft-keys > ./sawtooth-core/docker/compose/temp.txt
#sed -i '1{/^$/d;}' ./sawtooth-core/docker/compose/temp.txt
#cat ./sawtooth-core/docker/compose/temp.txt >> ./sawtooth-core/docker/compose/text.txt
#rm ./sawtooth-core/docker/compose/temp.txt




file_path=./sawtooth-core/docker/compose/text.txt
# Read the first line of the file
last_line=$(tail -n 1 "$file_path")

# Extract the first word from the line
first_word=$(echo "$last_line" | awk '{print $1}')

# Print the first word
echo "First word: $first_word"


echo "############################################### GENERATED KEYS ######################################################"

sleep 20

#kubectl logs $first_word > ./sawtooth-core/docker/compose/new.txt
#kubectl logs $first_word | sed '1d' >> ./sawtooth-core/docker/compose/new.txt
kubectl logs $first_word >> ./sawtooth-core/docker/compose/new.txt


sleep 5

while IFS= read -r line;do
        echo "  $line" >>  ./sawtooth-core/docker/compose/pbft-keys-configmap.yaml
done < "./sawtooth-core/docker/compose/new.txt"
echo "completed"

sleep 5
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


file="./sawtooth-core/docker/compose/pbft_ip.yaml"


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
done < "sawtooth-core/docker/compose/pbft_ip.yaml"




lengthd=${#array_ip[@]}

# Iterate over the arrays
for ((i=0; i<lengthd; i++))
do
    # Access elements from both arrays using the same index
    element="${array_ip[$i]}"
    content="- "${ip[$i]}
    echo "$count"
    cat <<'EOF' | sed -i "${element}c$(printf "%s" "${content//&/\\&}")" sawtooth-core/docker/compose/pbft_ip.yaml
EOF

    cat <<'EOF' | sed -i "${element}s/^/      /" sawtooth-core/docker/compose/pbft_ip.yaml
          
EOF
done



echo "#################################### FILE UPDATED ############################################"


kubectl apply -f ./sawtooth-core/docker/compose/pbft_ip.yaml


echo "#################################### NETWORK IS CREATING ..  ############################################"
