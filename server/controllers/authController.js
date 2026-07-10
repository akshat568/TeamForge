import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/user.js";

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, college, year, branch } = req.body;

    // 1. Basic validation
    if (!name || !email || !password || !college || !year || !branch) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email address",
      });
    }

    // 3. Create user (password will be hashed by pre-save schema hook)
    const user = await User.create({
      name,
      email,
      password,
      college,
      year,
      branch,
    });

    // 4. Generate token and return success
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        year: user.year,
        branch: user.branch,
        skills: user.skills,
        github: user.github,
        linkedin: user.linkedin,
        bio: user.bio,
        profilePicture: user.profilePicture,
        resume: user.resume,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email and password",
      });
    }

    // 2. Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3. Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Generate token and return success
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        year: user.year,
        branch: user.branch,
        skills: user.skills,
        github: user.github,
        linkedin: user.linkedin,
        bio: user.bio,
        profilePicture: user.profilePicture,
        resume: user.resume,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    // req.user has already been fetched by the protect middleware without the password field
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        college: req.user.college,
        year: req.user.year,
        branch: req.user.branch,
        skills: req.user.skills,
        github: req.user.github,
        linkedin: req.user.linkedin,
        bio: req.user.bio,
        profilePicture: req.user.profilePicture,
        resume: req.user.resume,
      },
    });
  } catch (error) {
    next(error);
  }
};

// In-memory rate limiting map
const ipRequests = new Map();

export const forgotPasswordRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const now = Date.now();
  const limitWindow = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;

  if (!ipRequests.has(ip)) {
    ipRequests.set(ip, []);
  }

  const requests = ipRequests.get(ip).filter((timestamp) => now - timestamp < limitWindow);
  requests.push(now);
  ipRequests.set(ip, requests);

  if (requests.length > maxRequests) {
    return res.status(429).json({
      success: false,
      message: "Too many reset requests from this IP. Please try again after 15 minutes.",
    });
  }
  next();
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email address.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    // Generate secure random 32-byte token
    const rawResetToken = crypto.randomBytes(32).toString("hex");

    // Store hashed token (SHA-256) and expiration (15 minutes)
    const hashedToken = crypto.createHash("sha256").update(rawResetToken).digest("hex");
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Create Nodemailer Transporter
    const transportConfig = {
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    if (process.env.SMTP_HOST === "smtp.gmail.com" || process.env.SMTP_USER?.endsWith("@gmail.com")) {
      transportConfig.service = "gmail";
    } else {
      transportConfig.host = process.env.SMTP_HOST;
      transportConfig.port = parseInt(process.env.SMTP_PORT) || 587;
      transportConfig.secure = parseInt(process.env.SMTP_PORT) === 465;
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${rawResetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"TeamForge Support" <support@teamforge.com>',
      to: user.email,
      subject: "Reset Your TeamForge Password",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; padding: 40px; color: #F8FAFC; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #334155;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 40px; height: 40px; background-color: #2563EB; border-radius: 8px; line-height: 40px; color: #FFFFFF; font-weight: 900; font-size: 20px; text-align: center;">T</div>
            <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 800; margin-top: 15px; margin-bottom: 5px;">TeamForge</h1>
            <p style="color: #94A3B8; font-size: 14px; margin: 0;">Collaborate. Build. Ship.</p>
          </div>
          
          <div style="background-color: #1E293B; padding: 30px; border-radius: 8px; border: 1px solid #334155;">
            <h2 style="color: #FFFFFF; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 15px;">Password Reset Request</h2>
            <p style="color: #CBD5E1; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
              Hello ${user.name},<br/><br/>
              We received a request to reset your password for your TeamForge account. Click the button below to secure your account and set a new password:
            </p>
            
            <div style="text-align: center; margin-bottom: 25px;">
              <a href="${resetURL}" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; font-weight: 700; font-size: 15px; padding: 14px 28px; text-decoration: none; border-radius: 8px; transition: background-color 0.15s ease;">Reset Password</a>
            </div>
            
            <p style="color: #94A3B8; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
              <strong>Notice:</strong> This password reset link expires in <strong>15 minutes</strong> and can only be used once. If you did not make this request, you can safely ignore this email; your password will remain unchanged.
            </p>
          </div>
          
          <div style="margin-top: 30px; border-top: 1px solid #334155; padding-top: 20px; font-size: 12px; color: #64748B;">
            <p style="margin-bottom: 10px;">If the button doesn't work, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; color: #2563EB; font-family: monospace;">${resetURL}</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Reset link sent to your email address.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // 1. Validations
    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please enter your new password and confirmation.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // 2. Hash token parameter and find user with unexpired token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is invalid or has expired.",
      });
    }

    // 3. Update password (pre-save hook hashes it automatically)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

