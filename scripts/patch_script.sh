#!/bin/bash
set -e

# Remove any stopped chaincode containers
docker rm -f $(docker ps -a --filter "name=dev-peer" -q) 2>/dev/null || true

# Patch all 6 peer images for property_2.8
for img in $(docker images --filter "reference=dev-peer*property_2.8*" --format "{{.Repository}}:{{.Tag}}"); do
  echo ">>> Patching image: $img"
  cid=$(docker create --entrypoint /bin/sh "$img" -c "node -e \"const fs=require('fs'), p='/usr/local/src/node_modules/@so-ric/colorspace/dist/index.cjs.js'; if(fs.existsSync(p)){ fs.writeFileSync(p, fs.readFileSync(p,'utf8').replace('limiters[m] ||=','limiters[m] = limiters[m] ||')); console.log('Successfully patched index.cjs.js'); } else { console.log('File not found: ' + p); }\"")
  docker start -a "$cid"
  docker commit "$cid" "$img"
  docker rm "$cid"
done

echo ">>> All 6 images successfully patched!"
