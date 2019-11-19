const j = require("@hapi/joi");
const mysql = require("mysql2/promise");
const env = require("../../../env");
const err = require("../../../err");
const express = require("express");
const router = express.Router();



async function read(req, res) {
    const { body } = req;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt, results = [];
    if ('uid' in body) {
        pstmt = await conn.prepare("select u.uid,u.username,u.aid,a.name as account_name from users as u innner join account as a on u.aid=a.id where u.uid=? limit 1");
        [r, c] = await pstmt.execute([body.uid]);
        results = r;
    }
    else if ('aid' in body) {
        pstmt = await conn.prepare("select uid,username,aid from users where aid=?");
        [r, c] = await pstmt.execute([body.aid]);
        results = r;
    }
    res.status(err.Ok).json({ error: false, results })
    if (pstmt != undefined) {
        pstmt.close(v => {
            conn.close();
        })
    }
}



async function createOrModify(req, res, create) {
    const { body } = req;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt = await conn.prepare("select uid from users where username=? limit 1");
    const [r, c] = await pstmt.execute([body.username]);
    if (r.length > 0) {
        res.status(err.Duplicate).json({ error: true, errorMsg: "Duplicate username" }).end();
    } else {

        if (create) {//make new one
            pstmt = await conn.prepare("insert into users(username,password,aid)values(?,?,?)");
            let resultSet = await pstmt.execute([body.username, body.password, body.aid]);
            const uid = resultSet.insertId;
            await insertPerms(pstmt, conn, body, uid);

        } else {//modify
            pstmt = await conn.prepare("select uid from users where username=? limit 1");
            [r, c] = await pstmt.execute([body.username]);
            const uid = r.uid;
            pstmt = await conn.prepare("update users set username=? and password=? limit 1");
            await pstmt.execute([body.username, body.password]);
            //first we will delete all the previously assigned perms 
            pstmt = await conn.prepare("delete from users where uid=?");
            await pstmt.execute([uid]);
            await insertPerms(pstmt, conn, body, uid);
        }
        await pstmt.execute([body.username, body.password]);
        res.status(err.Ok).end();
    }
    pstmt.close().then(r => { conn.close() });

}


async function insertPerms(pstmt, conn, body, uid) {
    pstmt = await conn.prepare("insert into perms(uid,menu)values(?,?)");
    return Promise.all(body.menu_perm.map(v=>pstmt.execute([uid,v])) );//waiting while full filling all the promises
}


function readValidtor(req, res, next) {

    let o = j.object({
        uid: j.number().positive(),
        aid: j.number().positive()
    });
    const { body } = req;
    if (o.validate(body) == null) {
        res.status(err.BadRequest).json({ error: true, errorMsg: "Invalid Request Parameters" }).end();
    } else {
        next();
    }

}


function createModifyValidtor(req, res, next) {
    let o = j.object({
        username: j.string().max(8).required().regex(/[a-zA-Z0-9_]{,20}/),
        password: j.string().min(8).required(),
        cpassword: j.string().min(8).required(),
        aid: j.number().positive()
    });
    if (o.validate(req.body) == null) {
        res.status(err.BadRequest).json({ error: true, errorMsg: "Invalid Parameter found" }).end();
    } else {
        next();
    }
}



function create(req, res) {
    createOrModify(req, res, true);
}

function modify(req, res) {

    createOrModify(req, res, false);
}


router.post("/create", createModifyValidtor, create);
router.post("/modify", createModifyValidtor, modify);
router.post("/read", readValidtor, read);

module.exports = router;
