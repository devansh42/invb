const j = require("@hapi/joi");
const mysql = require("mysql2/promise");
const env = require("../../../env");
const err = require("../../../err");
const express = require("express");
const router = express.Router();
const logg =require("../../../entity/logg");
const fire = require("../../auth/fire");

let createOrModify = async (req, res, create) => {
    let b = req.body;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    //checking for duplicate

    let pstmt;
    try {
        pstmt = await conn.prepare("select id from units where name=? and symbol=? limit 1");
        [r, c] = await pstmt.execute([b.name, b.symbol]);
        if (r.length > 0) {
            res.json({ error: true, errorMsg: "Duplicate Unit", code: err.Duplicate });
            res.end()
        } else {
            //now we can update/create
            if (create) {
                pstmt = await conn.prepare("insert into units(name,symbol)values(?,?)");
                await pstmt.execute([b.name, b.symbol])

            } else {
                //can only update name and symbol
                pstmt = await conn.prepare("update units set name=? , symbol=? where id=? limit 1");
                await pstmt.execute([b.name, b.symbol, b.id]);

            }
            res.json({ error: false });
            res.end()
        }
    } catch (er) {
        logg.logg(er.message);
        res.json({ error: true, errorMsg: err.InterServerErrMsg, code: err.InternalServer });
    } finally {
        if (pstmt == undefined) conn.end();
        else pstmt.close().then(() => conn.end());
    }

}

let read = async (req, res) => {
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt, b = req.body;
    try{
        if ("id" in b) {
            pstmt = await conn.prepare("select name,symbol from units where id=? limit 1");
            [r, c] = await pstmt.execute([b.id]);
            if (r.length > 0) {
                res.json({ error: false, result: r[0] });
            } else {
                res.json({ error: true, errorMsg: "Invalid Unit Id", code: err.NoContent });
            }
        }
        else if ('name' in b) {
            pstmt = await conn.prepare("select id,name,symbol from units where name=? limit 1");
            [r, c] = await pstmt.execute([b.name]);
            if (r.length > 0) {
                res.json({ error: false, result: r[0] });
            } else {
                res.json({ error: true, errorMsg: "Invalid Unit Name", code: err.NoContent });

            }
        } else if ('symbol' in b) {
            pstmt = await conn.prepare("select id,name,symbol from units where symbol=? limit 1");
            [r, c] = await pstmt.execute([b.symbol]);
            if (r.length > 0) {
                res.json({ error: false, result: r[0] });
            } else {
                res.json({ error: true, errorMsg: "Invalid Unit Symbol", code: err.NoContent });

            }

        } else {
            //return all the units
            pstmt = await conn.prepare("select id,name,symbol from units");
            [r, c] = await pstmt.execute()
            res.json({ error: false, result: r });
        }

    }
catch (er) {
    logg.log(er.message);
        res.json(err.InternalServerObj);
    }
    finally {
        if (pstmt != undefined) pstmt.close().then(() => conn.end());
        else conn.end();
        res.end();//ending response
    }
}



let createModifyValidtor = (req, res, next) => {
    let b = req.body;
    let o = j.object({
        name: j.string().required().min(2).max(30),
        symbol: j.string().required().min(2).max(5),
        id: j.number().positive()
    });
    if (o.validate(b) == null) {
        res.status(err.Ok);
        req.json({ error: true, errorMsg: "Invalid Input Supplied" })
        res.end();
    } else {
        next();
    }
}


let readValidtor = (req, res, next) => {
    let b = req.body;
    let o = j.object({
        name: j.string().min(2).max(30),
        symbol: j.string().min(2).max(5),
        id: j.number().positive()

    });
    if (o.validate(b) == null) {
        res.json({ error: true, errorMsg: "Bad Request", code: err.BadRequest });
        res.end();
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





router.post("/create", fire.fireWall([{ '*': ['1.5.1'] }]), createModifyValidtor, create);
router.post("/modify", fire.fireWall([{ '*': ['1.5.2'] }]), createModifyValidtor, modify);
router.post("/read", fire.fireWall([{ '*': ['1.5.3'] }, { 'id': ['1.5.4'] }]), readValidtor, read);


module.exports = router;