import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);

console.log("Decoded Token:", decoded);

// Get user from the token
req.user = await User.findById(decoded.id).select("-password");

console.log("User from DB:", req.user);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found with this token",
        });
      }

      next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed or expired",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided in header",
    });
  }
};

export const optionalProtect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      // Ignore token validation failures for optional protect
    }
  }
  next();
};
