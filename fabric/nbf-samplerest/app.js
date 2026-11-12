var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const { appendFile } = require('fs');
var ipfsClient = require('./ipfs_client');
var bodyParser = require('body-parser')
 fs = require('fs')


var fabricRouter = require('./routes/fabricRoutes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(cors({

    origin: '*'

}));
// app.use(bodyParser.json())
app.use(bodyParser.json({ extended: false, limit: '500mb' }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/fabric/v1', fabricRouter);

// catch 404 and forward to error handler

app.post('/store', async (req, res) => { //storing the data
  console.log('work')
  
  let fileName = req.body.fileName
  let fileContents = req.body.fileContents
  // console.log(req.body)
  console.log(fileName)
  let bufferObj = Buffer.from(fileContents, "base64")
  
  //let decodedString = bufferObj.toString("utf8")
  // console.log("The decoded string:", decodedString)
  fs.writeFileSync(fileName, fileContents, function (err) {
      if (err) return console.log(err);
      console.log(fileName)
      console.log('file is saved');
  });
  var posHash
  await ipfsClient.storeFile_by_Ameer(fileName).then((posH) => {
      console.log(posH);
      posHash = posH;
      // data["posHash"] = posHash;
      
      console.log('inside ipfs file storage function status ', posHash);
      res.send({"hash":posHash})
  }).catch((err) => {
      console.log(err);
      //data["posHash"] = null;err
      shouldReturnFromFunction = true
      res.send('\'Failed to store record in ipfs\'')

  })

  // res.status(200).send('store data')
})



app.get('/retrive', (req, res) => {  // fetching the data
  let ipfshash = req.body.ipfshash

  ipfsClient.fetchFile(ipfshash, function (content) {
      fs.writeFileSync("fileName.docx" ,content.base64, function (err) {
          if (err) return console.log(err);
          console.log('file is saved');
      });
      //if(!err) {
      // console.log('ipfs chain code file ' + content.base64);
      res.send(content);
      //} else
      //    console.log("Error fetching file from IPFS " + err);
  });    
  // res.status(200).send('retrive data')
})
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
