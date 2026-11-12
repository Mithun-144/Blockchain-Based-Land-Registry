// import * as fs from 'fs';





import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { factory, isGetAccessor } from 'typescript';
import { TextDecoder } from 'util';
const utf8Decoder = new TextDecoder();
export async function main(fcn: string, args: number[], user: string, chaincodeName: string, channelName: string, mspId: string,co:string): Promise<any> {

    console.log("channel", channelName)
    console.log("cc", chaincodeName)
    console.log("args", args)

    const file = `/home/${process.env.USER}/nbf-agent-production/wallet/${mspId}/${user}.id`;
    console.log("file",file)


    try {
        const data = fs.readFile(file, 'utf-8')
   
        console.log("file",data)

    if(!data) return `Identity ${user} not found ` ;
        const ob = await JSON.parse(await data);
        const cred: string = ob.credentials.certificate;
        console.log('cred', cred);

        const privateKey: string = ob.credentials.privateKey;
        console.log('privateKey', privateKey);

        fs.writeFile('./newwwpublickey.pem', cred, { encoding: 'utf-8' });
        fs.writeFile('./newwwprivate.pem', privateKey, { encoding: 'utf-8' });
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return {message: `Identity ${user} not found ` }
    }



    const cryptoPath = envOrDefault('CRYPTO_PATH', path.resolve(`/home/${process.env.USER}/fabric-samples/test-network/organizations/peerOrganizations/cm-in`));

    // Path to user private key directory.
    const keyDirectoryPath = envOrDefault('KEY_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@cm-in', 'msp', 'keystore'));

    // Path to user certificate.
    const certPath = envOrDefault('CERT_PATH', path.resolve(cryptoPath, 'users', 'User1@cm-in', 'msp', 'signcerts', 'cert.pem'));

    // Path to peer tls certificate.
    const tlsCertPath = envOrDefault('TLS_CERT_PATH', path.resolve(cryptoPath, 'peers', 'peer0.cm-in', 'tls', 'ca.crt'));

    // Gateway peer endpoint.
    const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051')

    // Gateway peer SSL host name override.
    const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.cm-in');


    const client = await newGrpcConnection();

    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        // Default timeouts for different gRPC calls
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 }; // 15 seconds
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 }; // 1 minute
        },
    });

    try {
        console.log('testing');
        // console.log(JSON.stringify(numbers));
        const t1 = JSON.stringify(args);
        // const t2 = JSON.parse(t1)
        console.log(t1)
console.log(gateway)


        console.log(fcn);
console.log(co)


        // Get a network instance representing the channel where the smart contract is deployed.
        const network = gateway.getNetwork(channelName);


        // Get the smart contract from the network.
        const contract = network.getContract(chaincodeName);

        // Initialize a set of at data on the ledger using the chaincode 'InitLedger' function.
        //await initLedger(contract);

        // Return all the current assets on the ledger.
        // await getAllAssets(contract);
if(co=="invoke"){
  const query=   await createAsset(contract, args, fcn)
  return query
}
else if(co=="record"){
    const query = await test(contract,args,fcn)
    return query
}
else{

   const query=  await queryAsset(contract, args, fcn)
   return query
}

  


    } finally {
        gateway.close();
        client.close();
    }

    function envOrDefault(key: string, defaultValue: string): string {
        return process.env[key] || defaultValue;
    }

    async function newGrpcConnection(): Promise<grpc.Client> {
        const tlsRootCert = await fs.readFile(tlsCertPath);
        const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
        return new grpc.Client(peerEndpoint, tlsCredentials, {
            'grpc.ssl_target_name_override': peerHostAlias,
        });
    }

    async function newIdentity(): Promise<Identity> {
        //user wallet path 
        const credentials = await fs.readFile('./newwwpublickey.pem');
        return { mspId, credentials };
    }
    async function newSigner(): Promise<Signer> {
        // const files = await fs.readdir(keyDirectoryPath);
        //user wallet path
        // const keyPath = path.resolve(keyDirectoryPath, files[0]);
        const privateKeyPem = await fs.readFile('./newwwprivate.pem');
        const privateKey = crypto.createPrivateKey(privateKeyPem);
        return signers.newPrivateKeySigner(privateKey);
    }

}
// const pass = 'test';
// const pass2 = [1, 2];

// main(pass, pass2).catch(error => {
//     console.error('******** FAILED to run the application:', error);
//     process.exitCode = 1;
// });





async function initLedger(contract: Contract): Promise<void> {
    console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');

    await contract.submitTransaction('InitLedger');

    console.log('*** Transaction committed successfully');
}

/**
 * Evaluate a transaction to query ledger state.
 */
async function getAllAssets(contract: Contract): Promise<void> {
    console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');

    const resultBytes = await contract.evaluateTransaction('GetAllAssets');

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);
}
//invoke

async function createAsset(contract: Contract, args: number[], fcn: string): Promise<void> {
    console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, Color, Size, Owner and AppraisedValue arguments');
    console.log(args)
    const resultBytes = await contract.submitTransaction(
        fcn,
        JSON.stringify(args)
    );

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);
    return result
    console.log('*** Transaction committed successfully');
}

async function test(contract: Contract, args: number[], fcn: string): Promise<string> {
    console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, Color, Size, Owner and AppraisedValue arguments');
    console.log(args)
    const resultBytes = await contract.submitTransaction(
        fcn,
        JSON.stringify(args)
    );

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);
   return result
    // const buf =Buffer.from(result,'base64')
    // return JSON.parse(buf.toString("utf8"))
    console.log('*** Transaction committed successfully');
}
async function queryAsset(contract: Contract, args: number[], fcn: string): Promise<void> {
    console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, Color, Size, Owner and AppraisedValue arguments');
    console.log(args)
    const resultBytes = await contract.evaluateTransaction(fcn, JSON.stringify(args));

    
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);
    return result

    console.log('*** Transaction evaluated successfully');
}
