'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const { resolveCcp, resolveDiscoveryOptions } = require('./ccpResolver');

async function invoke(fcn, args, user, Contract, channel, cfgpath, local, mspId) {
    try {
        const { ccp, isDocker } = resolveCcp(__dirname, cfgpath);

        const walletPath = path.join(process.cwd(), "wallet/" + mspId);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const identity = await wallet.get(user);
        if (!identity) {
            console.log('An identity for the user', user, 'does not exist in the wallet');
            return JSON.stringify({ error: `Identity ${user} not found in wallet`, sFlag: false });
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: user,
            discovery: resolveDiscoveryOptions(local, isDocker)
        });

        const network = await gateway.getNetwork(channel);
        const contract = network.getContract(Contract);

        console.log(`Invoking ${fcn} as ${user} with args:`, args);
        const txArgs = Array.isArray(args) ? args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)) : (args ? [String(args)] : []);
        var result = await contract.submitTransaction(fcn, ...txArgs);
        console.log('Transaction has been submitted successfully:', result.toString());

        await gateway.disconnect();
        return JSON.stringify({ "result": result.toString(), "sFlag": true });
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        return JSON.stringify({ "error": error.message || String(error), "sFlag": false });
    }
}

exports.invoke = invoke;
