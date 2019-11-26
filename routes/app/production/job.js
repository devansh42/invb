//This file contains code to manage workorder


const j = require("@hapi/joi");
const mysql = require("mysql2/promise");
const env = require("../../../env");
const err = require("../../../err");
const express = require("express");
const router = express.Router();


async function createOrModify(req, res, create) {
    const b = req.body;
    const conn = await mysql.createConnection(env.MYSQL_Props);

    //no need to check for duplicates
    let pstmt;
    try {
        if (create) {
            pstmt = await conn.prepare('INSERT INTO job_card(workorder,operation,qty,worker,post_time)VALUES(?,?,?,?,?)')
            await pstmt.execute([b.workorder, b.operation, b.qty, b.worker, b.post_time])
        }
        else {
            pstmt = await conn.prepare("update job_card set qty=? and worker=? and post_time=? where id=? limit 1");
            await pstmt.execute([b.qty, b.worker, b.post_time, b.id]);
        }
        res.json({ error: false });
    } catch (er) {
        res.json(err.InternalServerObj);
    } finally {

        if (pstmt != undefined) {
            pstmt.close().then(() => {
                conn.end();
            })
        } else conn.end();
    }
}


function create(req, res) {
    createOrModify(req, res, true);
}


function modify(req, res) {
    createOrModify(req, res, false);
}

function createModifyValidtor(req, res, next) {
    const { body } = req;
    const o = j.object({
        id: j.number().positive(),
        workorder: j.number().positive(),
        operation: j.number().positive(),
        qty: j.number().positive(),
        worker: j.number().positive(),
        post_time: j.date()
    });
    if (o.validate(body) == null) {
        res.json({ error: true, code: err.BadRequest, errorMsg: "Invalid Request Parameter" });
    }
    else next();
}


function readValidtor(req, res, next) {
    const { body } = req;
    const o = j.object({
        id: j.number().positive(),
        workorder: j.number().positive(),
        worker: j.number().positive(),
        job_card: j.number().positive(),
        job_log: j.number().positive()
    });
    if (o.validate(body) == null) {
        res.json({ error: true, code: err.BadRequest, errorMsg: "Invalid Request Parameter" });
    }
    else next();

}

async function read(req, res) {
    const b = req.body;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt, results;
    try {
        let sql = "select j.id,j.state,j.entityId,j.plId,j.workorder,j.operation,j.qty,j.post_time,o.name as operation_name from job_card as j  join operation as o on o.id=j.operation ";
        if ('workorder' in b) {
            pstmt = await conn.prepare(sql.concat(" where j.workorder=?"));
            [results, c] = await pstmt.execute([b.workorder]);
        }
        else if ('operation' in b) {
            pstmt = await conn.prepare(sql.concat(" where j.operation=?"));
            [results, c] = await pstmt.execute([b.operation]);

        }
        else if ('id' in b) {
            pstmt = await conn.prepare(sql.concat(" where j.id=? limit 1"));
            [results, c] = await pstmt.execute([b.id]);

        }
        else if ('job_log' in b) {
            //returns job_logs for a given job_card
            sql = "select j.job_card,j.st_time,j.en_time,j.id,j.worker,a.name as worker_name from job_logs as j join account as a on a.id=j.worker  where j.job_card=?";
            pstmt = await conn.prepare(sql);
            [results, c] = await pstmt.execute([b.job_log]);

        }
        else {
            //return every record
            pstmt = await conn.prepare(sql);
            [results, c] = await pstmt.execute();

        }

        res.json({ error: false, result: results });
    }
    catch (er) {
        res.json(err.InternalServerObj);
    } finally {
        if (pstmt != undefined) {
            pstmt.close().then(() => {
                conn.end();
            });
        } else conn.end();
    }
}


router.post("/create", createModifyValidtor, create);
router.post("/modify", createModifyValidtor, modify);
router.post("/read", readValidtor, read);



module.exports = router;