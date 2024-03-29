//This file contains code to handle backend request
const j = require("@hapi/joi");
const mysql = require("mysql2/promise");
const env = require("../../../env");
const err = require("../../../err");
const express = require("express");
const router = express.Router();
const logg =require("../../../entity/logg");
const fire = require("../../auth/fire");
function create(req, res) {

    createOrModify(req, res, true);
}


function modify(req, res) {
    createOrModify(req, res, false);
}


async function read(req, res) {
    const b = req.body;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt;
    let results = [];
    try {
        let sql = "select o.id,o.name,o.workplace,o.gid,o.description,g.name as group_name,w.name as workplace_name from operation as o join groups as g on o.gid=g.id join workplace as w on w.id=o.workplace";
        if ('gid' in b) {
            pstmt = await conn.prepare(sql.concat(" where o.gid=?"));
            [r, c] = await pstmt.execute([b.gid]);
            results = r;
        }
        else if ('workplace' in b) {
            pstmt = await conn.prepare(sql.concat(" where o.workplace=?"));
            [r, c] = await pstmt.execute([b.workplace]);
            results = r;

        }
        else if ('id' in b) {
            pstmt = await conn.prepare(sql.concat(" where o.id=? limit 1"));
            [r, c] = await pstmt.execute([b.id]);
            results = r[0];

        }
        else {
            //every record
            pstmt = await conn.prepare(sql);
            [r, c] = await pstmt.execute();
            results = r;

        }
        res.json({ error: false, result: results }).end()
    }
    catch (er) {
        
        logg.log(er.message);
        res.json(err.InternalServerObj);
    }
    finally {
        if (pstmt != undefined) {
            pstmt.close()
                .then(r => { conn.end() })
        } else conn.end();
    }
}



async function createOrModify(req, res, create) {
    const b = req.body;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt;

    try {
        pstmt = await conn.prepare("select name,gid from operation where name=? and gid=? limit 1");
        const [rs] = await pstmt.execute([b.name, b.gid]);

        if (rs.length > 0) {
            res.json({ error: true, code: err.Duplicate, errorMsg: "Duplicate Item" }).end();
        } else {
            //we can proceed further
            if (create) {
                pstmt = await conn.prepare("insert into operation(name,gid,workplace,description)values(?,?,?,?)");
                await pstmt.execute([b.name, b.gid, b.workplace, b.description]);
            } else {
                //we can change everything about operation
                pstmt = await conn.prepare("update operation set name=? , gid=? , workplace=?, description=? where id=? limit 1");
                await pstmt.execute([b.name, b.gid, b.workplace, b.description, b.id])
            }
            res.json({ error: false })

        }

    } catch (er) {
        res.json({ error: true, errorMsg: err.InterServerErrMsg, code: err.InternalServer });
        logg.log(er.message);
    }
    finally {

        if (pstmt != undefined) pstmt.close().then(() => conn.end());
        else conn.end();
    }

}


function createModifyValidtor(req, res, next) {
    const o = j.object({
        name: j.string().required().min(2).max(100),
        gid: j.number().positive().required(),
        workplace: j.number().positive().required(),
        description: j.string().max(500)
    });
    const { body } = req;
    if (o.validate(body) == null) {
        res.json({ error: true, errorMsg: "Invalid Input Supplied", code: err.BadRequest });
        res.end();
    } else {
        next();
    }
}


function readValidtor(req, res, next) {
    const { body } = req;
    const o = j.object({
        id: j.number().positive(),
        gid: j.number().positive(),
        workplace: j.number().positive()
    });
    if (o.validate(body) == null) {
        res.json({ error: true, errorMsg: "Invalid paramter supplied", code: err.BadRequest }).end();

    } else next();

}



router.post("/create", fire.fireWall([{ '*': ['1.8.1'] }]), createModifyValidtor, create);
router.post("/modify", fire.fireWall([{ '*': ['1.8.2'] }]), createModifyValidtor, modify);
router.post("/read", fire.fireWall([  {'route_operations':['1.8.3']},  { '*': ['1.8.3'] }, { 'id': ['1.8.4'] }]), readValidtor, read);


module.exports = router;