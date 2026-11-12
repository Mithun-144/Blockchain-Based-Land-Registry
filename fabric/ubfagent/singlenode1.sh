#!/bin/bash

# Declare the comma-separated string
myString="$3"

# Set the delimiter to a comma
IFS=','

# Read the values into an array
read -ra myArray <<< "$myString"

# Print the elements of the array
for element in "${myArray[@]}"
do
  echo "Element: $element"
done

# Set the path to your kubeconfig file
KUBECONFIG="$HOME/.servers/ubfagent/kubeconfig/config"

# Set the KUBECONFIG environmental variable
export KUBECONFIG="$KUBECONFIG"




echo "EEUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU SingleNode1 .sh start #############"

echo "$1"
echo " data of array of ip isssssssssssssss"

echo " ip of is       $3"





#dataArrayString="$1"
#ipsArrays="$3"
#echo "ip valies : $ipsArrays"



# Parse the data string back into an array
#IFS=',' read -ra data <<< "$dataArrayString"




# Parse the data string back into an array



#echo "$ipsArrays"
#echo "paramater 0th is : ${ipsArrays[0]}"
  #cd sawtooth-core/docker/compose
       #echo "inside" pwd
#       docker-compose up
#sudo systemctl start docker.service

if [ "$2" == "test" ]
then 
case "$1" in

      "devmode")docker-compose  -f sawtooth-core/docker/compose/sawtooth-default.yaml up -d
      echo "========================================================"
      echo "-----------------sawtooth-default is up------------"
      echo "========================================================"
      ;;
      "poet")docker-compose -f sawtooth-core/docker/compose/sawtooth-default-poet.yaml up -d
      echo "========================================================"
      echo "-----------------sawtooth-default-poet is up------------"
      echo "========================================================"
      ;;
      "pbft")docker-compose -f sawtooth-core/docker/compose/pbft.yaml up -d
      echo "========================================================"
      echo "-----------------sawtooth-default-pbft is up------------"
      echo "========================================================"
esac

else 
case "$1" in


      "poet")docker-compose -f sawtooth-core/docker/compose/sawtooth-default-poet.yaml up -d
      echo "========================================================"
      echo "-----------------sawtooth-default-poet is up------------"
      echo "========================================================"
      ;;
      "pbft") bash dummy_run.sh "$3"
      echo "production part"      
      echo "========================================================"
      echo "-----------------sawtooth-default-pbft is up------------"
      echo "========================================================"
esac


fi
