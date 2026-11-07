import { v4 as uuidv4 } from 'uuid';
import { sessionModel } from '../models/sessionModel.js';
import { messageModel } from '../models/messageModel.js';
import { reconstructSentenceFromGlosses } from '../services/geminiService.js';

export const startSession = async (req, res, next) => {
  try {
    const { title = 'Two-Way Conversation', metadata } = req.body;
    const userId = req.user.id;

    const newSession = await sessionModel.create({
      id: uuidv4(),
      userId,
      title,
      status: 'active',
      metadata
    });

    // Create an initial system welcome turn
    await messageModel.create({
      id: uuidv4(),
      sessionId: newSession.id,
      senderRole: 'system',
      inputType: 'text',
      rawContent: 'Session created',
      finalContent: 'SignBridge AI session started. Ready for two-way communication.',
      confidenceScore: 1.00
    });

    return res.status(201).json({
      success: true,
      message: 'Session started successfully.',
      session: newSession
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await sessionModel.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found.'
      });
    }

    const messages = await messageModel.findBySessionId(id);

    return res.json({
      success: true,
      session,
      messages
    });
  } catch (error) {
    next(error);
  }
};

export const getUserSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessions = await sessionModel.findByUserId(userId);

    return res.json({
      success: true,
      sessions
    });
  } catch (error) {
    next(error);
  }
};

export const postMessage = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const { sender_role, input_type, raw_content, confidence_score } = req.body;
    let { final_content } = req.body;

    const session = await sessionModel.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found.'
      });
    }

    if (!sender_role || !input_type) {
      return res.status(400).json({
        success: false,
        message: 'sender_role and input_type are required.'
      });
    }

    // If final content wasn't directly provided but raw sign tokens were passed, reconstruct!
    if (!final_content && raw_content && input_type === 'sign_ai') {
      const history = await messageModel.findBySessionId(sessionId);
      const reconstructed = await reconstructSentenceFromGlosses(raw_content, history);
      final_content = reconstructed.sentence;
    }

    if (!final_content) {
      return res.status(400).json({
        success: false,
        message: 'final_content or raw_content must be provided.'
      });
    }

    const message = await messageModel.create({
      id: uuidv4(),
      sessionId,
      senderRole: sender_role,
      inputType: input_type,
      rawContent: raw_content || null,
      finalContent: final_content,
      confidenceScore: confidence_score || 0.95
    });

    return res.status(201).json({
      success: true,
      message: 'Message added to session transcript.',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

export const endSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await sessionModel.endSession(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found.'
      });
    }

    return res.json({
      success: true,
      message: 'Session ended successfully.',
      session
    });
  } catch (error) {
    next(error);
  }
};

