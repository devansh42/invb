//this file contains routes on master end point

const express=require("express");
const router=express.Router();
const group=require("./group");
const unit=require("./unit");
const workplace=require("./workplace");
const item=require("./item");
const account=require("./account");
const operation=require("./operation");

router.route("/account",account);
router.route("/item",item);
router.route("/group",group);
router.route("/unit",unit);
router.route("/workplace",workplace);
router.route("/operation",operation);


module.exports=router;



