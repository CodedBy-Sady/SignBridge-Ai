import { getPool, getMemoryStore, getDbStatus } from '../config/db.js';

export const userModel = {
  async findByEmail(email) {
    const { isConnected } = getDbStatus();
    if (isConnected) {
      const [rows] = await getPool().query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      return rows[0] || null;
    }
    const store = getMemoryStore();
    return store.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findById(id) {
    const { isConnected } = getDbStatus();
    if (isConnected) {
      const [rows] = await getPool().query('SELECT id, full_name, email, google_id, avatar_url, role, preferred_language, created_at FROM users WHERE id = ? LIMIT 1', [id]);
      return rows[0] || null;
    }
    const store = getMemoryStore();
    const user = store.users.find(u => u.id === id);
    if (!user) return null;
    const { password_hash, ...rest } = user;
    return rest;
  },

  async findByGoogleId(googleId) {
    const { isConnected } = getDbStatus();
    if (isConnected) {
      const [rows] = await getPool().query('SELECT * FROM users WHERE google_id = ? LIMIT 1', [googleId]);
      return rows[0] || null;
    }
    const store = getMemoryStore();
    return store.users.find(u => u.google_id === googleId) || null;
  },

  async create({ id, full_name, email, password_hash = null, google_id = null, avatar_url = null, role = 'deaf_user' }) {
    const { isConnected } = getDbStatus();
    const now = new Date();
    if (isConnected) {
      await getPool().query(
        `INSERT INTO users (id, full_name, email, password_hash, google_id, avatar_url, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, full_name, email, password_hash, google_id, avatar_url, role, now, now]
      );
      return { id, full_name, email, google_id, avatar_url, role, created_at: now };
    }

    const store = getMemoryStore();
    const newUser = {
      id,
      full_name,
      email,
      password_hash,
      google_id,
      avatar_url,
      role,
      created_at: now,
      updated_at: now
    };
    store.users.push(newUser);
    return { id, full_name, email, google_id, avatar_url, role, created_at: now };
  },

  async updateGoogleId(id, googleId, avatarUrl) {
    const { isConnected } = getDbStatus();
    if (isConnected) {
      await getPool().query('UPDATE users SET google_id = ?, avatar_url = COALESCE(?, avatar_url) WHERE id = ?', [googleId, avatarUrl, id]);
      return;
    }
    const store = getMemoryStore();
    const user = store.users.find(u => u.id === id);
    if (user) {
      user.google_id = googleId;
      if (avatarUrl) user.avatar_url = avatarUrl;
    }
  }
};

