const express=require("express");
const router=express.Router();
const bom=require('./bom');
const job=require('./job');
const workorder=require('./workorder');
const jobModifier= require("./job_modifier");

router.route("/bom",bom);
router.route("/job",job);
router.route("/workorder",workorder);
router.route("/jobModifier",jobModifier);
module.exports=router;