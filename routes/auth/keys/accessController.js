//This file contais code for access control logic in app
//This is a Action based mechanism
/**
 * For every endpoint, user sends and context header, e.g. X-CONTEXT : bom:create or its context code for bom creation
 * We then inspect reachable endpoints for the request and grant access if given endpoint is one of reachable endpoints
 * e.g for Context bom:create , we need /route/read and /item/read to access items and route operations
 * So incase a user doesn't have direct permission to access /route/read endpoint, he can still make request to these 
 * endpoint in bom:create scenario.
 */

const err = require("../../../err");
const p = require("./perm");

const dependencyMap = {
    "1.1.1": [ //Account:create
        p.Master.Group.Read,

    ],
    "1.1.2": [ //Account:modify
        p.Master.Group.Read

    ],
    "1.1.3": [
        //Account:read
        p.Master.Group.Read
    ],
    "1.1.4": [
        //Account:info

        p.Master.Group.Read
    ],
    "1.2.1": [ //User:create
        p.Master.Account.Read,

    ],
    "1.2.2": [ //User:modify
        p.Master.Account.Read

    ],
    "1.2.3": [
        //User:read
        p.Master.User.Read,

    ],
    "1.2.4": [
        //User:info
        p.Master.User.Read
    ],
    "1.3.1": [ //Item:create
        p.Master.Unit.Read,
        p.Master.Group.Read
    ],
    "1.3.2": [ //Item:modify

        p.Master.Unit.Read,
        p.Master.Group.Read

    ],
    "1.3.3": [
        //Item:read
        p.Master.Item.Read
    ],
    "1.3.4": [
        //Item:info
        p.Master.Item.Read
    ],
    "1.4.1": [ //Group:create

    ],
    "1.4.2": [ //Group:modify

    ],
    "1.4.3": [
        //Group:read
        p.Master.Group.Read,

    ],
    "1.4.4": [
        //Group:info
        p.Master.Group.Read
    ],
    "1.5.1": [ //Unit:create

    ],
    "1.5.2": [ //Unit:modify
        p.Master.Unit.Read

    ],
    "1.5.3": [
        //Unit:read
        p.Master.Unit.Read,

    ],
    "1.5.4": [
        //Unit:info
        p.Master.Unit.Read
    ],
    "1.6.1": [ //Workplace:create
        p.Master.Group.Read,

    ],
    "1.6.2": [ //Workplace:modify
        p.Master.Group.Read

    ],
    "1.6.3": [
        //Workplace:read
        p.Master.Workplace.Read,

    ],
    "1.6.4": [
        //Workplace:info
        p.Master.Workplace.Read
    ],
    "1.7.1": [ //Route:create
        p.Master.Group.Read,
        p.Master.Operation.Read
    ],
    "1.7.2": [ //Route:modify
        p.Master.Group.Read
    ],
    "1.7.3": [
        //Route:read
        p.Master.Route.Read,

    ],
    "1.7.4": [
        //Route:info
        p.Master.Route.Read
    ],
    "1.8.1": [ //Operation:create
        p.Master.Group.Read,
        p.Master.Workplace.Read
    ],
    "1.8.2": [ //Operation:modify

        p.Master.Group.Read,
        p.Master.Workplace.Read

    ],
    "1.8.3": [
        //User:read

        p.Master.Operation.Read

    ],
    "1.8.4": [
        //User:info
        p.Master.Operation.Read
    ],
    "2.1.1": [ //bom:create
        p.Master.Route.Read,
        p.Master.Item.Read


    ],
    "2.1.2": [
        //bom:modify
        p.Master.Route.Read,
        p.Master.Item.Read

    ],
    "2.1.3": [
        //bom:read
        p.Production.Bom.Read
    ],
    "2.1.4": [
        //bom:info
        p.Master.Route.Read,
        p.Master.Item.Read

    ],
    "2.2.1": [ //workorder:create
        p.Master.Route.Read,
        p.Master.Item.Read,
        p.Production.Bom.Read

    ],
    "2.2.2": [
        //workorder:modify
        p.Master.Route.Read,
        p.Master.Item.Read,
        p.Production.Bom.Read

    ],
    "2.2.3": [
        //workorder:read
        p.Production.Workorder.Read
    ],
    "2.2.4": [
        //workorder:track
        p.Master.Route.Read,
        p.Master.Item.Read

    ],
    "2.3.1": [ //workorder:create
        p.Master.Route.Read,
        p.Master.Item.Read,
        p.Production.Bom.Read

    ],
    "2.3.2": [
        //workorder:modify
        p.Master.Route.Read,
        p.Master.Item.Read,
        p.Production.Bom.Read

    ],
    "2.3.3": [
        //workorder:read
        p.Production.Workorder.Read
    ],
    


};


function AccessController(req, res, next) {
    const context = req.get("X-CONTEXT");
    if (context.trim().length < 1) {
        res.status(err.ForBidden).json({ error: true, code: err.ForBidden, errorMsg: 'Access Denined : No Context Provided' });
    }
    else {
        


    }
}