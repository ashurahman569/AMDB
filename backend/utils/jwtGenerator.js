const jwt = require('jsonwebtoken');
require('dotenv').config();

function jwtGenerator(user_id) {
  console.log("JWT_SECRET:", process.env.JWT_SECRET); // Debug line
  
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  
  const payload = {
    user: {
      id: user_id
    }
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

module.exports = jwtGenerator;
