
// 'use strict';

// const { Wallets } = require('fabric-network');
// const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const { throws } = require('assert');
//let filenames = fs.readdirSync(Wallet)
async function userlist() {
    try {
// const ccpPath = path.resolve(__dirname, cfgpath);
// console.log(ccpPath)

// const ccpPath = path.resolve(__dirname, '..', '..','fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
//const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
//const walletPath = path.join(process.cwd(),"wallet/"+ mspId);
//const wallet =  await Wallets.newFileSystemWallet(walletPath);
//console.log(`Wallet path: ${walletPath}`);
let filenames =fs.readdirSync("./wallet/")
 let Files = []
  //fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff logic 2

var name = { } 
console.log("\nFilenames in directory:");
 filenames.forEach((file) => {
     console.log("File:", file);
    name[file] = []
    let subdir =fs.readdirSync("./wallet/"+file+"/")
     console.log("Subdir ",subdir)
    subdir.forEach((file)=>{ 
    console.log("File:", file);
    Files.push(file)})
    name[file] = (Files)
    Files = []
});

console.log(name)
return (name)


///dooooooo=================================================================================== logic 1
// let openedDir = fs.opendirSync("../wallet/"+mspId);
// console.log("\nPath of the directory:", openedDir.path);
// console.log("Files Present in directory:");
  
// let filesLeft = true;
// while (filesLeft) {
//   // Read a file as fs.Dirent object
//   let fileDirent = openedDir.readSync() ;
//  // console.log(fileDirent)
//  // console.log("in")
//   // If readSync() does not return null
//   // print its filename
//   if (fileDirent != null)
//     console.log("Name:", fileDirent.name);
//     for(let i =o ,fileDirent)

  
  // If the readSync() returns null
  // stop the loop
//   else filesLeft = false;
// }
// //return JSON.stringify({"Users present in " :mspId,})
//     }
    

    }
    
    catch (error) {
        console.error(`Failed to get  user "": ${error}`);
        return JSON.stringify({"error":error,sFlag:false})
        // process.exit(1);
    }
}
//userlist("/home/cdac/Desktop/practice/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json","Org1MSP");
exports.userlist= userlist



//both logic works 