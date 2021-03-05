require('dotenv').config();

const express = require('express');
// const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');

//  middleware
const { errorHandler } = require('./middleware/errors');
const handle404 = require('./middleware/404');

const app = express();

app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

app.use(errorHandler);
app.use(handle404);

module.exports = app;
