import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;
let isConnected = false;

// In-Memory store fallback if MySQL is not yet configured or reachable
const inMemoryStore = {
  users: [
    {
      id: 'usr-demo-deaf-001',
      full_name: 'Alex Rivera',
      email: 'alex.deaf@signbridge.ai',
      // bcrypt hash for 'Password123!'
      password_hash: '$2a$10$pIELCaycj9YQd6uBOlKNJOOCMldhddFnDpzzjc5k.7UjYiyZlUZqG',
      google_id: null,
      role: 'deaf_user',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'usr-demo-hearing-002',
      full_name: 'Sarah Chen',
      email: 'sarah.hearing@signbridge.ai',
      password_hash: '$2a$10$pIELCaycj9YQd6uBOlKNJOOCMldhddFnDpzzjc5k.7UjYiyZlUZqG',
      google_id: null,
      role: 'hearing_user',
      created_at: new Date(),
      updated_at: new Date()
    }
  ],
  sessions: [
    {
      id: 'sess-demo-welcome-001',
      user_id: 'usr-demo-deaf-001',
      title: 'Welcome Demonstration Dialogue',
      status: 'active',
      created_at: new Date(Date.now() - 3600000),
      ended_at: null
    }
  ],
  messages: [
    {
      id: 'msg-demo-001',
      session_id: 'sess-demo-welcome-001',
      sender_role: 'system',
      input_type: 'text',
      raw_content: 'Session initialized',
      final_content: 'SignBridge AI session started. Ready for two-way communication.',
      confidence_score: 1.00,
      timestamp: new Date(Date.now() - 3500000)
    },
    {
      id: 'msg-demo-002',
      session_id: 'sess-demo-welcome-001',
      sender_role: 'deaf_user',
      input_type: 'sign_ai',
      raw_content: 'HELLO MEET NICE',
      final_content: 'Hello! It is very nice to meet you.',
      confidence_score: 0.94,
      timestamp: new Date(Date.now() - 3000000)
    },
    {
      id: 'msg-demo-003',
      session_id: 'sess-demo-welcome-001',
      sender_role: 'hearing_user',
      input_type: 'voice_stt',
      raw_content: 'Hello! Nice to meet you too. How can I help you today?',
      final_content: 'Hello! Nice to meet you too. How can I help you today?',
      confidence_score: 0.98,
      timestamp: new Date(Date.now() - 2500000)
    }
  ]
};

export const initializeDatabase = async () => {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'signbridge_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    isConnected = true;
    console.log(`[DB] Connected successfully to MySQL (${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`);
  } catch (error) {
    isConnected = false;
    console.warn(`[DB WARNING] MySQL connection could not be established: ${error.message}`);
    console.info(`[DB NOTICE] Operating in high-fidelity In-Memory Mock Mode. You can test all routes, auth, and sessions without an active MySQL server.`);
  }
};

export const getDbStatus = () => ({
  isConnected,
  isInMemory: !isConnected,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'signbridge_db'
});

export const getPool = () => pool;
export const getMemoryStore = () => inMemoryStore;
