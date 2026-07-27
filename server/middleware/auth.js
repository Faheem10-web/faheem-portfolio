import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretportfoliojwttokenkey2026');
      
      if (decoded.id === 'env-admin-id') {
        req.user = {
          _id: 'env-admin-id',
          username: process.env.ADMIN_USERNAME || 'admin',
          role: 'admin'
        };
        return next();
      }

      if (mongoose.connection.readyState === 1) {
        try {
          req.user = await User.findById(decoded.id).select('-password');
        } catch {
          // Ignore DB find failure if DB drops mid-request
        }
      }

      if (!req.user) {
        req.user = {
          _id: decoded.id || 'env-admin-id',
          username: process.env.ADMIN_USERNAME || 'admin',
          role: 'admin'
        };
      }

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token validation failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no session token provided' });
  }
};
export default protect;
