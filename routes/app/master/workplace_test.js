const mysql=require("mysql2/promise");
const env=require("../../../env");

let x=async ()=>{
    const conn=await mysql.createConnection(env.MYSQL_Props);
    let pstmt=await conn.prepare("select a.name,a.addr,a.op_time,a.cl_time,a.gid,b.name as group_name from workplace as a left join groups as b on b.id=a.gid where a.id=? limit 1");
    [r,c]=await pstmt.execute([3]);
    console.log(r.length);
    pstmt.close().then(conn.close());
};
x();