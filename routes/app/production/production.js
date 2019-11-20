const express = require("express");
const router = express.Router();
const formData = require("multer")();
const bom = require('./bom');
const job = require('./job');
const workorder = require('./workorder');
const jobModifier = require("./job_modifier");

router.use(formData.none());
router.use("/bom", bom);
router.use("/job", job);
router.use("/workorder", workorder);
router.use("/jobModifier", jobModifier);
module.exports = router;