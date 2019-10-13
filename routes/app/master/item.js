const j=require("@hapi/joi");
const mysql=require("mysql2/promise");
const env=require("../../../env");
const err=require("../../../err");
const express=require("express");
const router=express.Router();



router.post("/create",createModifyValidtor,create);
router.post("/modify",createModifyValidtor,modify);
router.post("/read",readValidtor,read);

let create=(req,res)=>{
    createOrModify(req,res,true);
}
let modify=(req,res)=>{
    createOrModify(req,res,false);
}

let read=async (req,res)=>{
    let b=req.body;
    const conn=await mysql.createConnection(env.MYSQL_Props);
    let pstmt;
    let valid=true,result=[];
    if('id' in b){
        pstmt=await conn.prepare("select a.name,a.unit,a.gid,b.name as unit_name,c.name as group_name from item as a inner join units as b on a.unit=b.id inner join groups as c on a.gid=c.id where a.id=? limit 1");
        [r,c]=await pstmt.execute([b.id])
        if(r.length>0){
            result=r[0];
        }else valid=false;
    }
    else if('name' in b){
        pstmt=await conn.prepare("select a.name,a.unit,a.gid,b.name as unit_name,c.name as group_name from item as a inner join units as b on a.unit=b.id inner join groups as c on a.gid=c.id where a.name=? limit 1");
        [r,c]=await pstmt.execute([b.name])
        if(r.length>0){
            result=r[0];
        }else valid=false;
    }
    else if('gid' in b){
        pstmt=await conn.prepare("select a.name,a.unit,a.gid,b.name as unit_name,c.name as group_name from item as a inner join units as b on a.unit=b.id inner join groups as c on a.gid=c.id where a.gid=?");
        [r,c]=await pstmt.execute([b.gid])
        if(r.length>0){
            result=r;
        }else valid=false;
    }
    else{
        pstmt=await conn.prepare("select a.name,a.unit,a.gid,b.name as unit_name,c.name as group_name from item as a inner join units as b on a.unit=b.id inner join groups as c on a.gid=c.id where a.gid=?");
        [r,c]=await pstmt.execute([b.gid])
        if(r.length>0){
            result=r;
        }
    }
    if(valid){
        res.json({error:false,result});
        res.end();
    }else res.json({error:true,errorMsg:"Invalid Input supplied",code:err.NoContent});
}


let createOrModify=async (req,res,create)=>{
    
    const conn=await mysql.createConnection(env.MYSQL_Props);
    let b=req.body;
    let pstmt=await conn.prepare("select id from item where name=? limit 1");
    [r,c]=await pstmt.execute([b.name])
    if(r.length>0){
        //duplicate
        res.json({error:true,errorMsg:"Duplicate Item",code:err.Duplicate})

    }else{
    
        if(create){
        let pstmt=await conn.prepare("insert into item(name,unit,gid)values(?,?,?)");
        await pstmt.execute([b.name,b.unit,b.gid]);

        }
        else{
         pstmt=await conn.prepare("update item set name=? and gid=? where id=?")
         await pstmt.execute([b.name,b.gid,b.id])

        }
        res.json({error:false});
    }
    pstmt.close().then(conn.close());

}


let createModifyValidtor=(req,res,next)=>{
    let b=req.body;
    let o=j.object({
        name:j.string().required().min(2).max(100),
        unit:j.number().positive(),
        gid:j.number().positive()
    });
    if(o.validate(b)==null){
        res.json({error:true,errorMsg:"Invalid Input Supplied",code:err.BadRequest});
        res.end();
    }else next();
}

let readValidtor=(req,res,next)=>{
        let o=j.object({
            id:j.number().positive(),
            name:j.string().min(2).max(100),
            gid:j.number().positive()
        });
        let b=req.body;
        if(o.validate(b)==null){
            res.json({error:true,errorMsg:"Invalid Input Supplied",code:err.BadRequest});
        }else{
            next();
        }

}