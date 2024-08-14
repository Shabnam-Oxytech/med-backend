const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Ignore self-signed certificates
  },
});


exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create new user
    const newUser = await prisma.users.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        emailVerified: false, // Initially set to false
        verificationToken,
      },
    });

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    try {
      console.log(process.env.FRONTEND_URL)
    await transporter.sendMail({
      to: email,
      subject: 'Email Verification',
      html: `
        <p>Hi ${firstName},</p>
        <p>We are excited to get you going with the MedSmarter Accountability Platform (MAP). But first, you need to confirm your account.</p>
        <br>
        <p>Just click the button below to verify your account and Start 15 days free trial.</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
    console.log('Email sent successfully');
    } catch (error) {
      console.error('Email sending error:', error);
    }

    return res.json({ message: "Registration successful. Please check your email to verify your account." });
  } catch (error) {
    console.error('Registration error:', error); // More descriptive error message
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};



exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  // res.status(200).json({
  //   "working": "working"
  // })

  try {
    const user = await prisma.users.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    await prisma.users.update({
      where: { email: user.email },
      data: {
        emailVerified: true,
        verificationToken: null, // Remove the token
      },
    });

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  } finally {
    await prisma.$disconnect();
  }
};

    

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.emailVerified === false ) {
      return res.status(400).json({ message: "User Email not verified" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.SECRET_KEY,
      {
        expiresIn: "24h",
      }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  } finally {
    await prisma.$disconnect();
    }
  };


exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "User with this email does not exist" });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour expiration

    await prisma.users.update({
      where: { email },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpiration,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

    await transporter.sendMail({
      to: email,
      subject: 'Password Reset',
      html: `
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};


// authController.js

exports.resetPassword = async (req, res) => {
  const { token, email, newPassword } = req.body;
  try {
    const user = await prisma.users.findUnique({
      where: {
        email,
        resetPasswordToken: token,
        resetPasswordExpires: {
          gte: new Date(), // Check if token is not expired
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};
