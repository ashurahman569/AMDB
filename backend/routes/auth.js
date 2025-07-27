const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../db");
const validInfo = require("../middleware/validinfo");
const jwtGenerator = require("../utils/jwtGenerator");
const authorize = require("../middleware/authorize");

//authentication

router.post("/register", validInfo, async (req, res) => {

  const { email, username, password } = req.body;

  try {
    // Check if username is already taken
    const existingUsername = await pool.query('SELECT * FROM "User" WHERE "username" = $1', [username]);

    if (existingUsername.rows.length > 0) {
      return res.status(401).json({ message: "This username is already taken!" });
    }
    // Check if email is already registered
    const user = await pool.query('SELECT * FROM "User" WHERE "email" = $1', [email]);

    if (user.rows.length > 0) {
      return res.status(401).json({ message: "This email is already registered!" });
    }

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);

    let newUser = await pool.query(
      'INSERT INTO "User" ("username", "email", "password_hash") VALUES ($1, $2, $3) RETURNING *',
      [username, email, bcryptPassword]
    );
    const jwtToken = jwtGenerator(newUser.rows[0].user_id);

    return res.json({ 
      token: jwtToken,
      user: {
        id: newUser.rows[0].user_id,       
        username: newUser.rows[0].username, 
        email: newUser.rows[0].email,
        user_type: newUser.rows[0].user_type        // Fixed: using newUser instead of user
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", validInfo, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM "User" WHERE "email" = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password_hash
    );

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    await pool.query('UPDATE "User" SET "is_active" = true WHERE "user_id" = $1', [user.rows[0].user_id]);
    const jwtToken = jwtGenerator(user.rows[0].user_id);
    return res.json({ 
      token: jwtToken,
      user: {
        id: user.rows[0].user_id,
        username: user.rows[0].username,
        email: user.rows[0].email,
        user_type: user.rows[0].user_type // Added user_type to the response
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

//add another method here that handles logout
router.post("/logout", authorize, async (req, res) => {
  try {
    // Set is_active to false for the user
    await pool.query('UPDATE "User" SET "is_active" = false WHERE "user_id" = $1', [req.user.id]);
    res.json({ message: "Logout successful" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/verify", authorize, async (req, res) => {
  try {
    // Get user data from database using the user ID from the token
    const user = await pool.query('SELECT "user_id", "username", "email", "user_type" FROM "User" WHERE "user_id" = $1', [
      req.user.id
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      id: user.rows[0].user_id,
      username: user.rows[0].username,
      email: user.rows[0].email,
      user_type: user.rows[0].user_type

    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
