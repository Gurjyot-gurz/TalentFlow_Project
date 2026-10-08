require("dotenv").config();

const pool = require("./db");

async function testDatabase() {
    try {
        const [rows] = await pool.query("SELECT 1 AS result");

        console.log("Database connection successful!");
        console.log(rows);

        process.exit(0);
    } catch (error) {
        console.error("Database connection failed!");
        console.error(error.message);

        process.exit(1);
    }
}

testDatabase();