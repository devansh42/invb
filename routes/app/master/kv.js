//This file contains code for kv endpoint 
const j = require("@hapi/joi");
const mysql = require("mysql2/promise");
const env = require("../../../env");
const err = require("../../../err");
const express = require("express");
const router = express.Router();
const logg=require("../../../entity/logg");
const deleteValidator = (req, res) => {
    const b = req.body;
    const o = j.object({ id: j.number().required() });
    if (o.validate(b) == null) {
        res.json({ error: true, errorMsg: "Invalid  request parameters", code: err.BadRequest });
    }
    else next();
}

const deleteFn = async (req, res) => {
    const { body } = req;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    const sql = "delete from kv_pair where id= ?";
    try {
        let pstmt;
        pstmt = await conn.prepare(sql);
        const r = await pstmt.execute([body.id]);
        if (r.rowsAffected == 1) {
            res.json({ error: false });
        } else {
            //couldn't delete anything
            res.json({ error: true, errorMsg: "Invalid KV pair", code: err.BadRequest });
        }
    } catch (er) {
        logg.logg(er.message)
        res.json(err.InternalServerObj);
    } finally {
        if (pstmt == undefined) conn.close(); //connectio closed
        else pstmt.close().then(() => conn.close());
    }
}



const readValidtor = (req, res, next) => {
    const b = req.body;
    const o = j.object({
        id: j.number().required()
    });

    if (o.validate(b) == null) {
        res.json({ error: true, errorMsg: "Invalid input supplied", code: err.BadRequest });
    }
    else next();
};

const read = async (req, res) => {
    const { body } = req;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt;
    const sql = "select *from kv_pair where entity=?";
    try {
        pstmt = await conn.prepare(sql);
        const [r] = await pstmt.execute([body.id]);
        res.json({ error: false, result: r });
        //Closing connections 
    } catch (er) {
        logg.logg(er.message);
        res.json(err.InternalServerObj);
    }
    finally {
        if (pstmt != undefined) pstmt.close().then(() => conn.close());
        else conn.close();
    }
}

const createModifyValidtor = (req, res) => {
    const b = req.body;
    const o = j.object({
        kv_pairs: j.array({
            id: j.number().required(),
            kv_key: j.string().required().max(250),
            kv_value: j.string().required().max(250)
        }).required()
    });
    if (o.validate(b) == null) {
        res.json({ error: true, errorMsg: "Invalid Input Supplied", code: err.BadRequest });
    } else next();
}

const createOrModify = async (req, res, state) => {
    const conn = await mysql.createConnection(env.MYSQL_Props);
    const { body } = req;
    let pstmt = await conn.prepare(sql);
    await conn.beginTransaction(); //Begining db tx 

    try {

        let sql = "select kv_key from kv_pair where entity=?";
        let [r] = await pstmt.execute([body.id]);
        const keys = body.kv_pairs.map(v => kv_key.toLowerCase());


        if (state) { //create new
            for (let i = 0; i < r.length; i++) {
                if (keys.indexOf(r[i].kv_key.toLowerCase()) != -1) {
                    //Duplicate kv pair
                    res.json({ error: true, errorMsg: "Duplicate KV Pair", code: err.Duplicate });
                    pstmt.close().then(() => conn.end());//Closing db connections
                    return;
                }
            }

            sql = "INSERT INTO inv.kv_pair(kv_key,kv_value,entity)VALUES(?,?,?)";
            pstmt = await conn.prepare(sql);
            const ar = body.kv_pairs.map(v => pstmt.execute([v.kv_key, v.kv_value, v.id]));
            await Promise.all(ar);
        } else {
            sql = "update kv_pair set kv_value = ? where kv_key = ? and entity = ?";
            pstmt = await conn.prepare(sql);
            const ar = body.kv_pairs.map(v => pstmt.execute([v.kv_value, v.kv_key, v.id]));
            await Promise.all(ar);
        }

        await conn.commit();
        res.json({ error: false });

    } catch (er) {
        await conn.rollback();
        logg.log(er.message)
        res.json({ error: true, code: err.InternalServer, errorMsg: err.InterServerErrMsg });
    } finally {
        if (pstmt == undefined) conn.end();
        else pstmt.close().then(() => { conn.end() });

    }

}


let create = (req, res) => {
    createOrModify(req, res, true);
};
let modify = (req, res) => {
    createOrModify(req, res, false);
}



router.post("/create", createModifyValidtor, create);
router.post("/modify", createModifyValidtor, modify);
router.post("/read", readValidtor, read);
router.post("/delete", deleteValidator, deleteFn);


module.exports = router;