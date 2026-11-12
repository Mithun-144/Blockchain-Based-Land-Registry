#!/bin/bash



echo "EEUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU   manupulation pbft start    #############"


# Replace "//add ip" in client.js
cd ./sawtooth-core/docker/compose/

add_ip_line=$(grep -n "//add ip" client.js | cut -d ":" -f 1)

if [[ -z "$add_ip_line" ]]; then
  echo "Line '//add ip' not found in client.js"
  exit 1
fi

add_ip_content="const ip = \"rest-api-0\";"

sed -i "${add_ip_line}s|.*|$add_ip_content|" client.js

# Replace "//add url" and "//start tp" in Processor.js
cd ./Handler/

# Replace "//add url"
add_url_line=$(grep -n "//add url" Processor.js | cut -d ":" -f 1)

if [[ -z "$add_url_line" ]]; then
  echo "Line '//add url' not found in Processor.js"
  exit 1
fi

add_url_content="const addressf = 'tcp://validator-0:4004';\n\
const addresss = 'tcp://validator-1:4004';\n\
const address_second = 'tcp://validator-2:4004';\n\
const address_third = 'tcp://validator-3:4004';\n\
const addresss_fourth = 'tcp://validator-4:4004';"

sed -i "${add_url_line}s|.*|$add_url_content|" Processor.js

# Replace "//start tp"
start_tp_line=$(grep -n "//start tp" Processor.js | cut -d ":" -f 1)

if [[ -z "$start_tp_line" ]]; then
  echo "Line '//start tp' not found in Processor.js"
  exit 1
fi

start_tp_content="const transactionProcessorf = new TransactionProcessor(addressf);\n\
transactionProcessorf.addHandler(new Handler());\n\
transactionProcessorf.start();\n\
\n\
const transactionProcessors = new TransactionProcessor(addresss);\n\
transactionProcessors.addHandler(new Handler());\n\
transactionProcessors.start();\n\
\n\
const transactionProcessor_second = new TransactionProcessor(address_second);\n\
transactionProcessor_second.addHandler(new Handler());\n\
transactionProcessor_second.start();\n\
\n\
const transactionProcessor_third = new TransactionProcessor(address_third);\n\
transactionProcessor_third.addHandler(new Handler());\n\
transactionProcessor_third.start();\n\
\n\
const transactionProcessor_fourth = new TransactionProcessor(addresss_fourth);\n\
transactionProcessor_fourth.addHandler(new Handler());\n\
transactionProcessor_fourth.start();"

sed -i "${start_tp_line}s|.*|$start_tp_content|" Processor.js




echo "############################# Manupulation complete ###############################"
