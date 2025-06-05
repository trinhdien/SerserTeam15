const {oracledb} = require('../config/db');

async function getNewByUserId(req, res) {
    const {userId} = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const sql = `SELECT room_news_id, customer_id,price,title,address
                     FROM RENT_ROOM_NEWS
                     WHERE customer_id != :userId AND isDraft != 1 AND status = 'Đang hiển thị'`;
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
async function getDetailNews(req, res) {
    const {newsId} = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const sql = `SELECT r.*, c.phone
                     FROM RENT_ROOM_NEWS r
                              JOIN CUSTOMER c ON r.customer_id = c.customer_id
                     WHERE room_news_id = :newsId`;
        const result = await connection.execute(sql, [newsId], {
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
module.exports = {getNewByUserId, getDetailNews}