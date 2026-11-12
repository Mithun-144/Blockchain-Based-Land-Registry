var invokeTx = require('../helper/invoke')
var queryTx = require('../helper/query')
var registerUser = require('../helper/registerUser')
var enrollAdmin = require('../helper/enrollAdmin')
var enrollUsers = require('../helper/test')
var userList = require('../helper/userList')
 exports.invoke = async (req, res) => {
     let data = req.body
     var msg = await invokeTx.invoke(data.fcn, data.args, data.user, data.ccname, data.channel, data.cfgpath, data.local, data.mspId)
     res.send(msg)
 }
//exports.invoke = async (req, res) => {
   // let data = req.body
   // console.log("args", data.args)
    //var msg = await invokeTx.main(data.fcn, data.args, data.user, data.ccname, data.channel, data.mspId,data.co,data.arg)
    //console.log("msg",msg)
  //  res.send(msg)
//}
exports.query = async (req, res) => {
    let data = req.body
    var msg = await queryTx.query(data.fcn, data.args, data.user, data.ccname, data.channel, data.cfgpath, data.local, data.mspId)
    res.send(msg)
}
exports.enroll = async (req, res) => {
    let data = req.body
    var msg = await enrollAdmin.enroll(data.caname, data.cfgpath, data.mspId)
    res.send(msg)
}
exports.register = async (req, res) => {
    let data = req.body
    var msg = await registerUser.register(data.user, data.caname, data.cfgpath, data.mspId)
    res.send(msg)
}
exports.enrollUsers = async (req, res) => {
    let data = req.body
    var msg = await enrollUsers.test(data)
    res.send(msg)
}
exports.list = async (req, res) => {
    let data = req.body
    var msg = await userList.userlist()
    res.send(msg)
}

const fs = require('fs');
const path = require('path');

exports.health = (_req, res) => {
    const ccpPath = process.env.FABRIC_DOCKER_CCP || '';
    const ccpExists = ccpPath ? fs.existsSync(ccpPath) : true;
    const walletExists = fs.existsSync(path.join(process.cwd(), 'wallet'));
    const ok = ccpExists && walletExists;
    res.status(ok ? 200 : 503).json({
        sFlag: ok,
        status: ok ? 'UP' : 'DEGRADED',
        service: 'nbf-samplerest',
        dockerMode: Boolean(process.env.FABRIC_DOCKER_CCP),
        ccpExists,
        walletExists,
        timestamp: new Date().toISOString()
    });
};
