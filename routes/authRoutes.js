const express = require('express');
const router = express.Router();
const { register, loginUser } = require('../controllers/authController'); 

// Registration route
// router.post('/register', register);

// Login route
// router.post('/login', loginUser);
// router.get('/verify-email', authController.verifyEmail);


module.exports = router;
