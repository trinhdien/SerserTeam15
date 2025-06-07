const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

router.post('/getAllNews', newsController.getAllNews);
router.post('/getDetailNews', newsController.getDetailNews)
router.post('/addNews', newsController.addNews)
module.exports = router;