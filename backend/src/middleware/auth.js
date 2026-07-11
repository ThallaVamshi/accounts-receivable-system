const jwt = require('jsonwebtoken');
require('dotenv').config();
const { User } = require('../models');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'name']
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid, user not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token is not valid or expired'
    });
  }
};
