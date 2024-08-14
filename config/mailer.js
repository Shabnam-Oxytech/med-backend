const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail', // Or your preferred email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// Function to send verification email
const sendVerificationEmail = async (email, token) => {
  const url = `http://localhost:5000/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: 'shabnamikram09@gmail.com',
    to: email,
    subject: 'Email Verification',
    html: `<p>Please verify your email by clicking <a href="${url}">here</a>.</p>`
  });
};

module.exports = { sendVerificationEmail };
