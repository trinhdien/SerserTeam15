const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const app = express();
const db = require('./config/db');
const indexRouter = require('./routes/index');
const newsRoutes = require('./routes/newsRoutes');
const {json, urlencoded} = require("express");
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

async function start() {
    await db.initialize();

    app.use('/', indexRouter);
    app.use('/',newsRoutes);
}

start().then(r => {
    console.log('Start finished with result:', r);
});

process.on('SIGINT', async () => {
    console.log('Closing DB pool');
    await db.close();
    process.exit(0);
});

module.exports = app;