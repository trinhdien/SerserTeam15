const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

router.post('/getNewsById', newsController.getNewByUserId);
router.post('/getDetailNews', newsController.getDetailNews)
module.exports = router;