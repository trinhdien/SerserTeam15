const express = require('express');
const router = express.Router();
const db = require('../config/db');

/* GET home page. */
router.get('/', async function (req, res, next) {
    getAllCustomers();
    res.render('index', {title: 'Express 3'});
});

async function getAllCustomers() {
    let connection;

    try {
        // Lấy connection từ pool
        connection = await db.oracledb.getConnection();

        // Thực thi câu truy vấn SELECT
        const result = await connection.execute(
            `SELECT *
             FROM CUSTOMER`,
            [], // không có tham số bind
            {outFormat: db.oracledb.OUT_FORMAT_OBJECT} // trả về dạng object dễ dùng
        );

        console.log('Danh sách khách hàng:', result.rows);

        return result.rows; // trả về mảng kết quả nếu cần
    } catch (err) {
        console.error('Lỗi truy vấn CUSTOMER:', err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close(); // giải phóng connection về pool
            } catch (err) {
                console.error('Lỗi đóng connection:', err);
            }
        }
    }
}

module.exports = router;
