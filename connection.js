const pgp = 
require("pg-promise")();


const db = pgp ({
    user: "postgres",
    password: "0203",
    host: "localhost",
    port: 5432,
    database: "weather",
    ssl: false
})

module.exports = credentials;
