import { getPool, getMemoryStore, getDbStatus } from '../config/db.js';

export const messageModel = {
  async create({
    id,
    sessionId,
    senderRole,
    inputType,
    rawContent = null,
    finalContent,
    confidenceScore = null
  }) {
    const { isConnected } = getDbStatus();
    const now = new Date();
    if (isConnected) {
      await getPool().query(
        `INSERT INTO messages (id, session_id, sender_role, input_type, raw_content, final_content, confidence_score, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, sessionId, senderRole, inputType, rawContent, finalContent, confidenceScore, now]
      );
      return {
        id,
        session_id: sessionId,
        sender_role: senderRole,
        input_type: inputType,
        raw_content: rawContent,
        final_content: finalContent,
        confidence_score: confidenceScore,
        timestamp: now
      };
    }

    const store = getMemoryStore();
    const newMessage = {
      id,
      session_id: sessionId,
      sender_role: senderRole,
      input_type: inputType,
      raw_content: rawContent,
      final_content: finalContent,
      confidence_score: confidenceScore,
      timestamp: now
    };
    store.messages.push(newMessage);
    return newMessage;
  },

  async findBySessionId(sessionId) {
    const { isConnected } = getDbStatus();
    if (isConnected) {
      const [rows] = await getPool().query(
        'SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC',
        [sessionId]
      );
      return rows;
    }
    const store = getMemoryStore();
    return store.messages
      .filter(m => m.session_id === sessionId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
};

