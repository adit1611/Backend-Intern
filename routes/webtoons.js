const express = require('express');
const router = express.Router();
const Webtoon = require('../models/webtoon');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Middleware to authenticate using JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token missing, access denied' });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Fetch all webtoons (no authentication required)
router.get('/', async (req, res) => {
  try {
    const webtoons = await Webtoon.find();
    res.json(webtoons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch a specific webtoon by ID (no authentication required)
router.get('/:id', async (req, res) => {
  try {
    const webtoon = await Webtoon.findById(req.params.id);
    if (!webtoon) return res.status(404).json({ message: 'Webtoon not found' });
    res.json(webtoon);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid webtoon ID format' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Add a new webtoon (JWT required)
router.post('/', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('characters').isArray().withMessage('Characters should be an array')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, characters } = req.body;
  const webtoon = new Webtoon({ title, description, characters });

  try {
    const newWebtoon = await webtoon.save();
    res.status(201).json(newWebtoon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a webtoon by ID (JWT required)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const webtoon = await Webtoon.findById(req.params.id);
    if (!webtoon) return res.status(404).json({ message: 'Webtoon not found' });

    await webtoon.deleteOne();
    res.json({ message: 'Webtoon deleted' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid webtoon ID format' });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
