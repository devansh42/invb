//This file contains code for logic of route

const j = require("@hapi/joi");
const mysql = require("mysql2/promise");
const env = require("../../../env");
const err = require("../../../err");
const express = require("express");
const router = express.Router();


function create(req, res) {
    createOrModify(req, res, true);
}


function modify(req, res) {
    createOrModify(req, res, false);
}


async function createOrModify(req, res, create) {
    const b = req.body;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt = await conn.prepare("select id from route where name=? limit 1");
    [r, c] = await pstmt.execute([b.name]);
    if (r.length > 0) {
        res.json({ error: true, errorMsg: "A Route exists with this name", code: err.Duplicate }).end();
    } else {
        if (create) {
            pstmt = await conn.prepare("insert into  route(name,gid,description)values(?,?,?)");
            let r = pstmt.execute([b.name, b.gid, b.description]);
            const rId = r.insertId;
            pstmt = await conn.prepare("insert into route_operations(route,operation)values(?,?)");
           
            b.operation.forEach(async (v,i)=>{
                await pstmt.execute([rId,Number(v)]); //We didn't use map function, because order of operations in route is also important
            })
           } else {
            pstmt = await conn.prepare("update route set name=? and set gid=? and set description=? where id=?  limit 1");
            await pstmt.execute([b.name, b.gid, b.description, b.id]);
        }
        res.json({ error: false });
    }
    if (pstmt != undefined) {
        pstmt.close().then(r => { conn.end(); });

    } else {
        conn.end();
    }
}



function createModifyValidtor(req, res, next) {
    const { body } = req;
    const o = j.object({
        name: j.string().required().max(100),
        gid: j.number().positive().required(),
        description: j.string(),
        operation: j.array().required()
    });
    if (o.validate(body) != null) {
        res.json({ error: true, errorMsg: "Invalid Parameter Supplied", code: err.BadRequest });
        res.end();
    }
    else next();
}

function readValidtor(req, res, next) {
    const { body } = req;
    const o = j.object({
        name: j.string().max(100),
        gid: j.number().positive(),
        route_operations: j.number().positive()
    });
    if (o.validate(body) == null) {
        res.json({ error: false, errorrMsg: "Invalid Request Parameters", code: err.BadRequest }).end();
    } else next();

}


async function read(req, res) {
    const b = req.body;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt, results = [];
    const sql = "select id,name,gid,description from route"
    if ('name' in b) {
        pstmt = await conn.prepare(sql.concat(" where name=? limit 1"));
        [r, c] = await pstmt.execute([b.name]);
        results = r[0];
    }
    else if ('gid' in b) {
        pstmt = await conn.prepare(sql.concat(" where gid=?"));
        [results, c] = await pstmt.execute([b.gid]);

    }
    else if ('id' in b) {
        pstmt = await conn.prepare(sql.concat(" where id=? limit 1"));
        [r, c] = await pstmt.execute([b.id]);
        results = r[0];

    }
    else if ('route_operations' in b) {
        const x = "select r.route,r.operation,o.name,o.description,o.workplace,o.gid,g.name as group_name,w.name as workplace_name from route_operations as r join operation as o on r.operation=o.id join groups as g on g.id=o.gid join workplace as w on w.id=o.workplace where r.route=?";
        pstmt = await conn.prepare(x);
        [results, c] = await pstmt.execute([b.route_operations]);
    }
    else {
        pstmt = await conn.prepare(sql);
        [results, c] = await pstmt.execute();
    }
    res.json({ error: false, result: results });
    if (pstmt != undefined) {
        pstmt.close().then(() => { conn.end() });
    } else conn.end();
}


router.post("/create", createModifyValidtor, create);
router.post("/modify", createModifyValidtor, modify);
router.post("/read", readValidtor, read);

module.exports = router;