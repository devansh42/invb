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


function createOrModify(req,res,create){
    const b=req.body;
    const conn=await mysql.createConnection(env.MYSQL_Props);
    
    //no need to check for duplicates
    let pstmt;
    if(create){
        pstmt=await conn.prepare("INSERT INTO workorder(item,qty,bom,post_date,st_date,de_date,nbom)VALUES(?,?,?,?,?,?,?)");
        pstmt.execute([b.item,b.qty,b.bom,b.post_date,])
    
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

function read(req,res){
    const {body}=req;
    const conn=await mysql.createConnection(env.MYSQL_Props);
    
}
