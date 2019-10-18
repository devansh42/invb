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
        pstmt = await conn.prepare('INSERT INTO job_card(workorder,operation,qty,worker,post_time)VALUES(?,?,?,?,?)')
        await pstmt.execute([b.workorder,b.operation,b.qty,b.worker,b.post_time])
    }
    else{
        pstmt=await conn.prepare("update job_card set qty=? and worker=? and post_time=? where id=? limit 1");
        await pstmt.execute([b.qty,b.worker,b.post_time,b.id]);
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
        workorder:j.number().positive(),
        operation:j.number().positive(),
        qty:j.number().positive(),
        worker:j.number().positive(),
        post_time:j.date()
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
        workorder:j.number().positive(),
        worker:j.number().positive(),
        job_card:j.number().positive()
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
    let sql="select j.id,j.workorder,j.operation,j.qty,j.worker,j.post_time,a.name as worker_name,o.name as operation_name from job_card as j join account as a on a.id=j.worker join operation as o on o.id=j.operation ";
    if('workorder' in b){
        pstmt= await conn.prepare(sql.concat(" where j.workorder=?"));
        [results,c]=await pstmt.execute([b.workorder]);
    }
    else if('worker' in b){
        pstmt= await conn.prepare(sql.concat(" where j.worker=?"));
        [results,c]=await pstmt.execute([b.worker]);
        
    }
    else if('operation' in b){
        pstmt= await conn.prepare(sql.concat(" where j.operation=?"));
        [results,c]=await pstmt.execute([b.operation]);
        
    }
    else if('id' in b){
        pstmt= await conn.prepare(sql.concat(" where j.id=? limit 1"));
        [results,c]=await pstmt.execute([b.id]);
        
    }
    else if('job_log' in b){
        //returns job_logs for a given job_card
        sql="select job_card,st_time,en_time,qty from job_log where job_card=?";
        pstmt= await conn.prepare(sql);
        [results,c]=await pstmt.execute([b.id]);
        
    }
    else{
        //return every record
        pstmt= await conn.prepare(sql);
        [results,c]=await pstmt.execute();
     
    }

    res.json({error:false,results});
    if(pstmt!=undefined){
        pstmt.close().then(x=>{
            conn.close();
        });
    }
}



module.exports=router;