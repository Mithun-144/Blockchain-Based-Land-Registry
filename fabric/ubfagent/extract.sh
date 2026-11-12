#!/bin/bash


#unzip ./sawtooth-core/docker/compose/$1.zip -d ./sawtooth-core/docker/compose

#tar -xzvf ./sawtooth-core/docker/compose/$1.tar.gz -C ./sawtooth-core/docker/compose
#wait '30'
#unzip ./sawtooth-core/docker/compose/$1.zip -d ./sawtooth-core/docker/compose/client

echo "first parameter is ------- $1"
echo "second parameter is ------- $2"
echo "4th parametes is --------- $4"
#docker-compose -f ./sawtooth-core/docker/compose/$1.yaml up -d 

###################################################################################################################



#Load Ubuntu:xenial Image Locally
echo "The Script to load the Docker Image is running"
cat ./ubuntuX.tar | docker load
echo "Ubuntu Image buils Successfully and ready to Sleep"

sleep 10


if [ "$2" == "test" ] && [ "$4" == "devmode" ];
then

	unzip -o ./sawtooth-core/docker/compose/$1.zip -d ./sawtooth-core/docker/compose/
	./manupulation-devmode.sh
	docker-compose -f ./sawtooth-core/docker/compose/$1.yaml up -d

elif [ "$2" == "test" ] && [ "$4" == "pbft" ];
then

	unzip -o ./sawtooth-core/docker/compose/$1.zip -d ./sawtooth-core/docker/compose/
	./manupulation-pbft.sh
	docker-compose -f ./sawtooth-core/docker/compose/$1.yaml up -d

else

	unzip -o ./sawtooth-core/docker/compose/$1.zip -d ./sawtooth-core/docker/compose/client
	./TP_dummy.sh "$3"

fi

