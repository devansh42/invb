//This file contains object to hold permission mapping

const Permission = {
    Master: {
        Account: {
            Create: "1.1.1",
            Modify: "1.1.2",
            Read: "1.1.3",
            Info: "1.1.4"
        },
        User: {
            Create: "1.2.1",
            Modify: "1.2.2",
            Read: "1.2.3",
            Info: "1.2.4"
        },
        Item: {
            Create: "1.3.1",
            Modify: "1.3.2",
            Read: "1.3.3",
            Info: "1.3.4"
        },
        Group: {
            Create: "1.4.1",
            Modify: "1.4.2",
            Read: "1.4.3",
            Info: "1.4.4"
        },
        Unit: {
            Create: "1.5.1",
            Modify: "1.5.2",
            Read: "1.5.3",
            Info: "1.5.4"
        },
        Workplace: {
            Create: "1.6.1",
            Modify: "1.6.2",
            Read: "1.6.3",
            Info: "1.6.4"
        },
        Route: {
            Create: "1.7.1",
            Modify: "1.7.2",
            Read: "1.7.3",
            Info: "1.7.4"
        },
        Operation: {
            Create: "1.8.1",
            Modify: "1.8.2",
            Read: "1.8.3",
            Info: "1.8.4"
        },


    },
    Production: {
        Bom: {
            Create: "2.1.1",
            Modify: "2.1.2",
            Read: "2.1.3",
            Info: "2.1.4"
        },
        Workorder: {
            Create: "2.2.1",
            Modify: "2.2.2",
            Read: "2.2.3",
            Track: "2.2.4"
        },
        Job: {
            Create: "2.3.1",
            Modify: "2.3.2",
            Read: "2.3.3",
        },
        KV: {
            Create: "2.4.1",
            Modify: "2.4.2",
            Read: "2.4.3",
            Delete: "2.4.4"
        }
    }
}

const m = "/app/master";
const p = "/app/production";
const URLMap = {
    '1.1.1': m + "/account/create",
    '1.1.2': m + "/account/modify",
    '1.1.3': m + "/account/read",
    '1.1.4': m + "/account/info",
    '1.2.1': m + "/user/create",
    '1.2.2': m + "/user/modify",
    '1.2.3': m + "/user/read",
    '1.2.4': m + "/user/info",
    '1.3.1': m + "/item/create",
    '1.3.2': m + "/item/modify",
    '1.3.3': m + "/item/read",
    '1.3.4': m + "/item/info",
    '1.4.1': m + "/group/create",
    '1.4.2': m + "/group/modify",
    '1.4.3': m + "/group/read",
    '1.4.4': m + "/group/info",
    '1.5.1': m + "/unit/create",
    '1.5.2': m + "/unit/modify",
    '1.5.3': m + "/unit/read",
    '1.5.4': m + "/unit/info",
    '1.6.1': m + "/workplace/create",
    '1.6.2': m + "/workplace/modify",
    '1.6.3': m + "/workplace/read",
    '1.6.4': m + "/workplace/info",
    '1.7.1': m + "/route/create",
    '1.7.2': m + "/route/modify",
    '1.7.3': m + "/route/read",
    '1.7.4': m + "/route/info",
    '1.8.1': m + "/operation/create",
    '1.8.2': m + "/operation/modify",
    '1.8.3': m + "/operation/read",
    '1.8.4': m + "/operation/info",
    '2.1.1': p + "/bom/create",
    '2.1.2': p + "/bom/modify",
    '2.1.3': p + "/bom/read",
    '2.1.4': p + "/bom/info",
    '2.2.1': p + "/workorder/create",
    '2.2.2': p + "/workorder/modify",
    '2.2.3': p + "/workorder/read/",
    '2.2.4': p + "/workorder/track/",
    '2.3.1': p + "/job/create",
    '2.3.2': p + "/job/modify",
    '2.3.3': p + "/job/read",
    '2.4.1': p + "/kv/create",
    '2.4.2': p + "/kv/modify",
    '2.4.3': p + "/kv/read",
    '2.4.4': p + "/kv/delete"
}






module.exports = { URLMap, Permission };