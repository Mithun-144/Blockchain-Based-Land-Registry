'use strict';
const fs = require('fs');
const ipfsConfig = require('./ipfs-config');
var ipfsAPI = require('ipfs-api')
//var ipfsAPI=require('ipfs-http-client');
//var ipfsAPI = require('ipfs-api')

var ipfs
//ipfs = ipfsAPI({host:'127.0.0.1', port:'5001', protocol: 'http'});
  ipfs = ipfsAPI({ host: ipfsConfig.host, port: ipfsConfig.port, protocol: ipfsConfig.protocol });
// async function ipfsConnection(){
// //ipfs = ipfsAPI({host:'10.244.1.245', port:'7080', protocol: 'http'}) // leaving out the arguments will default to these values
// console.log(ipfs.id()); 

// }


/**ORIGINAL WORKING */
var storeFile = async function(file,callback){

    let cont = fs.readFileSync(file);

    cont = new Buffer(cont);
    let buff = new Buffer(cont, 'base64');  
    //cont = buff.toString('ascii');
    //console.log(cont.toString('ascii'));
    var result;
    
    ipfs.add(cont, function (err, files) {
      console.log(files);

      //console.log("----------------"+files[0].hash);
      result = files[0].hash;

       callback(result);
    })
};


var storeFile_by_Ameer = async function (file) {

    return new Promise((resolve, reject) => {
  
      let cont = fs.readFileSync(file);
  
      cont = new Buffer(cont);
      //let buff = new Buffer(cont, 'base64');
      //cont = buff.toString('ascii');
      //console.log(cont.toString('ascii'));
      var result;
      ipfs.add(cont, function (err, files) {
        if(err){
          reject(err)
        }
         console.log(files);
  
       console.log("----------------"+files[0].hash);
        result = files[0].hash;
        resolve(result)
      })
  
    })
  };
var fetchFile = function fetchFile(hash, callback) {

  //console.log(hash);
  ipfs.get(hash, (err, files) => {
    var content;
    if (err) {
      //throw err
      callback({ "status": "Failed", "base64": "" });
    }
    else {
      files.forEach((file) => {
        content = Buffer.from(file.content.toString());
        //console.log(Buffer.from(file.content.toString(),'base64')); 
        console.log(content.toString('base64'));
        //fs.writeFileSync("/tmp/pos",content.toString('base64')) ;   
        callback({ "status": "Success", "base64": file.content.toString() });

      })
    };
  });

  //  var html = '<html><embed src="/tmp/PoS.pdf" type="application/pdf"></html>';

  //               res.contentType("application/html");
  //               res.send(html);
  /*  console.log(validCID.toString());
    ipfs.get("\""+validCID+"\"", function (err, files) {
        files.forEach((file) => {
          console.log(file.content.toString('utf8'))
          //return file.content.toString('utf8');
         // callback(file.content.toString('utf8'));
        })
    })  */
}
var fetchFileNew = function fetchFileNew(hash, callback) {

  //console.log(hash);
  ipfs.get(hash, (err, files) => {
    var content;
    if (err) {
      //throw err
      callback({ "status": "Failed", "base64": "" });
    }
    else {
      files.forEach((file) => {
        content = Buffer.from(file.content.toString());
        //console.log(Buffer.from(file.content.toString(),'base64')); 
        //console.log(content.toString('base64'));
        //fs.writeFileSync("/tmp/pos",content.toString('base64')) ;   
        callback({ "status": "Success", "base64": content.toString('base64')});

      })
    };
  });

  //  var html = '<html><embed src="/tmp/PoS.pdf" type="application/pdf"></html>';

  //               res.contentType("application/html");
  //               res.send(html);
  /*  console.log(validCID.toString());
    ipfs.get("\""+validCID+"\"", function (err, files) {
        files.forEach((file) => {
          console.log(file.content.toString('utf8'))
          //return file.content.toString('utf8');
         // callback(file.content.toString('utf8'));
        })
    })  */
}
exports.storeFile = storeFile;
exports.fetchFile = fetchFile;
exports.fetchFileNew = fetchFileNew;

exports.storeFile_by_Ameer = storeFile_by_Ameer;
