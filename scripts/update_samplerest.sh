#!/usr/bin/env bash
set -e

SAMPLEREST_DIR="$HOME/.servers/nbf-samplerest"

if [ ! -d "$SAMPLEREST_DIR" ]; then
  echo "Error: Directory $SAMPLEREST_DIR not found!"
  exit 1
fi

echo "Updating nbf-samplerest gateway on Ubuntu VM..."

# 1. Update routes/fabricRoutes.js (allow POST on querycc)
cat << 'EOF' > "$SAMPLEREST_DIR/routes/fabricRoutes.js"
var express = require('express');
var router = express.Router();
var samplecontroller = require('../controllers/samplecontroller');
const auth = require("../auth");
const shell = require('shelljs');

router.post('/enrolladmin', samplecontroller.enroll);
router.post('/registeruser', samplecontroller.register);
router.post('/invokecc', samplecontroller.invoke);
router.all('/querycc', samplecontroller.query);
router.post('/rmwallet', function (req, res) {
    shell.exec('rm -rf ./wallet');
    res.send("wallet removed");
});
router.post('/enrollUsers', samplecontroller.enrollUsers);
router.get('/userList', samplecontroller.list);

module.exports = router;
EOF

# 2. Update helper/invoke.js (unpack arguments properly)
cat << 'EOF' > "$SAMPLEREST_DIR/helper/invoke.js"
'use strict';

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function invoke(fcn, args, user, Contract, channel, cfgpath, local, mspId) {
    try {
        const ccpPath = path.resolve(__dirname, cfgpath);
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), "wallet/" + mspId);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const identity = await wallet.get(user);
        if (!identity) {
            console.log('An identity for the user', user, 'does not exist in the wallet');
            return JSON.stringify({ error: `Identity ${user} not found in wallet`, sFlag: false });
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: user, discovery: { enabled: local, asLocalhost: local } });

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
EOF

# 3. Update helper/query.js (unpack arguments & clean response)
cat << 'EOF' > "$SAMPLEREST_DIR/helper/query.js"
'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function query(fcn, args, user, Contract, channel, cfgpath, local, mspId) {
    try {
        console.log("Querying as user:", user, "fcn:", fcn);
        const ccpPath = path.resolve(__dirname, cfgpath);
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), "wallet/" + mspId);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const identity = await wallet.get(user);
        if (!identity) {
            console.log('An identity for the user', user, 'does not exist in the wallet');
            return JSON.stringify({ error: `Identity ${user} not found in wallet`, sFlag: false });
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: user, discovery: { enabled: local, asLocalhost: local } });

        const network = await gateway.getNetwork(channel);
        const contract = network.getContract(Contract);

        const queryArgs = Array.isArray(args) ? args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)) : (args ? [String(args)] : []);
        const result = await contract.evaluateTransaction(fcn, ...queryArgs);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        await gateway.disconnect();
        return JSON.stringify({ result: result.toString(), sFlag: true });
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        return JSON.stringify({ error: error.message || String(error), sFlag: false });
    }
}

exports.query = query;
EOF

# 4. Update helper/registerUser.js (graceful re-enrollment & TLS)
cat << 'EOF' > "$SAMPLEREST_DIR/helper/registerUser.js"
'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function register(user, caname, cfgpath, mspId) {
    try {
        const ccpPath = path.resolve(__dirname, cfgpath);
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const caInfo = ccp.certificateAuthorities[caname];
        if (!caInfo) {
            throw new Error(`CA ${caname} not found in connection profile`);
        }
        const caTLSCACerts = caInfo.tlsCACerts ? caInfo.tlsCACerts.pem : undefined;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        const walletPath = path.join(process.cwd(), "wallet/" + mspId);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const userIdentity = await wallet.get(user);
        if (userIdentity) {
            console.log(`An identity for the user "${user}" already exists in the wallet.`);
            return JSON.stringify({ "status": "user already enrolled", "sFlag": true });
        }

        let adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet. Auto-enrolling admin...');
            const enrollAdmin = require('./enrollAdmin');
            await enrollAdmin.enroll(caname, cfgpath, mspId);
            adminIdentity = await wallet.get('admin');
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        let secret;
        try {
            secret = await ca.register({
                affiliation: '',
                enrollmentID: user,
                role: 'client'
            }, adminUser);
        } catch (regErr) {
            const errMsg = regErr.message || String(regErr);
            if (errMsg.includes('already registered')) {
                console.log(`User "${user}" already registered with CA, using username as fallback enrollment secret.`);
                secret = user;
            } else {
                throw regErr;
            }
        }

        const enrollment = await ca.enroll({
            enrollmentID: user,
            enrollmentSecret: secret
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: mspId,
            type: 'X.509',
        };
        await wallet.put(user, x509Identity);
        console.log(`Successfully registered and enrolled user "${user}" and imported it into the wallet.`);
        return JSON.stringify({ "status": "user created", "sFlag": true });

    } catch (error) {
        console.error(`Failed to register user "${user}":`, error);
        return JSON.stringify({ "error": error.message || String(error), "sFlag": false });
    }
}

exports.register = register;
EOF

echo "Restarting samplerest service with pm2..."
pm2 restart samplerest

echo "All done! Samplerest is updated and running."
