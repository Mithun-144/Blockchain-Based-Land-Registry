#!/bin/bash



echo "EEUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU  manupulation devmode start   #############"

# Replace "//add ip" in client.js
cd ./sawtooth-core/docker/compose/

add_ip_line=$(grep -n "//add ip" client.js | cut -d ":" -f 1)

if [[ -z "$add_ip_line" ]]; then
  echo "Line '//add ip' not found in client.js"
  exit 1
fi

add_ip_content="const ip = \"rest-api\";"

sed -i "${add_ip_line}s|.*|$add_ip_content|" client.js

# Replace "//add url" and "//start tp" in Processor.js
cd ./Handler/

# Replace "//add url"
add_url_line=$(grep -n "//add url" Processor.js | cut -d ":" -f 1)

if [[ -z "$add_url_line" ]]; then
  echo "Line '//add url' not found in Processor.js"
  exit 1
fi

add_url_content="const addressf = 'tcp://validator:4004';"

sed -i "${add_url_line}s|.*|$add_url_content|" Processor.js

# Replace "//start tp"
start_tp_line=$(grep -n "//start tp" Processor.js | cut -d ":" -f 1)

if [[ -z "$start_tp_line" ]]; then
  echo "Line '//start tp' not found in Processor.js"
  exit 1
fi

start_tp_content="const transactionProcessorf = new TransactionProcessor(addressf);\n\
transactionProcessorf.addHandler(new Handler());\n\
transactionProcessorf.start();"

sed -i "${start_tp_line}s|.*|$start_tp_content|" Processor.js

echo "############################# Manipulation complete ###############################"
