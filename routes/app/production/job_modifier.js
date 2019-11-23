//This file contains endpoint definition for job card modifier
//Which actually controls the job modifier


const j = require("@hapi/joi");
const mysql = require("mysql2/promise");
const env = require("../../../env");
const err = require("../../../err");
const express = require("express");
const SerialSeq = require("../../../entity/serialSeq");
const router = express.Router();


//router.post("/create", createModifyValidtor, create);
//router.post("/modify", createModifyValidtor, modify);

const actionValidator = (req, res, next) => {
    const { body } = req;
    const o = j.object({
        job_card: j.number().required(),
        action: j.string().allow("start", "finish"),
        time: j.number().required(),
        workorder: j.number().required()
    });
    if (o.validate(body) == null) {
        res.json({ error: true, errorMsg: "invalid Request Parameters", code: err.BadRequest });

    } else next()
}

const action = async (req, res) => {
    const { body } = req;
    const b = body;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let sql = "select st_time,fi_time,state from job_card where id= ?";
    let pstmt = await conn.prepare(sql);
    let [r] = await pstmt.execute([b.job_card]);
    let error = { error: false };
    if (r.length > 0) {
        const { st_time, fi_time, state } = r[0];
        let nextState = 0;
        switch (b.action) {
            case "start":
                if (state == 1) {
                    sql = "update job_card set st_time = ? , state = ? where id = ? limit 1";
                    nextState = 2;
                } else error = {
                    error: true,
                    errorMsg: "Invalid action, operation is started previously",
                    code: err.BadRequest
                }

                break;
            case "finish":
                if (state >= 2) {
                    sql = "update job_card set fi_time = ? , state = ? where id = ? limit 1";
                    nextState = 4;
                } else error = {
                    error: true,
                    errorMsg: "Invalid action, operation cannot be finished",
                    code: err.BadRequest
                }
                break;
            default:
                error = {
                    error: true,
                    errorMsg: "Invalid action",
                    code: err.BadRequest
                }
                break;
        }
        if (error.error) {
            //Error
        } else {
            pstmt = await conn.prepare(sql);
            await pstmt.execute([body.time, nextState, body.job_card]);
            error.nextState = nextState; //new state of operation
            if (b.action == "finish") {
                //checking state of workorder
                sql = "select entityId,plId from job_card where id=?";
                pstmt = await conn.prepare(sql);
                let [r] = await pstmt.execute([body.job_card])
                let eId = r[0].entityId;  //It may be null
                let plId = r[0].plId;

                let isRouteCompleted = await finish_WithSerial(conn, pstmt, body, eId, plId, eId != null)
                if (isRouteCompleted) {
                    //Now we will update workder completed quantity
                    //And also update workorder satus if it is changed
                    if (eId != null) {
                        console.log("fkrokforkfo")
                        sql = "update workorder set com_qty = com_qty + 1 , state = case when com_qty=qty then ? else state end where id= ? ";
                        pstmt = await conn.prepare(sql);
                        [r] = await pstmt.execute([4, body.workorder]);

                    } else {
                        sql = "update workorder set com_qty = qty where id=?";
                        pstmt = await conn.prepare(sql);
                        [r] = await pstmt.execute([body.workorder]);

                    }

                }

            }
        }
        res.json(error);

    } else {
        res.json({ error: true, errorMsg: "Invalid Job Card Id", code: err.BadRequest });
    }
    if(pstmt!=undefined) pstmt.close().then(() => { conn.end() });
    else conn.end();
}


/**
 * It's a pure function
 * @returns {boolean} specify whether route is completed for the item
 * @param {MySqlPreparedStatement} pstmt 
 * @param {MySqlConnection} conn 
 * @param {HttpRequestBody} body 
 * @param {Number} eId 
 */
const finish_WithSerial = async (conn,pstmt, body, eId, plId, haveSerialNo) => {
    let sql = "select r.operation from route_operations as r join bom as b on r.route =b.routing join workorder as w on w.bom=b.id where w.id=?";
    pstmt = await conn.prepare(sql);
    let [operations] = await pstmt.execute([body.workorder]);
    const col = haveSerialNo ? "entityId":"plId";
    sql = `select operation from job_card where  workorder=? and state=? and ${col}=?`;
    pstmt = await conn.prepare(sql);
    //Fetching operations those are processed
    [r] = await pstmt.execute([body.workorder, 4, (haveSerialNo) ? eId : plId]);
    return (r.length == operations.length);
}

const addValidator = (req, res, next) => {
    const { body } = req;
    const o = j.object({
        job_card: j.number(),
        logs: j.array().items(j.object({
            worker: j.number(),
            st_time: j.number(),
            en_time: j.number(),
            description: j.string()
        }))
    });
    if (o.validate(body) == null) {
        res.json({ error: true, errorMsg: "Invalid Request Parameters", code: err.BadRequest });
    } else next();
}

const add = async (req, res) => {
    const { body } = req;
    const b = body;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    const sql = "INSERT INTO inv.job_logs(job_card,worker,st_time,en_time,description)VALUES(?,?,?,?,?)";

    const pstmt = await conn.prepare(sql);
    const ar = body.logs.map(v => pstmt.execute([body.job_card, v.worker, v.st_time, v.en_time, v.description]));
    await Promise.all(ar);
   
   if(pstmt!=undefined) pstmt.close().then(() => { conn.end() });
   else conn.end();
    res.json({ error: false });

}

const deleteValidtor = (req, res, next) => {
    const { body } = req;
    const o = j.object({
        id: j.array().items(j.number())
    });

    if (o.validate(body) == null) {
        res.json({ error: true, errorMsg: "Invalid Request Parameters", code: err.BadRequest });
    }
    else next();
}

const deleteFn = async (req, res) => {
    const { body } = req;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    const sql = "delete from job_logs where id = ? limit 1";
    const pstmt = await conn.prepare(sql);
    const ar = body.id.map(v => pstmt.execute([v]));
    await Promise.all(ar);
    if(pstmt!=undefined)pstmt.close().then(() => { conn.end() });
    else conn.end();
    res.json({ error: false });
}

const readValidtor = (req, res, next) => {
    const b = req.body;
    const o = j.object({ id: j.number().required() });
    if (o.validate(b) == null) {
        res.json({ error: false, errorMsg: "Invalid request parameters", code: err.BadRequest });
    } else next();
}

const read = async (req, res) => {
    const { body } = req;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let sql, pstmt;
    sql = "select sn.sn,sn.ser_seq,j.plId,j.entityId,j.id,j.workorder,j.operation,j.qty,j.post_time,j.st_time,j.fi_time,j.state,s.name as state_name,o.name from job_card as j join operation as o on o.id=j.operation join process_states as s on s.id=j.state join serial_nos as sn on sn.id=j.entityId where j.id=? limit 1";
    pstmt = await conn.prepare(sql);
    let [r] = await pstmt.execute([body.id]);
    let result;
    if (r.length > 0) {
        result = { job_card: r[0] };
        if (r[0].entityId != null) {
            //Checking if item has serial no
            sql = "select *from serial_no_seq where id=? limit 1";
            pstmt = await conn.prepare(sql);
            [r] = await pstmt.execute([result.job_card.ser_seq]);
            const sn = new SerialSeq();
            sn.populateFromObject(r[0]);
            result.job_card.serial_no = sn.getSerialNo(result.job_card.sn);
        }
        sql = "select j.id,j.job_card,j.worker,j.st_time,j.en_time,j.description,a.name as worker_name from job_logs as j join  account as a on a.id = j.worker where j.job_card=?";
        pstmt = await conn.prepare(sql);
        [r] = await pstmt.execute([body.id]);
        result.job_logs = r; //saving logs
        //Now, we will



        res.json({ error: false, result });
    } else {
        //no result found invalid id
        res.json({ error: true, errorMsg: "Invalid Job Card Id", code: err.BadRequest });
    }
    if (pstmt == undefined) conn.end();
    else pstmt.close().then(() => { conn.end() });

}

router.post("/read", readValidtor, read);
router.post("/delete",express.json({type:"*/*"}), deleteValidtor, deleteFn);
router.post("/add", express.json({type:"*/*"}), addValidator, add);
router.post("/action", actionValidator, action);


module.exports = router;