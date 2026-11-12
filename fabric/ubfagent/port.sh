echo $1
curl --location --request POST 'http://'$1'/api/users/admin/init' \
--header 'Content-Type: application/json' \
--data-raw '{
    "Username": "admin",
    "Password":"cdac@123"
}'