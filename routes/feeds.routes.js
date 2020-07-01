const express = require('express');

const { body } = require('express-validator');

const feedsController = require('../controllers/feeds.controller');
const authCheckMiddleware = require('../middlewares/auth-check');

const feedsRouter = express.Router();

feedsRouter.get('/posts', authCheckMiddleware, feedsController.fetchPosts);

feedsRouter.post('/post',
    authCheckMiddleware,
    [
        body('title').trim().isLength({ min: 5 }),
        body('content').trim().isLength({ min: 5 })
    ],
    feedsController.createPost);

feedsRouter.get('/post/:postId', authCheckMiddleware, feedsController.fetchSinglePost);

feedsRouter.put('/post/:postId',
    authCheckMiddleware,
    [
        body('title').trim().isLength({ min: 5 }),
        body('content').trim().isLength({ min: 5 })
    ],
    feedsController.editPost);

feedsRouter.delete('/post/:postId', authCheckMiddleware, feedsController.deletePost);

module.exports = feedsRouter;