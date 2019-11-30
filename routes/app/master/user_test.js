const perms = [
    {
        name: "Master", value: "1",
        childs: [
            {
                name: "Account", value: "1.1", childs: [
                    { name: "Create", value: "1.1.1" },
                    { name: "Modify", value: "1.1.2", hidden: true },
                    { name: "Read", value: "1.1.3" },
                    { name: "Info", value: '1.1.4' }
                ]
            },
            {
                name: "User", value: "1.2", childs: [
                    { name: "Create", value: "1.2.1" },
                    { name: "Modify", value: "1.2.2", hidden: true },
                    { name: "Read", value: "1.2.3" },
                    { name: "Info", value: '1.2.4' }

                ]
            },
            {
                name: "Item", value: "1.3", childs: [
                    { name: "Create", value: "1.3.1" },
                    { name: "Modify", value: "1.3.2", hidden: true },
                    { name: "Read", value: "1.3.3" },
                    { name: "Info", value: '1.3.4' }

                ]
            },
            {
                name: "Group", value: "1.4", childs: [
                    { name: "Create", value: "1.4.1" },
                    { name: "Modify", value: "1.4.2", hidden: true },
                    { name: "Read", value: "1.4.3" },
                    { name: "Info", value: '1.4.4' }


                ]
            },
            {
                name: "Unit", value: "1.5", childs: [
                    { name: "Create", value: "1.5.1" },
                    { name: "Modify", value: "1.5.2", hidden: true },
                    { name: "Read", value: "1.5.3" },
                    { name: "Info", value: '1.5.4' }

                ]
            },
            {
                name: "Workplace", value: "1.6", childs: [
                    { name: "Create", value: "1.6.1" },
                    { name: "Modify", value: "1.6.2", hidden: true },
                    { name: "Read", value: "1.6.3" },
                    { name: "Info", value: '1.6.4' }

                ]
            },
            {
                name: 'Operation', value: "1.8", childs: [
                    { name: "Create", value: "1.8.1" },
                    { name: "Modify", value: "1.8.2", hidden: true },
                    { name: "Read", value: "1.8.3" },
                    { name: "Info", value: '1.8.4' }

                ]
            },
            {
                name: "Route", value: "1.7", childs: [
                    { name: "Create", value: "1.7.1" },
                    { name: "Modify", value: "1.7.2", hidden: true },
                    { name: "Read", value: "1.7.3" },
                    { name: "Info", value: '1.7.4' }

                ]
            }

        ]

    },
    {
        name: "Production", value: "2",
        childs: [
            {
                name: "Bill of Materials", value: "2.1", childs: [
                    { name: "Create", value: "2.1.1" },
                    { name: "Modify", value: "2.1.2", hidden: true },
                    { name: "Read", value: "2.1.3" },
                    { name: "Info", value: '2.1.4' }

                ]
            },
            {
                name: "WorkOrder", value: "2.2", childs: [
                    { name: "Create", value: "2.2.1" },
                    { name: "Modify", value: "2.2.2", hidden: true },
                    { name: "Read", value: "2.2.3" },

                    { name: "Track", value: '2.2.4' }
                ]
            },
            {
                name: "Job", value: "2.3", childs: [
                    { name: "Create", value: "2.3.1" },
                    { name: "Modify", value: "2.3.2", hidden: true },
                    { name: "Read", value: "2.3.3" }
                ]
            }

        ]
    }
];

const mysql = require("mysql2/promise");
const env = require("../../../env");
const permission = [];
async function doT() {
    const sql = "INSERT INTO inv.perms(uid,menu)VALUES(?,?)";
    const conn = await mysql.createConnection(env.MYSQL_Props);
    const pstmt = await conn.prepare(sql);
    insertMenu(pstmt, perms);
    await pstmt.execute([1, permission.join(',')]);
}


async function insertMenu(pstmt, perms) {
    if (perms instanceof Array) {
        perms.forEach(v => insertMenu(pstmt, v));
    } else {
        permission.push(perms.value);
        if (perms.childs != undefined) insertMenu(pstmt, perms.childs);
    }
}


doT().then(r=>{
    console.log(permission, permission.length);
});