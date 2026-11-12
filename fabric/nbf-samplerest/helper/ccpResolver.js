'use strict';

const fs = require('fs');
const path = require('path');

function resolveCcp(callerDir, cfgpath) {
    const dockerCcp = process.env.FABRIC_DOCKER_CCP;
    const requested = String(cfgpath || '');
    const isDefaultLocalProfile =
        !requested ||
        requested.includes('channel1_connection_for_nodesdk.json') ||
        requested.includes('channel1_connection_for_docker.json');

    if (dockerCcp && fs.existsSync(dockerCcp) && isDefaultLocalProfile) {
        return {
            ccpPath: dockerCcp,
            ccp: JSON.parse(fs.readFileSync(dockerCcp, 'utf8')),
            isDocker: true
        };
    }

    const ccpPath = path.resolve(callerDir, requested);
    return {
        ccpPath,
        ccp: JSON.parse(fs.readFileSync(ccpPath, 'utf8')),
        isDocker: Boolean(dockerCcp && fs.existsSync(dockerCcp))
    };
}

function resolveDiscoveryOptions(local, isDocker) {
    const requestedLocal = local === true || local === 'true';
    if (isDocker) {
        const disableDiscovery = process.env.FABRIC_DISABLE_DISCOVERY === 'true';
        return {
            enabled: !disableDiscovery && requestedLocal,
            asLocalhost: false
        };
    }
    return {
        enabled: requestedLocal,
        asLocalhost: requestedLocal
    };
}

module.exports = { resolveCcp, resolveDiscoveryOptions };
