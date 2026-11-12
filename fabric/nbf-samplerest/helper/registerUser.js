'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { resolveCcp } = require('./ccpResolver');

async function register(user, caname, cfgpath, mspId) {
    try {
        const { ccp } = resolveCcp(__dirname, cfgpath);

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
