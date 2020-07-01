const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');

const Post = require('../models/post.model');
const User = require('../models/user.model');
const socket = require('../utils/socket');
const { generateError } = require('../utils/app-helper');

exports.fetchPosts = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const itemsPerPage = 2;
    let totalItems;
    Post.find().countDocuments()
        .then(count => {
            totalItems = count;
            return Post.find()
                .populate('creator')
                .sort({ createdAt: -1 })
                .skip((currentPage - 1) * itemsPerPage)
                .limit(itemsPerPage);
        })
        .then(posts => {
            if (!posts) {
                throw generateError('No post found!', 404);
            } else {
                res.status(200).json({
                    posts: posts,
                    totalItems: totalItems
                });
            }
        })
        .catch(error => next(error));
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw generateError('Validations failed!', 422);
    }
    if (!req.file) {
        throw generateError('Image is missing!', 422);
    }

    const filePathArray = req.file.path.split("\\");
    const filePath = filePathArray.reduce((prev, curr, index) => {
        index === filePathArray.length - 1 ? prev += curr : prev += curr + '/';
        return prev;
    }, '');
    const post = new Post({
        title: req.body.title,
        imageUrl: filePath,
        content: req.body.content,
        creator: req.userId
    });
    let updatedPost;
    post.save()
        .then(result => {
            updatedPost = result;
            return User.findById(req.userId);
        })
        .then(user => {
            user.posts.push(post);
            return user.save();
        })
        .then(user => {
            socket.getSocket().emit('posts', {
                action: 'create',
                post: { ...post._doc, creator: { _id: req.userId, name: user.name } }
            });
            res.status(201).json({
                message: 'Post created successfully!',
                post: updatedPost,
                creator: { userId: user._id, name: user.name }
            });
        })
        .catch(error => next(error));
};

exports.fetchSinglePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                throw generateError('Post not found!', 404);
            } else {
                res.status(200).json({
                    post: post
                });
            }
        })
        .catch(error => next(error));
};

exports.editPost = (req, res, next) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        throw generateError('Validations failed!', 422, validationErrors.array());
    }

    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
        const filePathArray = req.file.path.split("\\");
        imageUrl = filePathArray.reduce((prev, curr, index) => {
            index === filePathArray.length - 1 ? prev += curr : prev += curr + '/';
            return prev;
        }, '');
    }
    if (!imageUrl) {
        throw generateError('No file picked!', 422);
    }

    Post.findById(postId)
        .populate('creator')
        .then(post => {
            if (!post) {
                throw generateError('Post not found!', 404);
            }
            if (post.creator._id.toString() !== req.userId) {
                throw generateError('Unauthorized to edit post!', 403);
            }
            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }
            post.title = title;
            post.content = content;
            post.imageUrl = imageUrl;
            return post.save();
        })
        .then(result => {
            socket.getSocket().emit('posts', {
                action: 'update',
                post: result
            });
            res.status(200).json({
                message: 'Post updated successfully!',
                post: result
            });
        })
        .catch(error => next(error));
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                throw generateError('Post not found!', 404);
            }
            if (post.creator.toString() !== req.userId) {
                throw generateError('Unauthorized to edit post!', 403);
            }
            clearImage(post.imageUrl);
            return Post.findByIdAndRemove(postId);
        })
        .then(post => {
            return User.findById(post.creator);
        })
        .then(user => {
            user.posts = user.posts.pull(postId);
            return user.save();
        })
        .then(user => {
            socket.getSocket().emit('posts',
                {
                    action: 'delete',
                    post: postId
                });
            res.status(200).json({
                message: 'Post deleted successfully!'
            });
        })
        .catch(error => next(error));
};

const clearImage = filePath => {
    console.log(path.join(__dirname, '..', filePath));
    fs.unlink(path.join(__dirname, '..', filePath), error => {
        if (error) next(error);
    });
};