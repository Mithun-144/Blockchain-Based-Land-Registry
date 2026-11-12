/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const { Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const fs = require("fs");
const path = require("path");
const { throws } = require("assert");
var enrollAdmin = require('./enrollAdmin');
const { resolveCcp } = require('./ccpResolver');
async function test(arr) {
  //console.log(arr)
  for (let res = 0; res < arr.length; res++) {
    console.log(arr.length);
	  console.log(arr)
    if(arr[res].admin===true){
        
        var msg = await enrollAdmin.enroll(arr[res].caname,arr[res].cfgpath,arr[res].mspId,arr[res].role,arr[res].roles)
    }
    for (let cdac = 0; cdac < arr[res].user.length; cdac++) {
      // console.log(arr[res][cfgpath])

      try {
        // load the network configuration
        const { ccpPath, ccp } = resolveCcp(__dirname, arr[res].cfgpath);
        console.log(ccpPath);

        // const ccpPath = path.resolve(__dirname, '..', '..','fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        // ccp loaded by resolveCcp
        // const ccp = JSON.parse(fs.readFileSync(`/home/${process.env.USER}/fabric-samples/test-network/organizations/peerOrganizations/cm-in/connection-cm.json`, "utf8"));

        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities[arr[res].caname].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), "wallet/" + arr[res].mspId);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get(arr[res].user[cdac]);
        if (userIdentity) {
          console.log(
            'An identity for the user "" already exists in the wallet'
          );
          throws;
        }

        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get("admin");
        if (!adminIdentity) {
          console.log(
            'An identity for the admin user "admin" does not exist in the wallet'
          );
          console.log("Run the enrollAdmin.js application before retrying");
          return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet
          .getProviderRegistry()
          .getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, "admin");
//             enrollmentID: 'abcdef',affiliation: 'org1.department1',attrs: [{name: 'abac.creator',value: 'true',ecert: true}] }, adminUser);


        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register(
          {
            affiliation: "org1.department1",
            enrollmentID: arr[res].user[cdac],
            role: arr[res].role[cdac],
            attrs: [{name:arr[res].attrkey[cdac] ,value: arr[res].roles[cdac],ecert: true},{name:"approle",value:arr[res].domainroles[cdac],ecert:true}] ,
          },
          adminUser
        );
        const enrollment = await ca.enroll({
          enrollmentID: arr[res].user[cdac],
          enrollmentSecret: secret,
          attr_reqs: [{ name:arr[res].attrkey[cdac], optional: false },{name:"approle",optional:false}]
        });
        const x509Identity = {
          credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
          },
          mspId: arr[res].mspId,
          type: "X.509",
        };
        await wallet.put(arr[res].user[cdac], x509Identity);
        console.log(
          'Successfully registered and enrolled admin user "" and imported it into the wallet'
        );
        //return JSON.stringify({"status":"users created","sFlag":true})
      } catch (error) {
        console.error(`Failed to register user "": ${error}`);
        return JSON.stringify({ error: error, sFlag: false });
        // process.exit(1);
      }
    }
}
}
// const arrUser = [
//   {
//     admin:true,
//     user: ["dev12222", "aksh22221", "1akgf12", "akshani222"],
//     cfgpath:
//       "/home/cdac/mywork/vars/profiles/mychannel_connection_for_nodesdk.json",
//     mspId: "org0-example-com",
//     caname: "ca.org0.example.com",
//   },
//   {
//       admin:true,
//     user: ["j22ysto1", "ra2j1", "2errr1"],
//     cfgpath:
//       "/home/cdac/Desktop/practice/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/connection-org2.json",
//     mspId: "Org2MSP",
//     caname: "ca.org2.example.com",
//   },
// ];
// test(arrUser);

exports.test=test;
