const jwt = require("jsonwebtoken");
const pool = require("../db"); // Add this import
require("dotenv").config();

module.exports = async function(req, res, next) {
  console.log("Authorization header:", req.header("authorization"));
  
  const token = req.header("authorization")?.replace("Bearer ", "");
  console.log("Extracted token:", token);
  
  if (!token) {
    console.log("No token found");
    return res.status(403).json({ msg: "authorization denied" });
  }
  
  try {
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified, user:", verify.user);
    
    req.user = verify.user;
    next();
  } catch (err) {
    console.log("Token verification failed:", err.message);
    
    // NEW: Handle expired/invalid tokens by setting is_active to false
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      try {
        // Try to decode without verification to get user ID
        const decoded = jwt.decode(token);
        if (decoded && decoded.user && decoded.user.id) {
          await pool.query('UPDATE "User" SET "is_active" = false WHERE "user_id" = $1', [decoded.user.id]);
          console.log(`Set is_active=false for user ${decoded.user.id} due to token expiration/invalidity`);
        }
      } catch (decodeErr) {
        console.log("Could not decode token to update user status:", decodeErr.message);
      }
    }
    
    res.status(401).json({ msg: "Token is not valid" });
  }
};