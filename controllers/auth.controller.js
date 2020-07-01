const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const User = require('../models/user.model');
const { generateError } = require('../utils/app-helper');

exports.signup = (req, res, next) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        throw generateError('Validations falied!', 422, validationErrors.array());
    }

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    bcrypt.hash(password, 12)
        .then(hashedPass => {
            const user = new User({
                name: name,
                email: email,
                password: hashedPass
            });
            return user.save();
        })
        .then(result => {
            res.status(201).json({
                message: 'User created successfully!',
                userId: result._id
            });
        })
        .catch(err => next(err));
};

exports.signin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                throw generateError('User with this Email ID doesn\'t exist', 401);
            }
            loadedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            if (!isEqual) {
                throw generateError('Password is incorrect!', 401);
            }
            const token = jwt.sign({
                email: loadedUser.email,
                userId: loadedUser._id.toString()
            }, 'supersecretkey', { expiresIn: '1h' }
            );
            res.status(200).json({ token: token, userId: loadedUser._id.toString(), expiresIn: 3600 });
        })
        .catch(err => next(err));
};

exports.getUserStatus = (req, res, next) => {
    User.findById(req.userId)
        .then(user => {
            if (!user) {
                throw generateError('User not found!', 404);
            }
            res.status(200).json({ status: user.status });
        })
        .catch(err => next(err));
};

exports.updateUserStatus = (req, res, next) => {
    const userStatus = req.body.status;
    User.findById(req.userId)
        .then(user => {
            if (!user) {
                throw generateError('User not found!', 404);
            }
            user.status = userStatus;
            return user.save();
        })
        .then(user => {
            res.status(200).json({ message: 'Status updated successfully!' });
        })
        .catch(err => next(err));
};