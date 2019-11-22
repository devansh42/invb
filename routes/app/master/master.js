//this file contains uses on master end point
const formData = require("multer")();

const express = require("express");
const route = express.Router();
const group = require("./group");
const unit = require("./unit");
const workplace = require("./workplace");
const item = require("./item");
const account = require("./account");
const operation = require("./operation");
const kv = require("./kv");
const user = require("./user");
const routing = require("./route");

route.use(formData.none());

route.use("/route", routing);
route.use("/account", account);
route.use("/item", item);
route.use("/group", group);
route.use("/unit", unit);
route.use("/workplace", workplace);
route.use("/operation", operation);
route.use("/kv", kv);
route.use("/user", user);

module.exports = route;



