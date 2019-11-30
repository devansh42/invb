const j = require("@hapi/joi");
const mysql = require("mysql2/promise");
const env = require("../../../env");
const err = require("../../../err");
const express = require("express");
const router = express.Router();
const logg=  require("../../../entity/logg");
const fire = require("../../auth/fire");

let read = async (req, res) => {
    let b = req.body;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt;
    let valid = true, result = [];
    try {
        const sql="select a.id,a.name,a.unit,a.gid,b.name as unit_name,c.name as group_name,a.hser,a.serial_seq,s.prefix,s.suffix,s.initialValue,s.step,s.digits from item as a left join serial_no_seq as s on s.id=a.serial_seq  join units as b on a.unit=b.id inner join groups as c on a.gid=c.id ";
        if ('id' in b) {
            pstmt = await conn.prepare(sql.concat(" where a.id=? limit 1"));
            [r, c] = await pstmt.execute([b.id])
            if (r.length > 0) {
                result = r[0];
            } else valid = false;
        }
        else if ('name' in b) {
         
            pstmt = await conn.prepare(sql.concat(" where a.name=? limit 1"));
            [r, c] = await pstmt.execute([b.name]);
            if (r.length > 0) {
                result = r[0];
            } else valid = false;
        }
        else if ('gid' in b) {
            pstmt = await conn.prepare(sql.concat(' where a.gid=?'));
            [r, c] = await pstmt.execute([b.gid])
            if (r.length > 0) {
                result = r;
            } else valid = false;
        }
        else {
            pstmt = await conn.prepare(sql);
            [r, c] = await pstmt.execute()
            if (r.length > 0) {
                result = r;
            }
        }
        if (valid) {
            res.json({ error: false, result });
            res.end();
        } else res.json({ error: true, errorMsg: "Invalid Input supplied", code: err.NoContent });
    }
    catch (er) {
        res.json(err.InternalServerObj);
        logg.logg(er.message);
    }
    finally {
        if (pstmt != undefined) pstmt.close().then(() => conn.end());
        else conn.end();
    }
}


let createOrModify = async (req, res, create) => {

    const conn = await mysql.createConnection(env.MYSQL_Props);
    let b = req.body;
    // conn.beginTran
    await conn.beginTransaction(); //Initiating new db tx
    try {

        let pstmt = await conn.prepare("select id from item where name=? limit 1");
        [r, c] = await pstmt.execute([b.name])
        if (r.length > 0) {
            //duplicate
            res.json({ error: true, errorMsg: "Duplicate Item", code: err.Duplicate })

        } else {


            if (create) {
                let pstmt = await conn.prepare("insert into item(name,unit,gid,hser)values(?,?,?,?)");
                let [r] = await pstmt.execute([b.name, b.unit, b.gid, b.hser ? 1 : 0]);
                const itemid = r.insertId;
                if (b.hser) { //checking if item serial no series
                    pstmt = await conn.prepare("insert into serial_no_seq(prefix,suffix,initialValue,step,digits)values(?,?,?,?,?)");
                    [r] = await pstmt.execute([b.ser_prefix, b.ser_suffix, b.ser_ini, b.ser_step, b.ser_digit])
                    const id = r.insertId;
                    pstmt = await conn.prepare("update item set serial_seq=? where id=? limit 1");
                    await pstmt.execute([id, itemid]);
                }
            } else {
                //Can only change item's name and gid
                pstmt = await conn.prepare("update item set name=? and gid=? where id=? limit")
                await pstmt.execute([b.name, b.gid, b.id])

            }
            await conn.commit();  //Commiting tx

            res.json({ error: false });




        }
    } catch (er) {
        await conn.rollback(); //Roll backing database transaction
        res.json({ error: true, code: err.InternalServer, errorMsg: err.InterServerErrMsg })
        logg.logg(er.message);
    }
    finally {

        if (pstmt != undefined) pstmt.close().then(() => conn.end());
        else conn.end();
    }
}


let createModifyValidtor = (req, res, next) => {
    let b = req.body;
    let o = j.object({
        name: j.string().required().min(2).max(100),
        unit: j.number().positive(),
        gid: j.number().positive()
    });
    if (o.validate(b) == null) {
        res.json({ error: true, errorMsg: "Invalid Input Supplied", code: err.BadRequest });
        res.end();
    } else next();
}

let readValidtor = (req, res, next) => {
    let o = j.object({
        id: j.number().positive(),
        name: j.string().min(2).max(100),
        gid: j.number().positive()
    });
    let b = req.body;
    if (o.validate(b) == null) {
        res.json({ error: true, errorMsg: "Invalid Input Supplied", code: err.BadRequest });
    } else {
        next();
    }

}

const create = (req, res) => {
    createOrModify(req, res, true);
}
const modify = (req, res) => {
    createOrModify(req, res, false);
}



router.post("/create", fire.fireWall([{ '*': ['1.3.1'] }]), createModifyValidtor, create);
router.post("/modify", fire.fireWall([{ '*': ['1.3.2'] }]), createModifyValidtor, modify);
router.post("/read", fire.fireWall([{ '*': ['1.3.3'] }, { 'id': ['1.3.4'] }]), readValidtor, read);



module.exports = router;