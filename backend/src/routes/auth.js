const { Router } = require('express');
const auth = require('../middleware/auth');
const {
  register,
  login,
  logout,
  me,
  registerValidation,
  loginValidation,
} = require('../controllers/authController');

const router = Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.get('/me', auth, me);

module.exports = router;
