//This file contains code to manage workorder


const j = require("@hapi/joi");
const mysql = require("mysql2/promise");
const env = require("../../../env");
const err = require("../../../err");
const express = require("express");
const router = express.Router();

const SerialSeq = require('../../../entity/serialSeq');

async function createOrModify(req, res, create) {
    const b = req.body;
    const conn = await mysql.createConnection(env.MYSQL_Props);

    //no need to check for duplicates
    let pstmt;
    if (create) {
        pstmt = await conn.prepare("insert into workorder(item,qty,bom,post_date,st_date,de_date,nbom)VALUES(?,?,?,?,?,?,?)");
        const resultSet = await pstmt.execute([b.item, b.qty, b.bom, b.post_date, b.nbom])
        const wid = resultSet.insertId;
        //Check if this item has serial no.
        pstmt = await conn.prepare("select hser,serial_seq from item where id=?");
        let [r] = await pstmt.execute([b.item]);
        const info = r[0];
        const ser_seq = new SerialSeq();
        if (info.hser == 1) {
            //has serial no seqeunce
            pstmt = await conn.prepare("select *from serial_no_seq where id=?");
            [r] = await pstmt.execute([info.serial_seq]);
            ser_seq.populateFromObject(r[0]);
        }
        pstmt = await conn.prepare("select o.operation from route_operations as o join bom as b on b.routing=o.route where b.id=?");
        [r] = await pstmt.execute([b.bom]);
        //Begining Tx
        await conn.beginTransaction(); //Begining Tx
        let sql;
        let sql1 = "INSERT INTO inv.serial_nos(sn,ser_seq,workorder)VALUES(?,?,?)";
        let ar;
        if (info.hser == 1) {
            //now item has serial no

            pstmt = await conn.prepare(sql1);
            const br = [];
            for (let i = 0; i < b.qty; i++) {
                br.push(pstmt.execute([ser_seq.getNextSerialNo()[1], ser_seq.id, wid]));
            }

            let serialNos = await Promise.all(br);
            sql = "INSERT INTO inv.job_card(entityId,workorder,operation,qty,post_time)VALUES(?,?,?,?,?)";
            pstmt = await conn.prepare(sql);
            r.forEach(v => {
                //each operation
                serialNos.forEach(w => {
                    /** 
                    * 
                    *Here we create one job card of one serial numbered item per operation
                    *e.g. if item production have 3 operation step and qty of item is 4 total 4*3 = 12 job cards are created 
                    */
                    ar.push(pstmt.execute([w, wid, v.operation, b.qty, b.post_date]));
                });
            });

        } else {
            sql = "INSERT INTO inv.production_log(item,workorder,qty)VALUES(?,?,?)";
            pstmt = await conn.prepare(sql);
            const rs = await pstmt.execute([b.item, wid, b.qty]);
            const plId = rs.insertId;
            //This case executes when item is not serialized
            sql = "INSERT INTO inv.job_card(workorder,operation,qty,post_time,plId)VALUES(?,?,?,?,?)";
            pstmt = await conn.prepare(sql);
            ar = r.map(v => { //Creating one job card for each operation provided by  routing in bom
                return pstmt.execute([wid, v.operation, b.qty, b.post_date, plId]);
            });
        }

        await Promise.all(ar);
        await conn.commit();
    }
    else {
        pstmt = await conn.prepare("update workorder set qty=? and set bom = ? and set post_date=? and set st_date = ? and set de_date = ? and set nbom=? where id=? limit 1");
        await pstmt.execute([b.qty, b.bom, b.post_date, b.nbom, b.id])

    }
    res.json({ error: false });
    if (pstmt != undefined) {
        pstmt.close().then(() => {
            conn.close();
        })
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
        item: j.number().positive(),
        qty: j.number().positive(),
        bom: j.number().positive(),
        post_date: j.date(),
        st_date: j.date(),
        de_date: j.date(),
        nbom: j.number()
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
        item: j.number().positive(),
        bom: j.number().positive(),
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
    let sql = "select w.id,w.com_qty,w.item,w.qty,w.bom,w.post_date,w.state,w.st_date,w.de_date,w.nbom,b.name as bom_name,i.name as item_name from workorder as w join bom as b on b.id=w.bom join item as i on i.id=w.item ";
    if ('item' in b) {
        pstmt = await conn.prepare(sql.concat(" where w.item=?"));
        [results, c] = await pstmt.execute([b.item])
    }
    else if ('bom' in b) {
        pstmt = await conn.prepare(sql.concat(" where w.bom=?"));
        [results, c] = await pstmt.execute([b.bom])

    }
    else if ('id' in b) {
        //retriving a specific record from the table
        pstmt = await conn.prepare(sql.concat(" where w.id=? limit 1"));
        [results, c] = await pstmt.execute([b.id])
    }
    else {
        pstmt = await conn.prepare(sql);
        [results, c] = await pstmt.execute()
    }

    res.json({ error: false, results });
    if (pstmt != undefined) {
        pstmt.close().then(x => {
            conn.close();
        });
    }
}


router.post("/create", createModifyValidtor, create);
router.post("/modify", createModifyValidtor, modify);
router.post("/read", readValidtor, read);



module.exports = router;