const db = require('../../config/db');

const supportService = {
  async saveMessage(userId, { session_id, name, email, message, sender_type }) {
    if (!session_id) {
      throw { status: 400, message: 'Thiếu thông tin session_id' };
    }
    if (!message || !message.trim()) {
      throw { status: 400, message: 'Tin nhắn không được bỏ trống' };
    }
    if (!sender_type || !['customer', 'admin'].includes(sender_type)) {
      throw { status: 400, message: 'sender_type không hợp lệ' };
    }

    let customerName = name || null;
    let customerEmail = email || null;

    // If userId is provided, fetch name and email from profile if not provided
    if (userId && !customerName) {
      const user = await db.queryOne('SELECT full_name, email FROM users WHERE id = ?', [userId]);
      if (user) {
        customerName = user.full_name;
        customerEmail = user.email;
      }
    }

    await db.query(
      `INSERT INTO support_messages (user_id, name, email, sender_type, message, session_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId || null, customerName, customerEmail, sender_type, message.trim(), session_id]
    );

    const inserted = await db.queryOne('SELECT LAST_INSERT_ID() as id');
    return {
      id: inserted.id,
      user_id: userId || null,
      name: customerName,
      email: customerEmail,
      sender_type,
      message: message.trim(),
      session_id,
      created_at: new Date()
    };
  },

  async getSessionMessages(sessionId) {
    if (!sessionId) {
      throw { status: 400, message: 'Thiếu thông tin session_id' };
    }
    return await db.query(
      `SELECT id, user_id, name, email, sender_type, message, session_id, created_at
       FROM support_messages
       WHERE session_id = ?
       ORDER BY created_at ASC, id ASC`,
      [sessionId]
    );
  },

  async getActiveThreads() {
    return await db.query(
      `SELECT sm.session_id, sm.name, sm.email, sm.message as latest_message, sm.created_at as latest_time
       FROM support_messages sm
       INNER JOIN (
         SELECT session_id, MAX(id) as max_id
         FROM support_messages
         GROUP BY session_id
       ) sub ON sm.id = sub.max_id
       ORDER BY sm.created_at DESC`
    );
  }
};

module.exports = supportService;
