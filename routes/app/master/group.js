const j = require("@hapi/joi");
const mysql = require("mysql2/promise");
const env = require("../../../env");
const err = require("../../../err");
const express = require("express");
const router = express.Router();



let createOrModify = async (req, res, create) => {
    let b = req.body;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt = await conn.prepare("select id from inv.groups where type=? and name=? limit 1");
    [rows, col] = await pstmt.execute([b.type, b.name]);
    if (rows.length > 0) {
        //duplicate
        res.status(200);
        res.json({ error: true, code: err.Duplicate, errorMsg: "Duplicate Group" });
        res.end()


    } else {
        //creating new
        if (create) {
            pstmt = await conn.prepare("insert into inv.groups (name,type)values(?,?)");
            [row, col] = await pstmt.execute([b.name, b.type]);
            res.status(200);
            res.json({ error: false });
            res.end();
        } else {
            //we can only change name
            pstmt = await conn.prepare("update inv.group set name=? where id=? ");
            [row, col] = await pstmt.execute([b.name, b.id]);
            if (rows.length < 1) {
                res.status(200);
                res.json({ error: true, errorMsg: "Couldn't update Group" });
                res.end()
            } else {
                res.status(200);
                res.json({ error: false });
                res.end();
            }
        }

    }
    if(pstmt==undefined)conn.end();
    else pstmt.close().then(()=>conn.end());


}


let read = async (req, res) => {
    let b = req.body;
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt;

    if ("id" in b) {
        pstmt = await conn.prepare("select inv.groups.name,inv.groups.type,inv.group_type.text from inv.groups left join on inv.groups.type=inv.group_type.id where inv.groups.id=? limit 1");
        [rows, cols] = await pstmt.execute([b.id])
        res.status(200)
        if (rows.length < 1) {
            res.json({ error: true, code: err.NoContent, errorMsg: "No Data" });
        } else {
            let r = rows[0];
            res.json({ error: false, result: { name: r.name, type: r.type, id: b.id, type_name: r.text } });

        }
    }
    else if ("type" in b) {
        pstmt = await conn.prepare("select id,name from inv.groups where type=? limit 1");
        [rows, cols] = await pstmt.execute([b.type]);
        res.status(200).json({ error: false, result: rows });

    } else {
        //return all
        [r, c] = await conn.execute("select groups.id,groups.name,groups.type,group_type.text from groups left join group_type on groups.type=group_type.id");
        let ar = r.map((v, i) => { return { name: v.name, id: v.id, type: v.type, type_name: v.text } });
        res.status(200);
        res.json({ error: false, result: ar });
    }
    res.end()
    if (pstmt != undefined) pstmt.close().then(()=>conn.end());
    else conn.end();

}

let create = (req, res) => {
    createOrModify(req, res, true);
};



let modify = (req, res) => {
    createOrModify(req, res, false);
};

let readValidtor = (req, res, next) => {
    let o = j.object({
        type: j.number().positive(),
        id: j.number().positive()
    });
    if (o.validate(res.body) == null) {
        res.json({ error: true, errorMsg: "Bad Request", code: err.BadRequest });
        res.end();
    } else {
        next();
    }
}

let createModifyValidtor = (req, res, next) => {
    let o = j.object({
        name: j.string().required().min(2).max(100),
        type: j.number().required().positive().min(1).max(4),
        id: j.number().positive()
    });
    if (o.validate(req.body) == null) {
        res.status(err.Ok).json({ error: true, errorMsg: "Invalid Input supplied" })
        res.end();
    }
    else next();
}



router.post("/create", createModifyValidtor, create);
router.post("/modify", createModifyValidtor, modify);
router.post("/read", readValidtor, read);


module.exports = router;