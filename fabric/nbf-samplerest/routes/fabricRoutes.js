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
router.get('/health', samplecontroller.health);
router.get('/userList', samplecontroller.list);

module.exports = router;
