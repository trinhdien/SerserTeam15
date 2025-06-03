const oracledb = require('oracledb');
require('dotenv').config();

async function initialize() {
    try {
        await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING,
            poolMin: 1,
            poolMax: 10,
            poolIncrement: 1
        });
        console.log('Oracle pool created');
    } catch (err) {
        console.error('Error creating Oracle pool', err);
        process.exit(1);
    }
}

async function close() {
    try {
        await oracledb.getPool().close(10);
        console.log('Oracle pool closed');
    } catch (err) {
        console.error('Error closing Oracle pool', err);
    }
}

module.exports = {
    initialize,
    close,
    oracledb
};
