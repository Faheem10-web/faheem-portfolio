import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { GlobalSettings } from '../models/schemas.js';

export const invalidateMaintenanceCache = () => {};

export const checkMaintenance = async (req, res, next) => {
  try {
    if (req.params && req.params.module === 'global') {
      return next();
    }

    if (mongoose.connection.readyState !== 1) {
      return next();
    }

    const settings = await GlobalSettings.findOne().lean();
    const isMaintenance = settings ? !!settings.maintenanceMode : false;

    if (isMaintenance) {
      let isAdmin = false;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretportfoliojwttokenkey2026');
          if (decoded.id === 'env-admin-id') {
            isAdmin = true;
          } else {
            const user = await User.findById(decoded.id).select('-password').lean();
            if (user && user.role === 'admin') {
              isAdmin = true;
            }
          }
        } catch {
          // Token verification failed, treat as public
        }
      }

      if (!isAdmin) {
        return res.status(503).json({
          status: 'maintenance',
          message: 'Portfolio is currently in maintenance mode'
        });
      }
    }
    next();
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    next();
  }
};

export default checkMaintenance;
