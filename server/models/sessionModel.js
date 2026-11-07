import { getPool, getMemoryStore, getDbStatus } from '../config/db.js';

export const sessionModel = {
  async create({ id, userId, title = 'Two-Way Conversation', status = 'active', metadata = null }) {
    const { isConnected } = getDbStatus();
    const now = new Date();
    if (isConnected) {
      await getPool().query(
        `INSERT INTO sessions (id, user_id, title, status, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, userId, title, status, metadata ? JSON.stringify(metadata) : null, now]
      );
      return { id, user_id: userId, title, status, metadata, created_at: now, ended_at: null };
    }

    const store = getMemoryStore();
    const newSession = {
      id,
      user_id: userId,
      title,
      status,
      metadata,
      created_at: now,
      ended_at: null
    };
    store.sessions.push(newSession);
    return newSession;
  },

  async findById(id) {
    const { isConnected } = getDbStatus();
    if (isConnected) {
      const [rows] = await getPool().query('SELECT * FROM sessions WHERE id = ? LIMIT 1', [id]);
      return rows[0] || null;
    }
    const store = getMemoryStore();
    return store.sessions.find(s => s.id === id) || null;
  },

  async findByUserId(userId) {
    const { isConnected } = getDbStatus();
    if (isConnected) {
      const [rows] = await getPool().query(
        `SELECT s.*, COUNT(m.id) AS message_count 
         FROM sessions s
         LEFT JOIN messages m ON s.id = m.session_id
         WHERE s.user_id = ?
         GROUP BY s.id
         ORDER BY s.created_at DESC`,
        [userId]
      );
      return rows;
    }
    const store = getMemoryStore();
    return store.sessions
      .filter(s => s.user_id === userId)
      .map(s => ({
        ...s,
        message_count: store.messages.filter(m => m.session_id === s.id).length
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async endSession(id) {
    const { isConnected } = getDbStatus();
    const now = new Date();
    if (isConnected) {
      await getPool().query('UPDATE sessions SET status = "ended", ended_at = ? WHERE id = ?', [now, id]);
      return this.findById(id);
    }
    const store = getMemoryStore();
    const session = store.sessions.find(s => s.id === id);
    if (session) {
      session.status = 'ended';
      session.ended_at = now;
    }
    return session;
  }
};

