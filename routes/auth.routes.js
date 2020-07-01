const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth.controller');
const User = require('../models/user.model');
const authCheckMiddleware = require('../middlewares/auth-check')

const authRouter = express.Router();

authRouter.put('/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Enter a valid E-mail ID!')
            .custom((value, { req }) => {
                return User.findOne({ email: value })
                    .then(userDoc => {
                        if (userDoc) return Promise.reject('E-mail ID already exists!');
                    })
            })
            .normalizeEmail(),
        body('password')
            .trim()
            .isLength({ min: 5 })
            .withMessage('Password should contain atleast 5 characters!'),
        body('name')
            .trim()
            .not()
            .isEmpty()
    ],
    authController.signup);

authRouter.post('/signin', authController.signin);

authRouter.get('/status', authCheckMiddleware, authController.getUserStatus);

authRouter.patch('/status',
    authCheckMiddleware,
    [
        body('status')
            .trim()
            .not().isEmpty()
    ],
    authController.updateUserStatus);

module.exports = authRouter;