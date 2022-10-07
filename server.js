const bodyParser = require('body-parser');
const express = require('express');
const {v4 : uuidv4} = require("uuid");
const port = 3000;
const app = express();
const {createClient} = require('redis');
const md5 = require('md5');

const redisClient = createClient(
    {
    Url:"redis://default@localhost:6379",
    }
);

app.listen(port, async ()=>{
    await redisClient.connect();
    console.log('listening on port'+port);
});

app.get('/', (req,res)=>{
    res.send('Hello World!')
});

app.use(bodyParser.json());

app.post('/user', async (req,res)=>{
    const newUserRequestObject = req.body;
    const loginPassword = req.body.password;
    const hash = md5(loginPassword);
    console.log(hash);
    newUserRequestObject.password = hash;
    newUserRequestObject.verifyPassword = hash;
    console.log('New User:',JSON.stringify(newUserRequestObject));
    redisClient.hSet('Users',req.body.email,JSON.stringify(newUserRequestObject));
    res.send('New user '+newUserRequestObject.email+' added');
});

app.post("/login", async (req,res)=>{
    const loginEmail = req.body.userName;
    console.log(JSON.stringify(req.body));
    console.log("loginEmail", loginEmail);
    const loginPassword = req.body.password;
    console.log("loginPassword", loginPassword);
    // res.send("Who are you?");

    const userString=await redisClient.hGet('Users', loginEmail);
    const userObject=JSON.parse(userString);
    if(userObject=='' || userObject==null){
        res.status(404);
        res.send('User not found');
    }
    else if (loginEmail == userObject.userName && md5(loginPassword) == userObject.password){
        const token = uuidv4();
        res.send(token);
    } 
    else{
        res.status(401);//unauthorized error
        res.send("Invalid user or password");
    }
})