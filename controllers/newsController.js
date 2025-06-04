const {oracledb} = require('../config/db');

async function getNewByUserId(req, res) {
    const {userId} = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const sql = `SELECT *
                     FROM RENT_ROOM_NEWS
                     WHERE customer_id = :userId`;
        const result = await connection.execute(sql, [userId], {
            outFormat: oracledb.OBJECT
        });
        if (result.rows.length === 0) {
            return res.status(404).json({message: "Không có bản ghi"});
        }
        res.json({status: 200, message: "success", object: result.rows});
    } catch (e) {
        console.log(e)
        res.status(404).json({message: "Lỗi máy chủ"});
    }
}

module.exports = {getNewByUserId}