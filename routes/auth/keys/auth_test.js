//This file contains test for cryptographic functionalities
const crypto = require("crypto");
const env = require("../../../env");
const sign  = crypto.createSign("sha256");
const fs= require("fs");
const pr =  fs.readFileSync(env.PRV_KEY);
sign.write("MakeThingsHappen");
const x = sign.sign(pr,"hex");
console.log(pr);
console.log(x);
