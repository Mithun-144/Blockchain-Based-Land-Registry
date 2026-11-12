
const fs = require('fs');
const yaml = require('js-yaml');
var express = require('express')
var app = express()
var bodyParser = require('body-parser')
app.use(bodyParser.json({ extended: false, limit: '50mb' }));
var previouschannel = ""
const cors = require('cors');
// app.use(express.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
const { exec } = require('child_process');
const shell = require('shelljs')
//const shell = require('shelljs')
app.use(cors({
    origin: '*'
}));
app.post("/gensawtooth", function (req, res) {
    let user = req.body.user
    let platform = req.body.platform
    res.send("generated for sawtooth")


})

app.post('/deleteApp', function (req, res) {
    let set = req.body.set
    if (set === true) {
        process.chdir('/home/hyper/Desktop/ubfagnet')
        shell.exec('rm -rf spec.yaml')
        shell.exec('rm -rf vars')
        shell.exec('./minifab down')
        shell.exec('./minifab cleanup')
        process.chdir('/home/hyper/Desktop/samplerest')
        shell.exec('rm -rf wallet')
        process.chdir('/home/hyper/Desktop/ubfagnet')
        console.log("Current directory:", __dirname);

        res.send('success')
    }
    else {
        res.send('error')
    }
})
app.post('/all', function (req, res) {

    let user = req.body.user;
    let url = req.body.url;
    let db = req.body.db
    let pos = req.body.pos
    let i = req.body.i
    // let node = req.body.node
    let environment = req.body.env
    console.log("env",environment)
    console.log("in agent ", i)

    let platform = req.body.platform

    console.log("ipfs storage ", pos)
    
console.log("type of pos",typeof(pos))
console.log("db", typeof (db))
    // shell.exec('pm2 delete ipfsagent')
    //getting the platform
    let channel = req.body.channel;
    //channel name
    // for(let j=0 ; j<=channel[j];j++)


    console.log("in server", channel)
    let data = req.body.data; //JSON Obj for spec.yaml file
    console.log("data", data)
    let yamlStr = yaml.dump(data); //to convert json to yaml
    console.log("yaml", yamlStr)
    let org1 = data.fabric.peers[0] //get the first peer from the peers list
    org1 = org1.substring(org1.indexOf(".") + 1); //getting org name from the peer
    console.log(org1)
    //sawtooth
    console.log("platform", platform)
    if(environment === "test"){
    if (platform === "sawtooth") {
        console.log("swatooth commands")
        res.send("generated for sawtooth")
    }

    else {

        //fabric


        fs.writeFileSync('spec.yaml', yamlStr, 'utf8'); //storing it in spec.yaml config file



        if (db === true) {
            if (i == 0) {
                shell.exec('./minifab generate -o ' + org1 + ' -i 2.2.3 -c ' + channel + ' -s couchdb' + ' -e true | tee out.txt')
                res.send("generate")
            }
            else if (i == 1) {
                shell.exec('./minifab netup | tee out.txt')
                res.send("netup")
            }
            else {

                shell.exec('./minifab create -c ' + channel + ' | tee out.txt')
                shell.exec('./minifab join ' + ' | tee out.txt')
                shell.exec('./minifab anchorupdate' + ' | tee out.txt')
                shell.exec('./minifab profilegen -c ' + channel + ' | tee out.txt')
            }
            res.send("channel")


            if (i == 3) {
                console.log("in 3")
                shell.exec('./minifab explorerup')
                shell.exec('./minifab portainerup')
                let file = fs.readFileSync("./out.txt", "utf8");
                let arr = file.split(/\r?\n/);
                arr.forEach((line, idx) => {
                    if (line.includes("Website address")) {
                        // console.log(line)
                        console.log(line.substring(21, 48))
                        res.send({ "Explorer URL": line.substring(21, 48) })
                    }
                })
            }
            if (i == 4) {
                console.log("in 3")

                // shell.exec('./minifab explorerup')
                shell.exec('./minifab portainerup | out.txt')


                let file = fs.readFileSync("./out.txt", "utf8");
                let arr = file.split(/\r?\n/);
                arr.forEach((line, idx) => {
                    if (line.includes("Website address")) {
                        // console.log(line)
                        console.log(line.substring(37, 61))
                        console.log("here", line.substring(44, 60))

                        //    shell.exec('curl http POST line.substring(44, 60)/api/auth Username="admin" Password="cdac@123"')
                        // shell.exec('curl - X http POST 10.244.0.52:7006/api/users/admin/init Username="admin" Password="adminpassword"')
                        shell.exec('sh port.sh ' + line.substring(44, 61))

                        res.send({ "Portainer URL": line.substring(37, 61) })
                    }
                })
            }

        }
        else {
            if (i == 0) {
                shell.exec('./minifab generate -o ' + org1 + ' -i 2.2.3 -c ' + channel + ' -e true | tee out.txt')
                res.send("generate")
            }
            if (i == 1) {
                shell.exec('./minifab netup | tee out.txt')
                res.send("netup")
            }
            if (i == 2) {
                if (previouschannel == channel) {
                    res.send("channel")
                }
                else {
                    console.log("channle ", channel)
                    shell.exec('./minifab create -c ' + channel + ' | tee out.txt')
                    shell.exec('./minifab join ' + ' | tee out.txt')
                    shell.exec('./minifab anchorupdate' + ' | tee out.txt')
                    shell.exec('./minifab profilegen -c ' + channel + ' | tee out.txt')
                    previouschannel = channel
                    res.send("channel")
                }
            }
            if (i == 3) {
                console.log("in 3")

                shell.exec('./minifab explorerup  |tee out.txt')

                let file = fs.readFileSync("./out.txt", "utf8");
                let arr = file.split(/\r?\n/);
                arr.forEach((line, idx) => {
                    if (line.includes("Website address")) {
                        // console.log(line)
                        console.log(line.substring(21, 48))
                        res.send({ "Explorer URL": line.substring(21, 48) })
                    }
                })
            }
            if (i == 4) {
                console.log("in 3")

                // shell.exec('./minifab explorerup')
                shell.exec('./minifab portainerup |  tee out.txt')


                let file = fs.readFileSync("./out.txt", "utf8");
                let arr = file.split(/\r?\n/);
                arr.forEach((line, idx) => {
                    if (line.includes("UI address")) {
                        // console.log(line)
                        console.log(line.substring(37, 61))
                        console.log("here", line.substring(44, 60))
                        // shell.exec('curl http POST line.substring(44, 60)/#!/init/admin Username="ameers" Password="cdac@123" Confirm password="cdac@123')

                        shell.exec('sh port.sh ' + line.substring(44, 61))
                        // shell.exec('http POST 10.244.0.52:7006/api/users/admin/init Username="admin" Password="adminpassword"')
                        res.send({ "Portainer URL:": line.substring(37, 61) })
                    }
                })

            }
        }

    

        // if (pos === true) {
        //     // shell.exec('snap install ipfs')
        //     // shell.exec('ipfs init')]
        //    shell.exec('pm2 delete ipfsagent')


        //     shell.exec('wget https://dist.ipfs.tech/kubo/v0.18.1/kubo_v0.18.1_linux-amd64.tar.gz')
        //     shell.exec('tar -xvzf kubo_v0.18.1_linux-amd64.tar.gz')
        //     shell.exec('cd kubo  && bash install.sh')
        //     shell.exec("ipfs init")
        //     // shell.exec('ipfs daemon')
        //     shell.exec('sudo env PATH=$PATH pm2 start "ipfs daemon" --name ipfsagent')
        //     shell.exec('pm2 startup')
        //     shell.exec('pm2 save')
        //     let file = fs.readFileSync("out.txt", "utf8");
        //     let arr = file.split(/\r?\n/);
        //     arr.forEach((line, idx) => {
        //         if (line.includes("Error")) {
        //             console.log((idx + 1) + ':' + line);
        //             console.log(line)
        //             res.send({
        //                 "result": line
        //             })
        //         }
        //         else {

        //         }
        //     });

        // }
        // else {
        //     console.log("ipfs not selected")
        //     let file = fs.readFileSync("out.txt", "utf8");
        //     let arr = file.split(/\r?\n/);
        //     arr.forEach((line, idx) => {
        //         if (line.includes("Error")) {
        //             console.log((idx + 1) + ':' + line);
        //             console.log(line)
        //             res.send({
        //                 "result": line
        //             })
        //         }
        //         else {

        //         }
        //     });
        // }
    }
}
else{
    if (platform === "sawtooth") {
        console.log("swatooth commands")
        res.send("generated for sawtooth")
    }

    else {

        //fabric


        fs.writeFileSync('spec.yaml', yamlStr, 'utf8'); //storing it in spec.yaml config file



        if (db === true) {
            if (i == 0) {
                shell.exec('./minifab generate -o ' + org1 + ' -i 2.2.3 -c ' + channel + ' -s couchdb' + ' -e true -a K8SCLASSIC | tee out.txt')
                res.send("generate")
            }
             if (i == 1) {
                shell.exec('./minifab netup | tee out.txt')
                res.send("netup")
            }
             if (i == 2) {
                if (previouschannel == channel) {
                    res.send("channel")
                }
            else {

                console.log("in channelllllllllllllllllllllllllllllllllllllllllll")
                // shell.exec('./minifab create -c ' + channel + ' | tee out.txt')
                // shell.exec('./minifab join ' + ' | tee out.txt')
                // shell.exec('./minifab anchorupdate' + ' | tee out.txt')
                // shell.exec('./minifab profilegen -c ' + channel + ' | tee out.txt')
                  console.log("channle ", channel)
                    shell.exec('./minifab create -c ' + channel + ' | tee out.txt')
                    shell.exec('./minifab join ' + ' | tee out.txt')
                    shell.exec('./minifab anchorupdate' + ' | tee out.txt')
                    shell.exec('./minifab profilegen -c ' + channel + ' | tee out.txt')
                    previouschannel = channel
                    res.send("channel")``
            }
        }
            // res.send("channel")
        

            if (i == 3) {
                console.log("in 3")
                shell.exec('./minifab explorerup')
                shell.exec('kubectl get svc -A | grep 10.102.188.138 > test.txt')
                // shell.exec('./minifab portainerup')
                let file = fs.readFileSync("./out.txt", "utf8");
                let arr = file.split(/\r?\n/);
                arr.forEach((line, idx) => {
                    if (line.includes("Website address")) {
                        // console.log(line)
                        // console.log(line.substring(21, 48))
                        // res.send({ "Explorer URL": line.substring(21, 48) })
                        const num = line.substring(43, 47)
                        console.log(num)
                        let test = fs.readFileSync("./test.txt")
              console.log(test.indexOf(num))
              const port = test.indexOf(num)
              console.log(test.toString().substring(port+5,port+10))
              res.send({"Explorer URL":url+test.toString().substring(port+5,port+10)})
                        
                    }
                })
            }
            if (i == 4) {
                console.log("in 4")

                // shell.exec('./minifab explorerup')
                shell.exec('./minifab portainerup | out.txt')


                let file = fs.readFileSync("./out.txt", "utf8");
                let arr = file.split(/\r?\n/);
                arr.forEach((line, idx) => {
                    if (line.includes("UI address")) {
                        // console.log(line)
                        // console.log(line.substring(37, 61))
                        // console.log("here", line.substring(44, 60))
                        const num = line.substring(59, 63)
                        console.log(num)
                        let test = fs.readFileSync("./test.txt")
              console.log(test.indexOf(num))
              const port = test.indexOf(num)
              console.log(test.toString().substring(port+5,port+10))

                        //    shell.exec('curl http POST line.substring(44, 60)/api/auth Username="admin" Password="cdac@123"')
                        // shell.exec('curl - X http POST 10.244.0.52:7006/api/users/admin/init Username="admin" Password="adminpassword"')
                        shell.exec('sh port.sh ' + url + test.toString().substring(port+5,port+10))

                        // res.send({ "Portainer URL": line.substring(37, 61) })
              res.send({"Portainer URL":url + test.toString().substring(port+5,port+10)})

                    }
                })
            }

        }
        else {
            if (i == 0) {
                shell.exec('./minifab generate -o ' + org1 + ' -i 2.2.3 -c ' + channel + ' -e true -a K8SCLASSIC | tee out.txt')
                res.send("generate")
            }
            if (i == 1) {
                shell.exec('./minifab netup | tee out.txt')
                res.send("netup")
            }
            if (i == 2) {
                if (previouschannel == channel) {
                    res.send("channel")
                }
                else {
                    console.log("channle ", channel)
                    shell.exec('./minifab create -c ' + channel + ' | tee out.txt')
                    shell.exec('./minifab join ' + ' | tee out.txt')
                    shell.exec('./minifab anchorupdate' + ' | tee out.txt')
                    shell.exec('./minifab profilegen -c ' + channel + ' | tee out.txt')
                    previouschannel = channel
                    res.send("channel")
                }
            }
            if (i == 3) {
                console.log("in 3")

                shell.exec('./minifab explorerup  |tee out.txt')
                shell.exec('kubectl get svc -A | grep 10.102.188.138 > test.txt')

                let file = fs.readFileSync("./out.txt", "utf8");
                let arr = file.split(/\r?\n/);
                arr.forEach((line, idx) => {
                    if (line.includes("Website address")) {
                        // console.log(line)
                        // console.log(line.substring(21, 48))
                        // res.send({ "Explorer URL": line.substring(21, 48) })
                        const num = line.substring(43, 47)
                        console.log(num)
                        let test = fs.readFileSync("./test.txt")
              console.log(test.indexOf(num))
              const port = test.indexOf(num)
              console.log(test.toString().substring(port+5,port+10))
            //   res.send({msg:test.toString().substring(port+5,port+10)})
            res.send({"Explorer URL":url+test.toString().substring(port+5,port+10)})
                        
                    }
                })
            }
            if (i == 4) {
                console.log("in 3")

                // shell.exec('./minifab explorerup')
                shell.exec('./minifab portainerup |  tee out.txt')


                let file = fs.readFileSync("./out.txt", "utf8");
                let arr = file.split(/\r?\n/);
                arr.forEach((line, idx) => {
                    if (line.includes("UI address")) {
                        // // console.log(line)
                        // console.log(line.substring(37, 61))
                        // console.log("here", line.substring(44, 60))
                        // // shell.exec('curl http POST line.substring(44, 60)/#!/init/admin Username="ameers" Password="cdac@123" Confirm password="cdac@123')

                        // shell.exec('sh port.sh ' + line.substring(44, 61))
                        // // shell.exec('http POST 10.244.0.52:7006/api/users/admin/init Username="admin" Password="adminpassword"')
                        // res.send({ "Portainer URL:": line.substring(37, 61) })
                        const num = line.substring(59, 63)
                        console.log(num)
                        let test = fs.readFileSync("./test.txt")
              console.log(test.indexOf(num))
              const port = test.indexOf(num)
              console.log(test.toString().substring(port+5,port+10))

                        //    shell.exec('curl http POST line.substring(44, 60)/api/auth Username="admin" Password="cdac@123"')
                        // shell.exec('curl - X http POST 10.244.0.52:7006/api/users/admin/init Username="admin" Password="adminpassword"')
                        shell.exec('sh port.sh ' + url + test.toString().substring(port+5,port+10))

                        // res.send({ "Portainer URL": line.substring(37, 61) })
              res.send({"Portainer URL":url + test.toString().substring(port+5,port+10)})
                    }
                })

            }
        }

    

        // if (pos === true) {
        //     // shell.exec('snap install ipfs')
        //     // shell.exec('ipfs init')]
        //    shell.exec('pm2 delete ipfsagent')


        //     shell.exec('wget https://dist.ipfs.tech/kubo/v0.18.1/kubo_v0.18.1_linux-amd64.tar.gz')
        //     shell.exec('tar -xvzf kubo_v0.18.1_linux-amd64.tar.gz')
        //     shell.exec('cd kubo  && bash install.sh')
        //     shell.exec("ipfs init")
        //     // shell.exec('ipfs daemon')
        //     shell.exec('sudo env PATH=$PATH pm2 start "ipfs daemon" --name ipfsagent')
        //     shell.exec('pm2 startup')
        //     shell.exec('pm2 save')
        //     let file = fs.readFileSync("out.txt", "utf8");
        //     let arr = file.split(/\r?\n/);
        //     arr.forEach((line, idx) => {
        //         if (line.includes("Error")) {
        //             console.log((idx + 1) + ':' + line);
        //             console.log(line)
        //             res.send({
        //                 "result": line
        //             })
        //         }
        //         else {

        //         }
        //     });

        // }
        // else {
        //     console.log("ipfs not selected")
        //     let file = fs.readFileSync("out.txt", "utf8");
        //     let arr = file.split(/\r?\n/);
        //     arr.forEach((line, idx) => {
        //         if (line.includes("Error")) {
        //             console.log((idx + 1) + ':' + line);
        //             console.log(line)
        //             res.send({
        //                 "result": line
        //             })
        //         }
        //         else {

        //         }
        //     });
        // }
    }
}
    if(pos===true){
        if(environment==="test"){
            shell.exec('pm2 delete ipfsagent')


         // shell.exec('wget https://dist.ipfs.tech/kubo/v0.18.1/kubo_v0.18.1_linux-amd64.tar.gz')
         // shell.exec('tar -xvzf kubo_v0.18.1_linux-amd64.tar.gz')
         // shell.exec('cd kubo  && bash install.sh')
         shell.exec("ipfs init")
         // shell.exec('ipfs daemon')
         shell.exec('sudo env PATH=$PATH pm2 start "ipfs daemon" --name ipfsagent')
         shell.exec('pm2 startup')
         shell.exec('pm2 save')
        //  let file = fs.readFileSync("out.txt", "utf8");
        //  let arr = file.split(/\r?\n/);
        //  arr.forEach((line, idx) => {
        //      if (line.includes("Error")) {
        //          console.log((idx + 1) + ':' + line);
        //          console.log(line)
        //          res.send({
        //              "result": line
        //          })
        //      }
        //  });
        res.send("single node ipfs enabled")

     }
  
     else {
         console.log("ipfs not selected")
         let file = fs.readFileSync("out.txt", "utf8");
         let arr = file.split(/\r?\n/);
         arr.forEach((line, idx) => {
             if (line.includes("Error")) {
                 console.log((idx + 1) + ':' + line);
                 console.log(line)
                 res.send({
                     "result": line
                 })
             }
             else {

             }
         });
     } 
    }
    res.send({ "result": "Genrated Artifacts along with ipfs " })

})
app.post('/ipfs',function(req,res){
    let node = req.body.node
    console.log("node",node)
    if(node==="test"){
        
               shell.exec('pm2 delete ipfsagent')


            // shell.exec('wget https://dist.ipfs.tech/kubo/v0.18.1/kubo_v0.18.1_linux-amd64.tar.gz')
            // shell.exec('tar -xvzf kubo_v0.18.1_linux-amd64.tar.gz')
            // shell.exec('cd kubo  && bash install.sh')
            shell.exec("ipfs init")
            // shell.exec('ipfs daemon')
            shell.exec('sudo env PATH=$PATH pm2 start "ipfs daemon" --name ipfsagent')
            shell.exec('pm2 startup')
            shell.exec('pm2 save')
            let file = fs.readFileSync("out.txt", "utf8");
            let arr = file.split(/\r?\n/);
            arr.forEach((line, idx) => {
                if (line.includes("Error")) {
                    console.log((idx + 1) + ':' + line);
                    console.log(line)
                    res.send({
                        "result": line
                    })
                }
                else {

                }
            });

        }
        else if(node ==="prod"){
            shell.exec("minikube start")
            shell.exec("kubectl apply -f ./kube-ipfs/configmap.yaml")
            shell.exec("kubectl apply -f ./kube-ipfs/secret.yaml")
            shell.exec("kubectl apply -f ./kube-ipfs/bootstrap.yaml")
            shell.exec("kubectl apply -f ./kube-ipfs/statefulset.yaml")
            shell.exec("kubectl apply -f ./kube-ipfs/service.yaml")
            shell.exec('pm2 start "minikube tunnel" --name "minikube-proxy"')
        }
        else {
            console.log("ipfs not selected")
            let file = fs.readFileSync("out.txt", "utf8");
            let arr = file.split(/\r?\n/);
            arr.forEach((line, idx) => {
                if (line.includes("Error")) {
                    console.log((idx + 1) + ':' + line);
                    console.log(line)
                    res.send({
                        "result": line
                    })
                }
                else {

                }
            });
        } 

    
})
app.post('/generate', function (req, res) {
    let user = req.body.user;
    let db = req.body.db
    let pos = req.body.pos

    console.log("ipfs storage ", pos)
    console.log("db", db)

    let platform = req.body.platform //getting the platform
    let channel = req.body.channel; //channel name
    let data = req.body.data; //JSON Obj for spec.yaml file
    let yamlStr = yaml.dump(data); //to convert json to yaml
    let org1 = data.fabric.peers[0] //get the first peer from the peers list
    org1 = org1.substring(org1.indexOf(".") + 1); //getting org name from the peer
    console.log(org1)
    //sawtooth
    console.log("platform", platform)
    if (platform === "sawtooth") {
        console.log("swatooth commands")
        res.send("generated for sawtooth")
    }

    else {

        //fabric

        fs.writeFileSync('spec.yaml', yamlStr, 'utf8'); //storing it in spec.yaml config file



        if (db === true) {
            shell.exec('./minifab generate -o ' + org1 + ' -i 2.2.3 -c ' + channel + ' -s couchdb' + ' -e true | tee out.txt')

        }
        else
            shell.exec('./minifab generate -o ' + org1 + ' -i 2.2.3 -c ' + channel + ' -e true | tee out.txt')

        if (pos === true) {
            shell.exec('snap install ipfs')
            shell.exec('ipfs init')
            shell.exec('sudo env PATH=$PATH pm2 start "ipfs daemon" --name ipfsagent')
            shell.exec('pm2 startup')
            shell.exec('pm2 save')
            let file = fs.readFileSync("out.txt", "utf8");
            let arr = file.split(/\r?\n/);
            arr.forEach((line, idx) => {
                if (line.includes("Error")) {
                    console.log((idx + 1) + ':' + line);
                    console.log(line)
                    res.send({
                        "result": line
                    })
                }
                else {

                }
            });
            res.send({ "result": "Genrated Artifacts along with ipfs " })
        }
        else {
            console.log("ipfs not selected")
            let file = fs.readFileSync("out.txt", "utf8");
            let arr = file.split(/\r?\n/);
            arr.forEach((line, idx) => {
                if (line.includes("Error")) {
                    console.log((idx + 1) + ':' + line);
                    console.log(line)
                    res.send({
                        "result": line
                    })
                }
                else {

                }
            });
            res.send({ "result": "Genrated Artifacts " })
        }
    }

    // shell.exec('./minifab netup')    
    // shell.exec('./minifab create -c ' +channel)
    // shell.exec('./minifab join')
    // shell.exec('./minifab anchorupdate')

    // res.send({ "result": "network started" })
    //let file = fs.readFileSync("out.txt", "utf8");
    // let arr = file.split(/\r?\n/);
    // arr.forEach((line, idx) => {
    //     if (line.includes("Error")) {
    //         console.log((idx + 1) + ':' + line);
    //         console.log(line)
    //         res.send({
    //             "result": line
    //         })
    //     }
    //     else {

    //     }
    // });
    // res.send({ "result": "Genrated Artifacts " })

})
// app.post('/generate', function (req, res) {
//     let user = req.body.user;
//     let db =req.body.db
//     let pos =req.body.pos

//     console.log("ipfs storage ", pos)
//     console.log("db",db)

//     let platform = req.body.platform //getting the platform
//     let channel = req.body.channel; //channel name
//     let data = req.body.data; //JSON Obj for spec.yaml file
//     let yamlStr = yaml.dump(data); //to convert json to yaml
//     let org1 = data.fabric.peers[0] //get the first peer from the peers list
//     org1 = org1.substring(org1.indexOf(".") + 1); //getting org name from the peer
//     console.log(org1)
// //sawtooth
// console.log("platform",platform)
// if(platform==="sawtooth"){
//     console.log("swatooth commands")
//     res.send("generated for sawtooth")
// }

// else{

//     //fabric

//     fs.writeFileSync('spec.yaml', yamlStr, 'utf8'); //storing it in spec.yaml config file



//     if(db===true){
//         shell.exec('./minifab generate -o ' + org1 + ' -i 2.2.3 -c ' + channel + ' -s couchdb' + ' -e true | tee out.txt')

//     }
//     else
//     shell.exec('./minifab generate -o ' + org1 + ' -i 2.2.3 -c ' + channel + ' -e true | tee out.txt')

//     if(pos===true){
//         shell.exec('snap install ipfs')
//         shell.exec('ipfs init')
//         shell.exec('sudo env PATH=$PATH pm2 start "ipfs daemon" --name ipfsagent')
//         shell.exec('pm2 startup')
//         shell.exec('pm2 save')
//         let file = fs.readFileSync("out.txt", "utf8");
//     let arr = file.split(/\r?\n/);
//     arr.forEach((line, idx) => {
//         if (line.includes("Error")) {
//             console.log((idx + 1) + ':' + line);
//             console.log(line)
//             res.send({
//                 "result": line
//             })
//         }
//         else {

//         }
//     });
//     res.send({ "result": "Genrated Artifacts along with ipfs " })
//     }
//     else{
//         console.log("ipfs not selected")
//         let file = fs.readFileSync("out.txt", "utf8");
//     let arr = file.split(/\r?\n/);
//     arr.forEach((line, idx) => {
//         if (line.includes("Error")) {
//             console.log((idx + 1) + ':' + line);
//             console.log(line)
//             res.send({
//                 "result": line
//             })
//         }
//         else {

//         }
//     });
//     res.send({ "result": "Genrated Artifacts " })
//     }
// }

//     // shell.exec('./minifab netup')    
//     // shell.exec('./minifab create -c ' +channel)
//     // shell.exec('./minifab join')
//     // shell.exec('./minifab anchorupdate')

//     // res.send({ "result": "network started" })
//     //let file = fs.readFileSync("out.txt", "utf8");
//     // let arr = file.split(/\r?\n/);
//     // arr.forEach((line, idx) => {
//     //     if (line.includes("Error")) {
//     //         console.log((idx + 1) + ':' + line);
//     //         console.log(line)
//     //         res.send({
//     //             "result": line
//     //         })
//     //     }
//     //     else {

//     //     }
//     // });
//     // res.send({ "result": "Genrated Artifacts " })

// })
app.post('/generate/dig', function (req, res) {
    let data = req.body.data;
    //orderer img generation
    let channel = req.body.channel;

    let x = data.fabric.orderers;
    console.log(x)
    console.log(x.length)
    let content = 'flowchart LR\n'
    // for(i in x){
    //     let ord = x[i].substring(0,x[i].indexOf("."));
    //     console.log(ord)
    //     content=content + "\n "+ord
    // }
    // content=content+ " \n end \n"
    console.log(content)
    // fs.writeFileSync('ord.mmd', content, 'utf8');
    // shell.exec('mmdc -p puppeteer-config.json  -i ord.mmd -o ord.png')

    //peer img generation'

    let y = data.fabric.peers;
    let olist = []
    console.log(y)
    // let pContent='graph TD\n '
    let pContent = ''
    let org1, org2 = ""
    content = content + "subgraph network \n"
    content = content + "direction LR \n"
    content = content + "subgraph orderer \n"
    for (i in x) {
        let ord = x[i].substring(0, x[i].indexOf("."));

        // console.log(content)
        console.log(ord)
        content = content + ord + "\n"
    }
    content = content + "end \n"
    content = content + "subgraph organizations \n"
    content = content + "direction LR \n"



    for (i in y) {
        org1 = y[i].substring(y[i].indexOf(".") + 1);
        org1 = org1.substring(0, org1.indexOf("."));
        if (org1 != org2) {
            org2 = org1
            console.log("in if " + org1)
            pContent = pContent + "subgraph " + org2 + "\n"
            olist.push(org2)

            for (j in y) {
                // console.log(j)            
                org3 = y[j].substring(y[j].indexOf(".") + 1);
                org3 = org3.substring(0, org3.indexOf("."));

                if (org2 == org3) {
                    let peer = y[j].substring(0, y[j].indexOf("."));
                    console.log("peer is ", peer)
                    pContent = pContent + j + '((' + peer + '))\n'
                }
            }
            pContent = pContent + "end\n"
            console.log(olist)
        }

    } "\n " + olist[i] + " --- " + olist[i + 1]
    // for (let i = 0; i < olist.length; i++) {
    //     console.log(olist.length)
    //     if (i < olist.length - 1)
    //         pContent = pContent + "\n" + olist[i] + " --- |" + channel + "| " + olist[i + 1]
    //     else
    //         pContent = pContent + "\n" + olist[i] + " --- |" + channel + "| " + olist[0] + "\n"
    // }
    for (let i = 0; i < olist.length; i++) {
        console.log(olist.length)
        if (i < olist.length - 1)
            pContent = pContent + "\n" + olist[i] + " -...-> | " + channel + "| " + olist[i + 1]
        else
            pContent = pContent + "\n" + olist[i] + " -...-> | " + channel + "|" + olist[0] + "\n"
    }
    content = content + pContent + "end\n"

    console.log(pContent)
    // fs.writeFileSync('peer.mmd', pContent, 'utf8');
    // for (i in x) {
    //     let ord = x[i].substring(0, x[i].indexOf(".")) ;

    //     // console.log(content)
    //     console.log(ord)
    //     content = content + ord  + "\n"
    // }

    content = content + "end"

    fs.writeFileSync('peer.mmd', content, 'utf8');
    shell.exec('./node_modules/.bin/mmdc -p puppeteer-config.json  -i peer.mmd -o peer.png')
    res.send(content)
    var base64str = base64_encode('peer.png');
    console.log(base64str)
    res.send(base64str)

    function base64_encode(file) {
        return fs.readFileSync(file, 'base64');
    }

})
// app.post('/up', function (req, res) {

//     let platform= req.body.platform
//     if(platform==="sawtooth"){
//         console.log("swatpppp command")
//         res.send("generated swatooth")
//     }
//     else{
//     shell.exec('./minifab netup | tee out.txt')
//     // res.send({ "result": "network started" })
//     let file = fs.readFileSync("out.txt", "utf8");
//     let arr = file.split(/\r?\n/);
//     arr.forEach((line, idx) => {
//         if (line.includes("Error")) {
//             console.log((idx + 1) + ':' + line);
//             console.log(line)
//             res.send({
//                 "result": line
//             })
//         }
//         else {

//         }
//     });
//     res.send({ "result": "network started " })
// }

// })

// app.post('/up', function (req, res) {

//     let platform = req.body.platform
//     let consenus = req.body.consenus
//     console.log("consenus", consenus)

//     if (platform === "sawtooth") {
//         console.log("swatpppp command")
//         shell.exec('sh new_singlenode.sh ' + consenus)
//         res.send("generated swatooth")
//     }
//     else {
//         shell.exec('./minifab netup | tee out.txt')
//         // res.send({ "result": "network started" })
//         let file = fs.readFileSync("out.txt", "utf8");
//         let arr = file.split(/\r?\n/);
//         arr.forEach((line, idx) => {
//             if (line.includes("Error")) {
//                 console.log((idx + 1) + ':' + line);
//                 console.log(line)
//                 res.send({
//                     "result": line
//                 })
//             }
//             else {

//             }
//         });
//         res.send({ "result": "network started " })
//     }

// })

//mumbai sawtooth up 
app.post('/dummyup', function (req, res) {


const parameters = req.body
console.log(parameters )
const consensus1 = parameters.consensus.toLowerCase();
console.log('consensus is  ' + consensus1)
const ips=parameters.ip


console.log('inside runstartscript')
console.log('consensus in lower case '+parameters.consensus.toLowerCase())
  //shell.exec('chmod 777 /var/run/docker.sock')
  shell.exec('sh singlenode1.sh ' + consensus1)
//shell.exec('pwd');
//shell.exec('chmod 777 /var/run/docker.sock')
//shell.exec('./singlenodel.sh ' + consensus1)
console.log("Done Processsssssss")
res.send('completed........')

})







//mumbai sawtooth up 
app.post('/up', function (req, res) {


    const parameters = req.body
    console.log(parameters )
    const node = parameters.node
    const ip=parameters.ip
    const consensus1 = parameters.consensus.toLowerCase();
    console.log('consensus is  ' + consensus1)
    const ipsArrays = ip.join(',');
    
    
    
    
    console.log('inside runstartscript')
    console.log(parameters.consensus.toLowerCase())
     shell.exec('chmod 777 /var/run/docker.sock')
     shell.exec('chmod 777 ./singlenode1.sh')
     shell.exec(`./singlenode1.sh  ${consensus1} ${node} ${ipsArrays}`) //added_just_now
    /*
    exec(`/home/ubf4/TP_server/Transaction_Processor/run.sh ${dataArrayString} ${ipsArrays}`,
      function (error, stdout, stderr) {
        if (error !== null) {
          console.log(error);
        } else {
        console.log('stdout: ' + stdout);
    
       console.log('stderr first: ' + stderr);
        }
    
    });
      */
      
    //shell.exec('pwd');
    //shell.exec('chmod 777 /var/run/docker.sock')
    //shell.exec('./singlenodel.sh ' + consensus1)
    console.log("Done Processsssssss")
    res.send('completed........')
    
    })

/********************************************* */


















app.post('/configDetails', (request, response) => {

    const parameters = request.body
    console.log(parameters)
    consensus1 = parameters.consensus
    console.log('consensus1  ' + consensus1)
    // axios
    // .post('http://localhost:7000/nicpostip', request.body)
    // .then((res) => {
    //   //console.log('statusCode: ${res.status}')
    //   console.log(res.data)
    //   //response.send(res.data)
    //   response.json('parameters received!!!')
  
    //   console.log('inside generatescript')
    // if (shell.exec('./generateScript.sh')) {
    //   console.log('inside file')
    //  // response.json('10.210.12.83')
    // }
    // })
      
  
    console.log('inside generatescript')
    if (shell.exec('./generateScript.sh')) {
      console.log('inside file')
     // response.json('10.210.12.83')
    }
  
    // .catch((error) => {
    //   console.error(error)
    // })
  
  
  
    let user = request.body.user;
    let platform = request.body.platform;
   //let consensus = request.body.consensus;
    let version = request.body.version;
    let appName = request.body.appName;
  
    let runStartScript = {
            user : user,
            platform : platform,
            //consensus : consensus,
            version : version,
            appName : appName
    }
  
  
    console.log("Body Param : "+JSON.stringify(runStartScript));
  console.log('inside runstartscript')
  console.log(consensus1.toLowerCase())
  
  shell.exec('./start_Script.sh ' + consensus1.toLowerCase(),
  function (error, stdout, stderr) {
  if (error !== null) {
  console.log(error);
  } else {
  //response.send(stdout)
  //response.send('complted')
  }
  
  }
  )
  response.send('completed........')
  
  })



  app.post('/smartcontractsawtooth', function (req, res) {
	
    //console.log("Smart_Contract_Deployment_"+JSON.stringify(req.body));
    var name = req.body.data.name.toLowerCase();
    var chaincode = req.body.data.chaincode;
    var node = req.body.node;
     var ip=req.body.ip;
var connectorId = req.body.connectorId;
const ipsArrays = ip.join(',');
    console.log("Chaincode is " + chaincode);
var consensus = req.body.data.consensus;
   // var contents = req.body.data.contents;

    const consensus1 = consensus.toLowerCase();  
    
   // let buff1 = new Buffer(contents, 'base64');
  // fs.writeFileSync(`./sawtooth-core/docker/compose/${name}.tar.gz`, buff1);
    
    let buff = new Buffer(chaincode, 'base64');
    
    
    fs.writeFileSync(`./sawtooth-core/docker/compose/${name}.zip`, buff);
    console.log(`Base64 file data converted to file: ${name}.zip`);
    shell.exec('chmod 777 ./extract.sh')
    shell.exec(`./extract.sh ${name} ${node} ${ipsArrays} ${consensus1}`)
    console.log("Done Processsssssss")
    res.send('completed........')
    
    })
















app.post('/channel', function (req, res) {
    let channel = req.body.channel;
    shell.exec('./minifab create -c ' + channel + ' | tee out.txt')
    let file = fs.readFileSync("out.txt", "utf8");
    let arr = file.split(/\r?\n/);
    arr.forEach((line, idx) => {
        if (line.includes("Error")) {
            console.log((idx + 1) + ':' + line);
            console.log(line)
            res.send({
                "result": line
            })
        }
    });
    shell.exec('./minifab join ' + ' | tee out.txt')



    let file1 = fs.readFileSync("out.txt", "utf8");
    let arr1 = file1.split(/\r?\n/);
    arr1.forEach((line, idx) => {
        if (line.includes("Error")) {
            console.log((idx + 1) + ':' + line);
            console.log(line)
            res.send({
                "result": line
            })
        }
    });
    shell.exec('./minifab anchorupdate' + ' | tee out.txt')
    let file2 = fs.readFileSync("out.txt", "utf8");
    let arr2 = file2.split(/\r?\n/);
    arr2.forEach((line, idx) => {
        if (line.includes("Error")) {
            console.log((idx + 1) + ':' + line);
            console.log(line)
            res.send({
                "result": line
            })
        }
        else {

        }
    });
    shell.exec('./minifab profilegen -c ' + channel + ' | tee out.txt')
    file = fs.readFileSync("out.txt", "utf8");
    arr = file.split(/\r?\n/);
    arr.forEach((line, idx) => {
        if (line.includes("Error")) {
            console.log((idx + 1) + ':' + line);
            console.log(line)
            res.send({
                "result": line
            })
        }
    });

    let pa = __dirname + "/vars/profiles/" + channel + "_connection_for_nodesdk.json"
    let data = fs.readFileSync(pa)
    // console.log(JSON.parse(data)["certificateAuthorities"])
    data = JSON.parse(data)
    for (let [key, value] of Object.entries(data["certificateAuthorities"])) {
        value["caName"] = key;
    }
    fs.writeFileSync(pa, JSON.stringify(data, null, 2))

    res.send({
        "result": "Channel created and profile generated",
        "cfgpath": pa
    })
    // res.send({ "result": "channel created" })
    //   res.send({ "result": "channel created " })

})
// app.post('/profilegen', function (req, res) {
//     let channel = req.body.channel;
//     shell.exec('./minifab profilegen -c ' + channel  +' | tee out.txt')
//     let file = fs.readFileSync("out.txt", "utf8");
//     let arr = file.split(/\r?\n/);
//     arr.forEach((line, idx) => {
//         if (line.includes("Error")) {
//             console.log((idx + 1) + ':' + line);
//             console.log(line)
//             res.send({
//                 "result": line
//             })
//         }
//     });
//     res.send({ "result": "profilegen created " })

// })

app.post('/chaincode', function (req, res) {
    let name = req.body.name;
    let language = req.body.language;
    let chaincode = req.body.chaincode;
    let version = req.body.version;
    let channel = req.body.channel;
    console.log("channek ", channel)
console.log("name",name)
    const fileBuffer = new Buffer(chaincode, 'base64')
    //let mpath = '/home/cdac/ubf/vars/chaincode/'//+name+'/'+language //todo
    let mpath = './vars/chaincode/'//+name+'/'+language //todo
console.log("mpathhhh",mpath)
    shell.exec('mkdir -p ' + mpath + "bk")
    shell.exec('rm -rf ' + mpath + "bk/" + version)
    shell.exec('mv ' + mpath + name + " " + mpath + "bk/" + version)
    shell.exec('mkdir -p ' + mpath)
    shell.exec('ls ' + mpath + name)
    fs.writeFileSync(mpath + name + ".zip", fileBuffer)
    shell.exec('unzip ' + mpath + name + ".zip -d " + mpath)
console.log("before snss")  
let offpath = './vars/chaincode'+'/'+name+'/'+language
console.log("path of off",offpath)
//shell.exec('cd '+ offpath+' && mv node_modules/* ./lib')
//   shell.exec('cd '+ mpath +' && mv node_modules ./lib/') 
//     shell.exec('cd '+ mpath +' && ls ./lib') 
    // console.log(req.body)
    // console.log(path)
    // console.log(mpath)
    // // shell.exec('mkdir -p '+mpath)
    // fs.writeFileSync(mpath+name+".zip",fileBuffer)
    // shell.exec('unzip '+ mpath+name+".zip -d "+ mpath)
    // res.send("success")


    // shell.exec('cp -r '+path+' '+mpath)


    shell.exec('./minifab ccup -n ' + name + ' -v 1.0 -l ' + language + ' -d false  -c ' + channel + '\ | tee out.txt')
    let file = fs.readFileSync("out.txt", "utf8");
    let arr = file.split(/\r?\n/);
    arr.forEach((line, idx) => {
        console.log("in if")

        if (line.includes("Error")) {
            console.log((idx + 1) + ':' + line);
            console.log(line)
            res.send({
                "result": line
            })
        }
        else {

        }
    });
    // shell.exec('./minifab explorerup')
    // shell.exec('./minifab portainerup')
    // shell.exec('./minifab commit')
    // shell.exec('./minifab initialize -n '+name+ ' -p \'"Init"\'') //chaincode init function name to be changed accordingly
    // shell.exec('./minifab discover')
    res.send({ "result": "chaincode installed along with explorer and portainer" })
    //chnagedddd
    // shell.exec('./minifab profilegen -c ' + channel  +' | tee out.txt')
    // file = fs.readFileSync("out.txt", "utf8");
    // arr = file.split(/\r?\n/);
    // arr.forEach((line, idx) => {
    //     if (line.includes("Error")) {
    //         console.log((idx + 1) + ':' + line);
    //         console.log(line)
    //         res.send({
    //         "result": line
    //        })
    //     }
    // });

    // let pa = __dirname+"/vars/profiles/"+channel+"_connection_for_nodesdk.json"
    //  file = fs.readFileSync(pa,"utf8")
    // res.send({ "result": "Chincode installed and profile generated",
    //     "cfgpath": pa, "obj":JSON.parse(file)})

    //shell.exec("sh/home/cdac/POE/genpoe-2.2.3/general/bctnetwork/scripts/channel/cdacpoechannel/register_user.sh")

})
app.post('/ccApproveCommit', function (req, res) {

    shell.exec('./minifab approve  | tee out.txt')
    let file = fs.readFileSync("out.txt", "utf8");
    let arr = file.split(/\r?\n/);
    arr.forEach((line, idx) => {
        console.log("in if")

        if (line.includes("Error")) {
            console.log((idx + 1) + ':' + line);
            console.log(line)
            res.send({
                "result": line
            })
        }
        else {

        }
    });
    shell.exec('./minifab commit  | tee out.txt')
    let file1 = fs.readFileSync("out.txt", "utf8");
    let arr1 = file1.split(/\r?\n/);
    arr1.forEach((line, idx) => {
        console.log("in if")

        if (line.includes("Error")) {
            console.log((idx + 1) + ':' + line);
            console.log(line)
            res.send({
                "result": line
            })
        }
        else {

        }
    });

    // shell.exec('./minifab approve')
    // shell.exec('./minifab commit')
    // shell.exec('./minifab initialize -n '+name+ ' -p \'"Init"\'') //chaincode init function name to be changed accordingly
    // shell.exec('./minifab discover')
    res.send({ "result": "chaincode installed" })

})
app.post('/chaincode/update', function (req, res) {
    let name = req.body.name;
    let channel = req.body.channel
    // let language = req.body.language;
    // let path = req.body.path;
    let version = req.body.version
    let language = req.body.language;
    let chaincode = req.body.chaincode;
    const fileBuffer = new Buffer(chaincode, 'base64')
    //let mpath = '/home/cdac/ubf/vars/chaincode/'//+name+'/'+language //todo
    let mpath = './vars/chaincode/'+'/'+name+'/'+language //todo
    shell.exec('mkdir -p ' + mpath + "bk")

    shell.exec('mv ' + mpath + name + " " + mpath + "bk/" + version)
    shell.exec('mkdir -p ' + mpath)
    shell.exec('ls ' + mpath + name)
    fs.writeFileSync(mpath + name + ".zip", fileBuffer)
    shell.exec('unzip ' + mpath + name + ".zip -d " + mpath)
    // res.send({ "result": "chaincode installed" })

    shell.exec('./minifab ccup -n ' + name + ' -v ' + version + ' -l ' + language + ' -d false -c ' + channel + '\  | tee out.txt') //chaincode version to be incremented
    // console.log("install donne")
    // shell.exec('./minifab approve')
    // shell.exec('./minifab commit')
    // console.log('./minifab initialize -n '+name+ ' -p \'initLedger\'')
    // shell.exec('./minifab initialize -n '+name+ ' -p \'"Init"\'')
    // shell.exec('./minifab discover')
    // res.send({ "result": "chaincode installed" })
    let file = fs.readFileSync("out.txt", "utf8");
    let arr = file.split(/\r?\n/);
    arr.forEach((line, idx) => {
        if (line.includes("Error")) {
            console.log((idx + 1) + ':' + line);
            console.log(line)
            res.send({
                "result": line
            })
        }
        else {

        }
    });
    res.send({ "result": "chaincode updated" })

})
app.post('/addOrg', function (req, res) {
    let orgName = req.body.orgName;
    let port = req.body.port
    let channel = req.body.data.channel
    shell.exec('mkdir -p ' + orgName)
    shell.exec('cp ./minifab ' + orgName + '/.')
    let data = req.body.data;
    let yamlStr = yaml.dump(data);
    let org1 = data.fabric.peers[0]
    org1 = org1.substring(org1.indexOf(".") + 1);
    console.log(org1)
    fs.writeFileSync('./' + orgName + '/spec.yaml', yamlStr, 'utf8');
    shell.exec("cd " + orgName + ' && ./minifab netup -e ' + port + '  -o ' + org1 + ' |tee out.txt')
    shell.exec('cp ./' + orgName + '/vars/JoinRequest_* ./vars/NewOrgJoinRequest.json')

    shell.exec('./minifab orgjoin |tee out.txt')
    shell.exec('./minifab profilegen -c ' + channel + ' | tee out.txt')
    shell.exec("sudo cp ./vars/profiles/endpoints.yaml " + orgName + '/vars')
    shell.exec("cd " + orgName + " && ./minifab nodeimport,join -c " + channel)



    let file = fs.readFileSync("./" + orgName + "/out.txt", "utf8");
    let arr = file.split(/\r?\n/);
    arr.forEach((line, idx) => {
        if (line.includes("Error")) {
            console.log((idx + 1) + ':' + line);
            console.log(line)
            res.send({
                "result": line
            })
        }
        else {

        }
    });

    res.send({ "result": "added org " })

})

// app.post('/down', function (req, res) {
// let platform = req.body.platform
// if(platform === "sawtooth"){
//     console.log("sawtooth")
//     res.send("sawtooth command executed")
// }
//     shell.exec('./minifab down | tee out.txt')
//     // res.send({ "result": "network stopped" })
//     let file = fs.readFileSync("out.txt", "utf8");
//     let arr = file.split(/\r?\n/);
//     arr.forEach((line, idx) => {
//         if (line.includes("Error")) {
//             console.log((idx + 1) + ':' + line);
//             console.log(line)
//             res.send({
//                 "result": line
//             })
//         }
//         else {

//         }
//     });
//     res.send({ "result": "network stopped" })

// })
app.post('/down', function (req, res) {
    let platform = req.body.platform
    let domainName = req.body.domainName
    let domainName1 = domainName.toLowerCase();
    if (platform === "sawtooth") {
        console.log("sawtooth")
        console.log(domainName1)
        // shell.exec('sh new_stopSinglenode.sh '+ consenus)
	shell.exec('chmod 777 ./stopSinglenode1.sh')
        shell.exec(`./stopSinglenode1.sh  ${domainName1}`)

        res.send("sawtooth command executed")
    }
    else {
        shell.exec('./minifab down | tee out.txt')
        // res.send({ "result": "network stopped" })
        let file = fs.readFileSync("out.txt", "utf8");
        let arr = file.split(/\r?\n/);
        arr.forEach((line, idx) => {
            if (line.includes("Error")) {
                console.log((idx + 1) + ':' + line);
                console.log(line)
                res.send({
                    "result": line
                })
            }
            else {

            }
        });
        res.send({ "result": "network stopped" })
    }
})





app.post('/clean', function (req, res) {
let platform = req.body.platform
//let platform=JSON.parse(req.body)
console.log("hiitttttttttt hooooooooooo raaaaaaaaaaaaaaa",req.body)
    console.log("Platform is...................................... ", platform);

    if (platform === "sawtooth") {
        console.log("sawtooth")
        //console.log(domainName1)
        // shell.exec('sh new_stopSinglenode.sh '+ consenus)
        shell.exec(`./RemoveNetwork.sh`)

        res.send("sawtooth command executed")
    }

else {


    shell.exec('./minifab cleanup | tee out.txt')
    shell.exec('pm2 delete ipfsagent')
    shell.exec('pm2 save')
    // res.send({ "result": "network stopped" })
    let file = fs.readFileSync("out.txt", "utf8");
    let arr = file.split(/\r?\n/);
    arr.forEach((line, idx) => {
        if (line.includes("Error")) {
            console.log((idx + 1) + ':' + line);
            console.log(line)
            res.send({
                "result": line
            })
        }
        else {

        }
    });
    res.send({ "result": "network stopped" })
}
})


//app.post('/clean', function (req, res) {

  //  shell.exec('./minifab cleanup | tee out.txt')
    //shell.exec('pm2 delete ipfsagent')
   // shell.exec('pm2 save')
    // res.send({ "result": "network stopped" })
    //let file = fs.readFileSync("out.txt", "utf8");
   // let arr = file.split(/\r?\n/);
    //arr.forEach((line, idx) => {
      //  if (line.includes("Error")) {
        //    console.log((idx + 1) + ':' + line);
          //  console.log(line)
            //res.send({
              //  "result": line
            //})
        //}
        //else {

      //  }
    //});
    //res.send({ "result": "network stopped" })

//})




app.listen(3000, '0.0.0.0', () => {
    console.log(`Example app listening at http://localhost:3000`)
})

// app.setTimeout(1000000);
