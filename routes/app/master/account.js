const j=require("@hapi/joi");
const mysql=require("mysql2/promise");
const env=require("../../../env");
const err=require("../../../err");
const express=require("express");
const router=express.Router();


let createModifyValidtor=(req,res,next)=>{
    let b=req.body;
    let o=j.object({
        id:j.number().positive(),
        name:j.string().min(2).max(100).required(),
        gender:j.number().min(0).max(1).required(),
        gid:j.number().positive().required(),
        dob:j.date().required(),
        mobile_no:j.string().min(10).max(15),
        email:j.string(),
        addr:j.string().max(200),
        town:j.string().max(20),
        pincode:j.string().regex(/^\d{6}$/),
        id_proof:j.number().positive(),
        id_proof_no:j.string().max(100).min(2),
        join_date:j.date()
    });

    if(o.validate(b)==null){
        res.json({error:true,errorMsg:"Invalid Input Supplied",code:err.BadRequest});
    }else next();
}



let readValidtor=(req,res,next)=>{
    let b=req.body;
    let o=j.object({
        id:j.number().positive(),
        name:j.string().min(2).max(100),
        gid:j.number().positive()
    
    });

    if(o.validate(b)==null){
        res.json({error:true,errorMsg:"Invalid Input Supplied",code:err.BadRequest});
    }else next();
}


let create=(req,res)=>{
    createOrModify(req,res,true);
};
let modify=(req,res)=>{
    createOrModify(req,res,false);
}

let read=async (req,res)=>{
    //
    let b=req.body;
    const conn=await mysql.createConnection(env.MYSQL_Props);
    let pstmt;
    let valid=true,result;
    let sql="select a.name,a.id,a.gid,b.name as group_name from account as a inner join groups as b on b.id=a.gid ";
    if("id" in b){
        pstmt=await conn.prepare(sql.concat("where a.id=? limit 1"));
        [r,c]=await pstmt.execute([b.id])
        if(r.length>0){
            result=r[0]
        }else{
        valid=false;
        }
    }
    else if("name" in b){
        pstmt=await conn.prepare(sql.concat(" where a.name=? limit 1"));
        [r,c]=await pstmt.execute([b.name])
        if(r.length>0){
            result=r[0]
        }else{
        valid=false;
        }
    }
    else if("gid" in b){
        pstmt=await conn.prepare(sql.concat( " where a.gid=?"));
        [r,c]=await pstmt.execute([b.id])
        if(r.length>0){
            result=r
        }else{
        valid=false;
        }
    }
    else{
        pstmt=await conn.prepare(sql);
        [r,c]=await pstmt.execute()
        result=r;
    }
    if(valid){
        res.json({error:false,result});
    }else{
        res.json({error:true,errorMsg:"No content found",code:err.NoContent});
    }
    if(pstmt!=undefined)pstmt.close().then(()=>conn.end());
    else conn.end();
}



let  createOrModify=async (req,res,state)=>{
    const b=req.body;
    const conn=await mysql.createConnection(env.MYSQL_Props);
    let pstmt= await conn.prepare("select id from account where name=? limit 1");
    [r,c]=await pstmt.execute([b.name]);
    if(r.length>0){
        //duplicate
        res.json({error:true,errorMsg:"Duplicate Account",code:err.Duplicate});
    }else{

        let ar=[
            b.name,
            b.gender,
            (b.dob=="")?null:b.dob,
            b.mobile_no,
            b.email,
            b.addr,
            b.town,
            b.pincode,
            (b.id_proof=="")?null:b.id_proof,
            (b.id_proof_no=='')?null:b.id_proof_no,
            (b.join_date=="")?null:b.join_date,
            b.gid
        ];
        if(create){
            pstmt=await conn.prepare("insert into account(name,gender,dob,mobile_no,email,addr,town,pincode,id_proof,id_proof_no,join_date,gid)VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
            await pstmt.execute(ar);
        }else{
            pstmt=await conn.prepare("update account set name=? and set gender=? and set dob=? and set mobile_no=? and set email=? and set addr=? and set town=? and set pincode=? and set id_proof=? and set id_proof_no=? and set join_date=? and set gid=? where id=?");
            ar.push(b.id);
            await pstmt.execute(ar);
            }

        res.json({error:false});
    }
    if(pstmt==undefined) conn.end();
    pstmt.close().then(()=>conn.end());

}



router.post("/create",createModifyValidtor,create);
router.post("/modify",createModifyValidtor,modify);
router.post("/read",readValidtor,read);


module.exports=router;