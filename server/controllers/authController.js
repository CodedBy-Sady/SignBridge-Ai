import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { userModel } from '../models/userModel.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'signbridge_super_secret_jwt_key_2026';
const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID || '';

const signToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
};

export const register = async (req, res, next) => {
  try {
    const { full_name, email, password, role = 'deaf_user' } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.'
      });
    }

    // Email must end with @gmail.com
    const emailRegex = /^[^\s@]+@gmail\.com$/i;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Only @gmail.com email addresses are allowed.'
      });
    }

    // Password: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter.'
      });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one lowercase letter.'
      });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one number.'
      });
    }

    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await userModel.create({
      id: uuidv4(),
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      role: ['deaf_user', 'hearing_user', 'admin'].includes(role) ? role : 'deaf_user'
    });

    const token = signToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        avatar_url: newUser.avatar_url
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await userModel.findByEmail(email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'This account was created with Google Sign-In. Please click "Continue with Google".'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { id_token, role = 'deaf_user', demo_user } = req.body;

    let email, full_name, google_id, avatar_url;

    // Support instant demo Google Sign-in if simulated or client ID is testing
    if (demo_user) {
      email = demo_user.email;
      full_name = demo_user.name || 'Google User';
      google_id = demo_user.sub || `google-demo-${Date.now()}`;
      avatar_url = demo_user.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
    } else if (id_token) {
      const clientId = getGoogleClientId();
      if (clientId) {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
          idToken: id_token,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        full_name = payload.name;
        google_id = payload.sub;
        avatar_url = payload.picture;
      } else {
        // Fallback decoded token payload simulation
        const base64Url = id_token.split('.')[1];
        if (base64Url) {
          const decoded = JSON.parse(Buffer.from(base64Url, 'base64').toString());
          email = decoded.email;
          full_name = decoded.name;
          google_id = decoded.sub;
          avatar_url = decoded.picture;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid Google ID token supplied.'
          });
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Google credentials or id_token required.'
      });
    }

    let user = await userModel.findByGoogleId(google_id);

    if (!user && email) {
      user = await userModel.findByEmail(email);
      if (user) {
        await userModel.updateGoogleId(user.id, google_id, avatar_url);
      }
    }

    if (!user) {
      user = await userModel.create({
        id: uuidv4(),
        full_name,
        email,
        google_id,
        avatar_url,
        role: ['deaf_user', 'hearing_user'].includes(role) ? role : 'deaf_user'
      });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      message: 'Authenticated with Google successfully.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url || avatar_url
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

