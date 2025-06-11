const {oracledb} = require('../config/db');
const {log} = require("debug");

async function getAllNews(req, res) {
    let connection;

    try {
        connection = await oracledb.getConnection();

        // 1. Lấy danh sách tin
        const sqlNews = `
            SELECT ROOM_NEWS_ID, CUSTOMER_ID, PRICE, TITLE, ADDRESS, DESCRIPTION
            FROM RENT_ROOM_NEWS
            WHERE isDraft != 1 AND status = 'Dang hien thi'
        `;
        const newsResult = await connection.execute(sqlNews, [], {
            outFormat: oracledb.OBJECT
        });

        const newsList = newsResult.rows;

        if (newsList.length === 0) {
            return res.status(404).json({ message: "Không có bản ghi" });
        }

        const roomIds = newsList.map(n => n.ROOM_NEWS_ID);

        // 2. Lấy ảnh theo room_news_id
        const sqlImages = `
            SELECT ROOM_NEWS_ID, IMAGE_URL
            FROM ROOM_IMAGE
            WHERE ROOM_NEWS_ID IN (${roomIds.join(',')})
        `;
        const imageResult = await connection.execute(sqlImages, [], {
            outFormat: oracledb.OBJECT
        });

        // 3. Map mỗi ROOM_NEWS_ID với 1 ảnh đầu tiên
        const imageMap = {};
        for (const row of imageResult.rows) {
            const roomId = row.ROOM_NEWS_ID;
            if (!imageMap[roomId]) { // Chỉ lấy ảnh đầu tiên nếu chưa có
                const clob = row.IMAGE_URL;
                const imageContent = await readClob(clob); // Hàm đọc CLOB từ Oracle
                imageMap[roomId] = [imageContent];
            }
        }

        // 4. Gắn ảnh vào từng bản tin
        const resultWithImages = newsList.map(news => ({
            ...news,
            IMAGES: imageMap[news.ROOM_NEWS_ID] || []
        }));

        res.status(200).json({
            status: 200,
            message: "Thành công",
            object: resultWithImages
        });

    } catch (e) {
        console.error("❌ Error:", e);
        res.status(500).json({ message: "Lỗi máy chủ" });
    } finally {
        if (connection) await connection.close();
    }
}


async function getDetailNews(req, res) {
    const { newsId } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection();

        // Lấy thông tin bài đăng và sdt
        const sql = `
            SELECT r.*, c.phone
            FROM RENT_ROOM_NEWS r
                     JOIN CUSTOMER c ON r.customer_id = c.customer_id
            WHERE room_news_id = :newsId
        `;
        const result = await connection.execute(sql, [newsId], {
            outFormat: oracledb.OBJECT
        });

        // Nếu không có bản ghi nào
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ message: "Không có bản ghi" });
        }

        const detailNews = result.rows; // lấy 1 object duy nhất

        // Lấy danh sách ảnh
        const sqlImages = `
            SELECT IMAGE_URL
            FROM ROOM_IMAGE
            WHERE ROOM_NEWS_ID = :newsId
        `;
        const imageResult = await connection.execute(sqlImages, [newsId], {
            outFormat: oracledb.OBJECT
        });

        let listImage = [];

        if (imageResult.rows && Array.isArray(imageResult.rows)) {
            for (const row of imageResult.rows) {
                const clob = row.IMAGE_URL;
                const imageContent = await readClob(clob);
                listImage.push(imageContent);
            }
        }

        // Gán danh sách ảnh vào chi tiết bài đăng
        detailNews[0].IMAGES = listImage;

        // Trả kết quả
        res.json({ status: 200, message: "success", object: detailNews });

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Lỗi máy chủ" });
    } finally {
        if (connection) await connection.close();
    }
}


async function addNews(req, res) {
    const {
        customerId,
        area,
        price,
        description,
        status,
        furnitureStatus,
        deposit,
        title,
        customerType,
        address,
        images // <-- danh sách ảnh
    } = req.body;

    let connection;

    try {
        connection = await oracledb.getConnection();

        const insertNewsSql = `
            INSERT INTO Rent_Room_News (customer_id, area, price, description, status, furniture_status, deposit, title,
                                        customer_type, address)
            VALUES (:customer_id, :area, :price, :description, :status, :furniture_status, :deposit, :title,
                    :customer_type, :address) RETURNING room_news_id
            INTO :room_news_id
        `;
        console.log("Dữ liệu gửi vào DB:", {
            customer_id: customerId,
            area,
            price,
            description,
            status,
            furniture_status: furnitureStatus,
            deposit,
            title,
            customer_type: customerType,
            address
        });
        const roomNewsIdOut = {dir: oracledb.BIND_OUT, type: oracledb.NUMBER};

        const result = await connection.execute(
            insertNewsSql,
            {
                customer_id: customerId,
                area,
                price,
                description,
                status: status.normalize('NFC'),
                furniture_status: furnitureStatus.normalize('NFC'),
                deposit,
                title,
                customer_type: customerType,
                address,
                room_news_id: roomNewsIdOut
            },
            {autoCommit: false}
        );

        const roomNewsId = result.outBinds.room_news_id[0];

        // Insert multiple images
        const insertImageSql = `
            INSERT INTO Room_Image (room_news_id, image_url)
            VALUES (:room_news_id, :image_url)
        `;

        if (images && Array.isArray(images)) {
            for (const image of images) {
                await connection.execute(insertImageSql, {
                    room_news_id: roomNewsId,
                    image_url: image // base64 hoặc link ảnh
                });
            }
        }

        await connection.commit();

        res.status(200).json({
            status: 200,
            message: "Thêm tin và ảnh thành công",
            room_news_id: roomNewsId
        });

    } catch (e) {
        console.error(e);
        if (connection) await connection.rollback();
        res.status(500).json({message: "Lỗi khi thêm tin hoặc ảnh"});
    } finally {
        if (connection) await connection.close();
    }
}

function readClob(clob) {
    return new Promise((resolve, reject) => {
        let clobData = '';
        clob.setEncoding('utf8');
        clob.on('data', (chunk) => clobData += chunk);
        clob.on('end', () => resolve(clobData));
        clob.on('error', reject);
    });
}

module.exports = {getAllNews, getDetailNews, addNews}