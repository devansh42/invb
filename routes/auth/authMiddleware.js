//This contains code to implement middleware to used to authenticate user
const jwt=require("jsonwebtoken");
const env=require("../../env");
const fs=require("fs");
module.exports=(req,res,next)=>{

    let h=req.get("Authorization");
    let ar=h.split(" ");
    let token=ar[ar.length-1];
    let opt={
        algorithms: ['HS256'],
        issuer:env.JWT_ISSUER,
        audience:env.JWT_AUD,
        ignoreExpiration:false
    };
    try {
       // let fc=fs.readFileSync(env.PRV_KEY);
        //console.log(fc);
        let {uid}=jwt.verify(token,"ThisIsACarAndIamDrivingIt",opt);
        next();
    } catch (err) {
        //forbidden
        console.log("Google is an Ass hole");  
        res.status(403).send("Authentication Falied: Login Required");
    }
    
}