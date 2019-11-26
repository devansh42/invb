const j = require("@hapi/joi");
const mysql = require("mysql2/promise");
const env = require("../../../env");
const err = require("../../../err");
const express = require("express");
const router = express.Router();



let read = async (req, res) => {
    //reading from database
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt, b = req.body;
    try{
        if ('id' in b) {
            pstmt = await conn.prepare("select a.id,a.name,a.addr,a.op_time,a.cl_time,a.gid,b.name as group_name from workplace as a inner join groups as b on b.id=a.gid where a.id=? limit 1");
            [r, w] = await pstmt.execute([b.id])
            if (r.length < 1) {
                res.json({ error: true, errorMsg: "Invalid Workplace Id", code: err.NoContent })
            } else {
                res.json({ error: false, result: r[0] });
            }
        }
        else if ('gid' in b) {
            pstmt = await conn.prepare("select a.id,a.name,a.addr,a.op_time,a.cl_time,a.gid,b.name as group_name from workplace as a inner join groups as b on b.id=a.gid where a.gid=?");
            [r, w] = await pstmt.execute([b.gid])
            if (r.length < 1) {
                res.json({ error: true, errorMsg: "Invalid Group Id", code: err.NoContent })
            } else {
                res.json({ error: false, result: r });
            }
        }
        else {
            pstmt = await conn.prepare("select a.id,a.name,a.addr,a.op_time,a.cl_time,a.gid,b.name as group_name from workplace as a inner join groups as b on b.id=a.gid");
            [r, w] = await pstmt.execute()
            res.json({ error: false, result: r });
        }
        res.end();
    }
    catch (er) {
        res.json(err.InternalServerObj);
    } finally {
        if (pstmt != undefined) pstmt.close().then(() => conn.end());
        else conn.end()
    }
}



let readValidtor = (req, res, next) => {
    let o = j.object({
        id: j.number().positive(),
        gid: j.number().positive()
    });
    let b = req.body;
    if (o.validate(b) == null) {
        res.json({ error: true, errorMsg: "Bad Request", code: err.BadRequest })
        res.end();
    } else {
        next();
    }
}


let createModifyValidtor = (req, res, next) => {
    let o = j.object({
        name: j.string().required().min(2).max(200),
        addr: j.string().required().min(2).max(500),
        op_time: j.string().regex(/^\d{2}:\d{2}$/).required(),
        cl_time: j.string().regex(/^\d{2}:\d{2}$/).required(),
        gid: j.number().positive()

    });
    let b = req.body;
    let valid = true;

    if (o.validate(b) == null) {
        valid = false;
    } else {

        let opt = b.op_time;
        let cpt = b.cl_time;
        [h, m] = opt.split(":").map(Number);
        if (h > 23 || m > 50) {
            valid = false;
        }

        [h, m] = cpt.split(":").map(Number);
        if (h > 23 || m > 50) {
            valid = false;
        }

    }
    if (valid) next(); //forward request
    else res.json({ error: true, errorMsg: "Invalid Input Supplied", code: err.BadRequest });


}




let createOrModify = async (req, res, create) => {
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt;
    try {
        pstmt = await conn.prepare("select id from workplace where name=? limit 1");
        let b = req.body;
        [r, c] = await pstmt.execute([b.name]);
        if (r.length > 0) {
            res.json({ error: true, code: err.Duplicate, errorMsg: "Duplicate Workplace" });
        } else {
            let opt = b.op_time;
            let cpt = b.cl_time;
            [h, m] = opt.split(":").map(Number);
            let a = (h * 60) + m;
            a *= 60;
            [h, m] = cpt.split(":").map(Number);
            let c = (h * 60) + m;
            c *= 60;

            if (create) {
                pstmt = await conn.prepare("insert into workplace(name,addr,op_time,cl_time,gid)values(?,?,?,?,?)");
                await pstmt.execute([b.name, b.addr, a, c, b.gid]);
            } else {
                pstmt = await conn.prepare("update workplace set name=? and addr=? and op_time=? and cl_time=? and gid=? where id=? limit 1");
                await pstmt.execute([b.name, b.addr, a, c, b.gid, b.id]);
            }
            res.json({ error: false, code: err.Ok });
        }
    } catch (er) {
        res.json({ error: true, errorMsg: err.InterServerErrMsg, code: err.InternalServer });
    } finally {

        if (pstmt != undefined) pstmt.close().then(() => conn.end());
        else conn.end();
    }
}

let create = (req, res) => {
    createOrModify(req, res, true);
}
let modify = (req, res) => {
    createOrModify(req, res, false);
}


router.post("/create", createModifyValidtor, create);
router.post("/modify", createModifyValidtor, modify);
router.post("/read", readValidtor, read);


module.exports = router;