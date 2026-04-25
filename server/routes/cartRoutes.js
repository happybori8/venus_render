const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyCart,
  replaceMyCart,
  mergeMyCart,
  clearMyCart,
} = require('../controllers/cartController');

router.get('/', protect, getMyCart);
router.put('/', protect, replaceMyCart);
router.post('/merge', protect, mergeMyCart);
router.delete('/', protect, clearMyCart);

module.exports = router;
