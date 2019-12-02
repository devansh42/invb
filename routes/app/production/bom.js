//This file contains code to handle bom logic

const j = require("@hapi/joi");
const mysql = require("mysql2/promise");
const env = require("../../../env");
const err = require("../../../err");
const express = require("express");
const router = express.Router();
const logg  = require("../../../entity/logg");
const fire = require("../../auth/fire");

async function read(req, res) {
    const b = req.body
    const conn = await mysql.createConnection(env.MYSQL_Props);
    let pstmt, results = [];
    try {
        const sql = "select b.id,b.name,b.item,b.qty,b.routing,b.description,i.name as item_name,r.name as route_name from bom as b join item as i on b.item=i.id join route as r on r.id=b.routing ";
        if ('item' in b) {
            pstmt = await conn.prepare(sql.concat(" where b.item = ?"));
            [results, c] = await pstmt.execute([b.item]);
        }
        else if ('route' in b) {
            pstmt = await conn.prepare(sql.concat(" where b.routing = ?"));
            [results, c] = await pstmt.execute([b.route]);
        }
        else if ('name' in b) {
            pstmt = await conn.prepare(sql.concat(" where b.name = ? limit 1"));
            [r, c] = await pstmt.execute([b.name]);
            results = r[0];
        }
        else if ('id' in b) {
            pstmt = await conn.prepare(sql.concat(" where b.id = ? limit 1"));
            [r, c] = await pstmt.execute([b.id]);
            results = r[0];
        }
        else if ('bom_material' in b) {
            const x = "select b.bom,b.item,b.qty,b.rate,i.name as item_name from bom_material as b join item as i on b.item=i.id where b.bom=?";
            pstmt = await conn.prepare(x);
            [results, c] = await pstmt.execute([b.bom_material]);
        }
        else if ('operation' in b) {
            //returns operations associated with routing in given bom
            const x = "select r.operation as id,o.name,o.gid,o.description,o.workplace,w.name as workplace_name,g.name as group_name from route_operations as r join operation as o on o.id=r.operation join groups as g on g.id=o.gid join workplace as w on w.id=o.workplace join bom as b on b.routing=r.route where b.id=?";
            pstmt = await conn.prepare(x);
            [results, c] = await pstmt.execute([b.operation]);
        }
        else {
            //fetch everything
            pstmt = await conn.prepare(sql);
            [results, c] = await pstmt.execute();
        }


        res.json({ error: false, result: results }).end();
    } catch (er) {
        logg.log(er.message);
        res.json(err.InternalServerObj);

    } finally {
        if (pstmt != undefined) {
            pstmt.close().then(r => {
                conn.close();
            });
        }
        else conn.close();
    }
}


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
    await conn.beginTransaction();

    try {
        pstmt = await conn.prepare("select id from bom where name=? limit 1");
        const [r] = await pstmt.execute([b.name]);
        if (r.length > 0) {
            res.json({ error: true, code: err.Duplicate, errorMsg: "Duplicate BOM Found" });
            res.end();
        } else {
            //No Duplicates
            if (create) {
                pstmt = await conn.prepare("insert into bom(name,item,qty,routing,description)values(?,?,?,?,?)");
                const [r, c] = await pstmt.execute([b.name, b.item, b.qty, b.route, b.description]);
                const bomId = r.insertId;
                pstmt = await conn.prepare("insert into bom_material(bom,item,qty,rate)values(?,?,?,?)");
                const pp = b.materialList.map(v     => {
                    return pstmt.execute([bomId, v.id, v.qty, v.rate]);//appending promises to resolve at same time
                });
                await Promise.all(pp); //resolve when all the promises are 

            } else {
               //We cannot change any thing in bom
                /* pstmt = await conn.prepare("update bom set name=? and set item=? and set qty=? and set routing=? and set description=? where id=? limit 1");
                await pstmt.execute([b.name, b.item, b.qty, b.route, b.description, b.id]);
                 */   
            }


            res.json({ error: false }).end();

        }
        await conn.commit();
    } catch (er) {
        await conn.rollback();
        logg.log(er.message);
        res.json({ error: true, code: err.InternalServer, errorMsg: err.InterServerErrMsg });
    } finally {

        if (pstmt != undefined) pstmt.close().then(() => { conn.end() });
        else conn.end();
    }
}


function readValidtor(req, res, next) {
    const o = j.object({
        id: j.number().positive(),
        item: j.number().positive(),
        routing: j.number().positive()
    });
    const { b } = req;
    if (o.validate(b) == null) {
        res.json({ error: true, errorMsg: "Invalid Request Parameter", code: err.Duplicate }).end();
    } else next();
}


function createModifyValidtor(req, res, next) {
    const b = req.body;
    const o = j.object({
        id: j.number().positive(),
        bom_material: j.number().positive(),
        name: j.string().max(100).min(2).required(),
        item: j.number().positive().required(),
        qty: j.number().positive().required(),
        description: j.string().max(500),
        route: j.number().positive().required(),
        materialList: j.array().items(j.object({
            item: j.number().positive(),
            qty: j.number().positive(),
            rate: j.number().positive()

        }))
    });
    if (o.validate(b) == null) {
        res.json({ error: true, code: err.BadRequest, errorMsg: "Invalid request parameter supplied" });
        res.end();
    } else next();

}

const js = express.json({ type: "*/*" });


router.post("/create", js,fire.fireWall([{ 'item': ['2.1.1'] }]), createModifyValidtor, create);
router.post("/modify", fire.fireWall([{ '*': ['2.1.2'] }]), createModifyValidtor, modify);
router.post("/read", fire.fireWall([{ '*': ['2.1.3'] },{ 'bom_material': ['2.1.3'] },{ 'operation': ['2.1.3'] },{ 'item': ['2.1.3'] }, { 'id': ['2.1.4'] }]), readValidtor, read);



module.exports = router;