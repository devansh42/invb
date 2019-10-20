const express=require("express");
const router=express.Router();
const bom=require('./bom');
const job=require('./job');
const workorder=require('./workorder');

router.route("/bom",bom);
router.route("/job",job);
router.route("/workorder",workorder);

module.exports=router;