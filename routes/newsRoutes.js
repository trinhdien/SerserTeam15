const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

router.post('/getNewsById', newsController.getNewByUserId);
module.exports = router;