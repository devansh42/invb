//This file contains code to read environmental variables
module.exports={
        MYSQL_HOST:process.env.MYSQL_HOST,
        MYSQL_PASSWORD:process.env.MYSQL_PASSWORD,
        MYSQL_USER:process.env.MYSQL_USER,
        MYSQL_DB:process.env.MYSQL_DB,
        JWT_ISSUER:process.env.JWT_ISSUER,
        JWT_SUB:process.env.JWT_SUB,
        JWT_AUD:process.env.JWT_AUD,
        PRV_KEY:process.env.INV_PRV_KEY,
        PUB_KEY:process.env.INV_PUB_KEY,
        MYSQL_Props:{
                host:process.env.MYSQL_HOST,
                password:process.env.MYSQL_PASSWORD,
                user:process.env.MYSQL_USER,
                database:process.env.MYSQL_DB
        }

}

