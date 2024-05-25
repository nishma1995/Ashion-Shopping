// routes/otpRoutes.js
const express = require('express');
const otpController = require('../controllers/otp');
const router = express.Router();
router.post('/send-otp', otp.sendOTP);
module.exports = router;