const { PrismaClient } = require('@prisma/client');


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
  