const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.post(
  '/',
  upload.array('images', 10),
  (req, res) => {
    const imageUrls = req.files.map(
      file => `/uploads/${file.filename}`
    );

    res.json({ imageUrls });
  }
);

module.exports = router;
