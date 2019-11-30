//This file contains key generation fuction to generate pki keys
const crypto = require("crypto");


const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: "spki",
        format: "pem"
    },
    privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
        cipher: "aes-256-cbc",
        passphrase: "Googleismakingfunofus"
    }
});

console.log(privateKey, publicKey);
