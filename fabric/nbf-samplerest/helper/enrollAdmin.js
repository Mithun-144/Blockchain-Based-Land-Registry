/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const path = require('path');
const { resolveCcp } = require('./ccpResolver');

async function enroll(caname, cfgpath, mspId) {
    try {
        console.log("here");
        const { ccp } = resolveCcp(__dirname, cfgpath);

        const caInfo = ccp.certificateAuthorities[caname];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        const walletPath = path.join(process.cwd(), "wallet/" + mspId);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const identity = await wallet.get('admin');
        if (identity) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return ('Admin identity exists in wallet');
        }

        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: mspId,
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        return ('Successfully enrolled admin user "admin" and imported it into the wallet');

    } catch (error) {
        return (`Failed to enroll admin user "admin": ${error}`);
    }
}
exports.enroll = enroll;
