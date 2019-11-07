//This file contains code to manage workorder


const j=require("@hapi/joi");
const mysql=require("mysql2/promise");
const env=require("../../../env");
const err=require("../../../err");
const express=require("express");
const router=express.Router();


router.post("/create",createModifyValidtor,create);
router.post("/modify",createModifyValidtor,modify);
router.post("/read",readValidtor,read);


async function createOrModify(req,res,create){
    const b=req.body;
    const conn=await mysql.createConnection(env.MYSQL_Props);
    
    //no need to check for duplicates
    let pstmt;
    if(create){
        pstmt=await conn.prepare("insert into workorder(item,qty,bom,post_date,st_date,de_date,nbom)VALUES(?,?,?,?,?,?,?)");
        const resultSet=await pstmt.execute([b.item,b.qty,b.bom,b.post_date,b.nbom])
        const wid=resultSet.insertId;
        pstmt =await conn.prepare("select o.operation from route_operations as o join bom as b on b.routing=o.route where b.id=?");
        [r,c]=await pstmt.execute([b.bom]);
        pstmt=await conn.prepare("INSERT INTO inv.job_card(workorder,operation,qty,post_time)VALUES(?,?,?,?) ");
        const ar= r.map(v=>{
            return pstmt.execute([wid,v.operation,b.qty]);
        });
        await Promise.all(ar);
    }
    else{
        pstmt=await conn.prepare("update workorder set qty=? and set bom = ? and set post_date=? and set st_date = ? and set de_date = ? and set nbom=? where id=? limit 1");
        await pstmt.execute([b.qty,b.bom,b.post_date,b.nbom,b.id])
        
    }
    res.json({error:false});
    if(pstmt!=undefined){
        pstmt.close().then(()=>{
            conn.close();
        })
    }
    
}


function create(req,res){
    createOrModify(req,res,true);
}


function modify(req,res){
    createOrModify(req,res,false);
}

function createModifyValidtor(req,res,next){
    const {body}=req;
    const o=j.object({
        id:j.number().positive(),
        item:j.number().positive(),
        qty:j.number().positive(),
        bom:j.number().positive(),
        post_date:j.date(),
        st_date:j.date(),
        de_date:j.date(),
        nbom:j.number()
    });
    if(o.validate(body)==null){
        res.json({error:true,code:err.BadRequest,errorMsg:"Invalid Request Parameter"});
    }
    else next();    
}


function readValidtor(req,res,next){
    const {body}=req;
    const o=j.object({
        id:j.number().positive(),
        item:j.number().positive(),
        bom:j.number().positive(),
    });
    if(o.validate(body)==null){
        res.json({error:true,code:err.BadRequest,errorMsg:"Invalid Request Parameter"});
    }
    else next();    
    
}
 
async function read(req,res){
    const {b}=req;
    const conn=await mysql.createConnection(env.MYSQL_Props);
    let pstmt,results;
    let sql="select w.id,w.item,w.qty,w.bom,w.post_date,w.state,w.st_date,w.de_date,w.nbom,b.name as bom_name,i.name as item_name from workorder as w join bom as b on b.id=w.bom join item as i on i.id=w.item ";
    if('item' in b){
        pstmt= await conn.prepare(sql.concat(" where w.item=?"));
        [results,c]=await pstmt.execute([b.item])
    }
    else if('bom' in b){
        pstmt= await conn.prepare(sql.concat(" where w.bom=?"));
        [results,c]=await pstmt.execute([b.bom])
        
    }
    else if('id' in b){
       //retriving a specific record from the table
       pstmt= await conn.prepare(sql.concat(" where w.id=? limit 1"));
       [results,c]=await pstmt.execute([b.id])
    }
    else{
        pstmt= await conn.prepare(sql);
        [results,c]=await pstmt.execute()
    }

    res.json({error:false,results});
    if(pstmt!=undefined){
        pstmt.close().then(x=>{
            conn.close();
        });
    }
}



module.exports=router;