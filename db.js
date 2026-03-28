/*const { Pool } = require("pg");
const pool = new Pool({
/*
    user:"postgres",
    host:"localhost",
    database:"postgres",
    password:"Sukhveen",
    port:5432
     


  connectionString: process.env.DATABASE_URL

});
pool.connect().then(()=>{console.log("connected to database")}).catch((err)=>{console.error("connection error",err)});
module.exports = pool;

*/


const { Pool } = require("pg");

const pool = new Pool({
  user: "neondb_owner",
  host: "ep-shy-fog-ama8cz0b.c-5.us-east-1.aws.neon.tech",
  database: "neondb",
  password: "npg_pR9V3inZmGQw",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});



module.exports = pool;
