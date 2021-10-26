const dotenv = require("dotenv");
const express = require("express");
const router = express.Router();
dotenv.config();
const MAGIC_PUBLISHABLE_KEY = process.env.MAGIC_PUBLISHABLE_KEY;

// GET home page
router.get("/", (req, res) => {
  res.render("index", {
    title: "Magic.link + Cerbos Demo",
    MAGIC_PUBLISHABLE_KEY,
  });
});

module.exports = router;
