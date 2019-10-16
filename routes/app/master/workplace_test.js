const mysql=require("mysql2/promise");
const env=require("../../../env");

let x=async ()=>{
    const conn=await mysql.createConnection(env.MYSQL_Props);

    let pstmt=await conn.prepare("insert into group_type(text)values(?)");
    d=await pstmt.execute(["ddGoogle"])
    console.dir(d);
    pstmt.close().then(conn.close());
};
x();