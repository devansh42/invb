const err = require("../../err");


/**
 * firewall, returns a middleware to use as firewall, it provides user access control
 * it takes a hashmap of string=>Array, string is the request parameter and array is the list of permission required
 * There is a special request param '*' to allow wildcard access
 * This method assumes there is already a 'X-PERMS' header exists in Request Header
 * @param {object} permMap is the mapping of request
 * 
 */
const fireWall = (permMap) => {

    return (req, res, next) => {
        const perms = JSON.parse(req.get("X-PERMS")); //Retriving user permissions from header
        //console.log(perms);
        const keys = [];
        for (const k in req.body) {
            keys.push(k); //Making array of request body param name
        }
        console.log(keys);
        if (keys.length == 0) {
            keys.push('*'); //Checking against wildcard permission
        }
        console.log(permMap);
        const ans = keys.filter(v => {
            //v can be * character
            const [requiredPerm] = permMap.filter(vv => {
                for (const x in vv) { // vv is {key:[perm]}
                    if (x == v) { return true };
                }
                return false;
            });

            console.log('perm', permMap);
            console.log("rq", requiredPerm);
            if (requiredPerm instanceof Array) {
                const hl = requiredPerm.filter(v => perms.indexOf(v) != -1);
                return (hl.length == requiredPerm.length) //Returns true when all the required permission are fullfilled
                //Required param is an array
            } else {
                //Required perms is either string  
                const key = [];
                for (const x in requiredPerm) {
                    key.push(x);
                }
                const [keyName] = key;
                console.log(requiredPerm[keyName]);
                return perms.indexOf(requiredPerm[keyName][0]) != -1
            }
        });
        console.log(ans);
        if (ans.length > 0) {
            next();
        } else {
            //Now we will check for wilcard permission


            res.status(err.ForBidden).json({ error: true, errorMsg: "Access Denied: You are not permiitted to this service", code: err.ForBidden });
        }
    }


}

/**
 * Perm is array of menu permissions
 */
const Perms = [
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


//Default Export
module.exports = { fireWall, Perms };