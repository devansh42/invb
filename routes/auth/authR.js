//This file contains logic to control auth
//uses jwt

const j = require("@hapi/joi");
const mysql = require("mysql2/promise");
const env = require("../../env");
const jwt = require("jsonwebtoken");



const checkAuth = (_, res) => {
    res.status(200).send("Ok").end();
}

const authR = (req, res) => {
    let sc = j.object({
        username: j.string().required().min(5).max(20),
        password: j.string().required().min(8)
    });

    if (sc.validate(req.body) != null) {

        verifyUser(req.body.username, req.body.password)
            .then(result => {
                //user is valid
                makeAuthToken(result.uid)
                    .then(({ perm_sign, token, perms }) => {
                        res.status(200);
                        res.send({ error: false, perms, token: token, result });
                        res.end();
                    })
            })
            .catch(err => {
                res.status(403);
                res.json({ error: true, errMsg: err.message });
                res.end();
            });

    } else {
        res.status(401);
        res.json({ error: true, errMsg: "Invalid Login/Password" });
        res.end();
    }

}


let makeAuthToken = async (uid, perms) => {


    let opts = {
        algorithm: 'HS256',
        issuer: env.JWT_ISSUER,
        expiresIn: "12h",
        audience: env.JWT_AUD,

    };

    token = jwt.sign({ "uid": uid }, "ThisIsACarAndIamDrivingIt", opts);

    /* const hash = crypto.createHash("SHA256");
     const s = perms.join('');
     hash.update(s);
     const hs = hash.digest('hex');
     const sign = crypto.createSign("sha256");
     sign.write(hs);
     const pr = fs.readFileSync(env.PRV_KEY);
     const s = sign.sign(pr, 'hex');
     */
    return { perm_sign: "", perms, token: token };
}

const verifyUser = async (username, password) => {

    const conn = await mysql.createConnection(env.MYSQL_Props);
    let row = []
    let pstmt;
    try {
        pstmt = await conn.prepare("select u.uid,u.username,a.name,a.gender,a.gid,g.name as group_name from users as u join account as a on a.id=u.aid join groups as g on g.id=a.gid where u.username=? and u.password=? limit 1");
        const [rows] = await pstmt.execute([username, password]);

        if (rows.length == 0) {
            //invalid password or username
            throw Error("Invalid username or password");
        } else {
            row = rows[0];
            pstmt = await conn.prepare("select menu from perms where uid=?");
            [rs] = await pstmt.execute([row.uid]);
            row["perms"] = rs.map(v => v.menu);
        }

        return row;


    }
    catch (er) { //Forwarding catched error
        throw er;
    } finally {
        if (pstmt == undefined) conn.end();
        else pstmt.close().then(x => { conn.end() });

    }

}

module.exports = { authR, checkAuth };