const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const keys = require("../../config/keys");

//@route GET api/users/test
//@desc Tests users route
//@access Public

router.get("/test", (req, res) => res.json({ msg: "Users works" }));

//@route POST api/users/register
//@desc Register User
//@access Public

router.post("/register", async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return res.status(400).json({ email: "Email already exists" });
  } else {
    const avatar = await gravatar.url(req.body.email, {
      s: "200",
      r: "pg",
      d: "mm"
    });

    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      avatar,
      password: req.body.password
    });

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, async (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        const user = await newUser.save();
        if (user) {
          res.json(user);
        }
      });
    });
  }
});

//@route POST api/users/login
//@desc Login User / Returning JWT Token
//@access Public

router.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  //Find user by email
  const foundUser = await User.findOne({ email });
  if (!foundUser) {
    return res.status(404).json({ email: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, foundUser.password);
  if (isMatch) {
    //User Matched
    const payload = {
      id: foundUser.id,
      name: foundUser.name,
      avatar: foundUser.avatar
    };
    //Sign Token
    jwt.sign(payload, keys.secretOrKey, { expiresIn: 3600 }, (err, token) => {
      res.json({ success: true, token: "Bearer " + token });
    });
  } else {
    res.status(400).json({ password: "Password Incorrect" });
  }
});

module.exports = router;
