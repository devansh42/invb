//This file contains logic to control auth
//uses jwt

const j=require("@hapi/joi");
const mysql =require("mysql2/promise");
const env=require("../../env");
const jwt=require("jsonwebtoken");




const checkAuth=(_,res)=>{
    res.status(200).send("Ok").end();
}

const authR=(req,res)=>{
    let sc=j.object({
        username:j.string().required().min(5).max(20),
        password:j.string().required().min(8)
    });
    
    if(sc.validate(req.body)!=null){
       
        verifyUser(req.body.username,req.body.password)
        .then(result=>{
            //user is valid
            makeAuthToken(result.uid)
            .then(token=>{
                res.status(200);
                res.send({error:false,token:token,result});
                res.end();
            })
        })
        .catch(err=>{
            res.status(403);
            res.json({error:true,errMsg:err.message});
            res.end();
        });

    }else{
        res.status(401);
        res.json({error:true,errMsg:"Invalid Login/Password"});
        res.end();
        }

}


let makeAuthToken=async (uid)=>{

    
    let opts={
        algorithm: 'HS256',
        issuer:env.JWT_ISSUER,
        expiresIn:"12h",
        audience:env.JWT_AUD,
       
    };
    token = jwt.sign({"uid":uid},"ThisIsACarAndIamDrivingIt",opts);  
   
    return token;
}

const verifyUser=async (username,password)=>{
    
    const conn=await mysql.createConnection(env.MYSQL_Props);

    const pstmt=await conn.prepare("select uid from users where username=? and password=? limit 1");
    const [rows]=await pstmt.execute([username,password]);
    pstmt.close().then(x=>conn.close());

    if(rows.length==0){
        //invalid password or username
        throw Error("Invalid username or password");
    }else{
        let row=rows[0];
        return row
    }
}

module.exports={authR,checkAuth};