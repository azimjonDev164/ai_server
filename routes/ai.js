const express = require("express");
const router = express.Router();
const { getContent } = require("../controllers/aiController");

router.post("/", getContent);

module.exports = router;
