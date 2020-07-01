const path = require('path');
const fs = require('fs');

const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const morgan = require('morgan');
const multer = require('multer');
const { v4 } = require('uuid');

const feedsRouter = require('./routes/feeds.routes');
const authRouter = require('./routes/auth.routes');
const corsMiddleware = require('./middlewares/cors');
const errorHandlerMiddleware = require('./middlewares/error-handler');

const app = express();
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/images')
    },
    filename: function (req, file, cb) {
        cb(null, v4() + path.extname(file.originalname))
    }
});
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
        return cb(new Error('Only images are allowed'));
    }
    cb(null, true);
};
const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flag: 'a' }
);

app.use(helmet());
app.use(morgan('combined', { stream: accessLogStream }));
app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(corsMiddleware);
app.use('/assets/images', express.static(path.join(__dirname, 'assets', 'images')));
app.use(express.static('client/build'));
app.use('/feeds', feedsRouter);
app.use('/auth', authRouter);
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
});
app.use(errorHandlerMiddleware);

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-3gwoz.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(res => {
        const server = app.listen(process.env.PORT || 8080, () => {
            console.log(`Node.js server is running on port:${process.env.PORT || 8080}...`)
        });
        const socket = require('./utils/socket').init(server);
        socket.on('connection', client => {
            console.log('Client connected through websocket!');
        });
    })
    .catch(err => console.log(err));