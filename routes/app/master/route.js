//This file contains code for logic of route

const j = require("@hapi/joi");
const mysql = require("mysql2/promise");
const env = require("../../../env");
const err = require("../../../err");
const express = require("express");
const router = express.Router();
const logg =require("../../../entity/logg");

function create(req, res) {
    createOrModify(req, res, true);
}


function modify(req, res) {
    createOrModify(req, res, false);
}


async function createOrModify(req, res, create) {
    const b = req.body;
    const conn = await mysql.createConnection(env.MYSQL_Props);

    let pstmt;
    await conn.beginTransaction();//starting of transaction

    try {
        pstmt = await conn.prepare("select id from route where name=? limit 1");
        [r, c] = await pstmt.execute([b.name]);
        if (r.length > 0) {
            res.json({ error: true, errorMsg: "A Route exists with this name", code: err.Duplicate }).end();
        } else {
            if (create) {
                pstmt = await conn.prepare("insert into  route(name,gid,description)values(?,?,?)");
                let [r] = await pstmt.execute([b.name, b.gid, b.description]);
                const rId = r.insertId;
                pstmt = await conn.prepare("insert into route_operations(route,operation)values(?,?)");

                b.operation.forEach(async (v, i) => {
                    await pstmt.execute([rId, Number(v)]); //We didn't use map function, because order of operations in route is also important
                })
            } else {
                //we change every thing about route accept except operations list, so far lol.
                pstmt = await conn.prepare("update route set name=? , gid=? , description=? where id=?  limit 1");
                await pstmt.execute([b.name, b.gid, b.description, b.id]);

            }

            res.json({ error: false });
        }
        await conn.commit();
    } catch (er) {
        await conn.rollback();
        logg.log(er.message);
        res.json({ error: true, code: err.InternalServer, errorMsg: err.InterServerErrMsg });
    }
    finally {
        if (pstmt != undefined) {
            pstmt.close().then(r => { conn.end(); });

        } else {
            conn.end();
        }
    }
}



function createModifyValidtor(req, res, next) {
    const { body } = req;
    const o = j.object({
        name: j.string().required().max(100),
        gid: j.number().positive().required(),
        description: j.string(),
        operation: j.array().items(j.number().positive()).required()
    });
    if (o.validate(body) == null) {
        res.json({ error: true, errorMsg: "Invalid Parameter Supplied", code: err.BadRequest });
        res.end();
    }
    else next();
}

function readValidtor(req, res, next) {
    const { body } = req;
    const o = j.object({
        name: j.string().max(100),
        gid: j.number().positive(),
        route_operations: j.array().items(j.number().positive())
    });
    if (o.validate(body) == null) {
        res.json({ error: false, errorrMsg: "Invalid Request Parameters", code: err.BadRequest }).end();
    } else next();

}


async function read(req, res) {
    const b = req.body;
    console.log(b);
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt, results = [];
    try {
        const sql = "select r.id,r.name,r.gid,r.description,g.name as group_name from route as r join groups as g on g.id=r.gid ";
        if ('name' in b) {
            pstmt = await conn.prepare(sql.concat(" where r.name=? limit 1"));
            [r, c] = await pstmt.execute([b.name]);
            results = r[0];
        }
        else if ('gid' in b) {
            pstmt = await conn.prepare(sql.concat(" where g.gid=?"));
            [results, c] = await pstmt.execute([b.gid]);

        }
        else if ('id' in b) {
            pstmt = await conn.prepare(sql.concat(" where r.id=? limit 1"));
            [r, c] = await pstmt.execute([b.id]);
            results = r[0];

        }
        else if ('route_operations' in b) {
            const ro = typeof b.route_operations instanceof Array ? b.route_operations : [b.route_operations];
            const y = ro.map(x => '?').join(',');

            const x = "select r.route,r.operation,o.name,o.description,o.workplace,o.gid,g.name as group_name,w.name as workplace_name from route_operations as r join operation as o on r.operation=o.id join groups as g on g.id=o.gid join workplace as w on w.id=o.workplace where r.route in (" + y + ")";

            pstmt = await conn.prepare(x);
            [results, c] = await pstmt.execute([...ro]);
        }
        else {

            pstmt = await conn.prepare(sql);
            [results, c] = await pstmt.execute();



        }
        res.json({ error: false, result: results });

    }
    catch (er) {
        logg.log(er.message);
        res.json(err.InternalServerObj);
    } finally {
        if (pstmt != undefined) {
            pstmt.close().then(() => { conn.end() });
        } else conn.end();
    }
}

const js = express.json({ type: "*/*" });
router.post("/create", js, createModifyValidtor, create);
router.post("/modify", js, createModifyValidtor, modify);
router.post("/read", readValidtor, read);

module.exports = router;