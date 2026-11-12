#!/bin/sh
echo "Consensus123:$1" > /home/gandhali/Documents/con.txt
sshpass -p "Ubf_team" ssh nbf1@10.210.12.29  "sh /home/nbf1/singlenode1.sh $1" 


