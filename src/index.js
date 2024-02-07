const express=require("express");
const path=require("path");
const bcrypt=require("bcrypt");
const collection=require('./config');
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');
const { requireAuth, checkuser } = require("../middlewares/authmiddleware");


const app=express();

//CONVERTING DATA INTO JSON FORMat
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());


app.set('view engine','ejs');

//adding css file here
app.use(express.static("public"));
app.get('/',(req,res)=>{
    res.render("home");
})

app.get('/login',(req,res)=>{
    res.render("login");
})  

app.get('/signup',(req,res)=>{
    res.render("signup");
})

app.get('/secret', requireAuth, (req,res)=>{
    res.render("secret");
})


app.get('/logout',(req,res)=>{
    res.cookie('jwt','',{maxAge:1});
    res.redirect('/');
})

app.get('*',checkuser);

app.get('/order',requireAuth,(req,res)=>{
    res.render("order");
})
 

const creatToken = (id) =>{
    return jwt.sign({id},'Tea venum mamey',{
        expiresIn: 1000*60*60*24
    });
} 

//setting and getting cookies example 


// app.get('/set-cookies',(req,res)=>{
//     // res.setHeader("Set-Cookie","newUser=true");
//     res.cookie('newUser',false);
//     res.cookie('isemployee',true,{maxAge: 60 * 60 * 24,httpOnly:true});


//     res.send("you got the cookies");
// })

// app.get('/read-cookies',(req,res)=>{
//     const cookies = req.cookies;
//     console.log(cookies);
//     res.json(cookies);
// })

const handleErrors = (err) =>{
    console.log(err.message,err.code);
    let errors = {
        name : '',
        password : ''
    }

    //duplicate error code
    if(err.code === 11000){
        errors.name = "User already exist";
        return errors;
    }

    //validation errors
    if(err.message.includes('REPUBLIC validation failed')){
        Object.values(err.errors).forEach(({properties}) =>{
            errors[properties.path] = properties.message;
        });
    }

    return errors;
}

///REGISTER THE USER
app.post("/signup",async(req,res)=>{
        const {name,password} = req.body;

        try{
            const user = await collection.create({name,password});
            const token = creatToken(user._id);
            res.cookie('jwt',token,{maxAge:1000*60*60*24,httpOnly:true});
            res.status(201).json({user : user._id});
        }
        catch(err){
            const errors = handleErrors(err);
            res.status(400).json({errors});
        }



});

//REGISTERING COMPLETED;


//login code //
app.post("/login",async(req,res)=>{
    try{
        const check=await collection.findOne({name:req.body.username});
        if(!check){
            res.send("APPADI ORU USER YAE ILLADA...POI SIGN UP PANNU POO");
        }

        const ispasswordmatch=await bcrypt.compare(req.body.password,check.password);
        if(ispasswordmatch){
            const token = creatToken(check._id);
            res.cookie('jwt',token,{maxAge:1000*60*60*24,httpOnly:true});
            res.status(200);
            res.render("home");
        }
        else{
            res.send("PASSWORD THAPPU DA....POI OULUNGA PODU");
        }
    }
    catch{
        res.send("THANGALODA DETAILS THAVARANATHU");
    }
})



const port=3000;
app.listen(port,()=>{
    console.log(`server is running on port :${port}`);
})