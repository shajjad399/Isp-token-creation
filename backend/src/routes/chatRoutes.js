// backend/src/routes/chatRoutes.js
import express from 'express';
import {
  startChat,
  getMyChat,
  getChatById,
  sendMessage,
  markChatRead,
  getQueue,
  getMyActiveChats,
  claimChat,
  closeChat,
  deleteChat
} from '../controllers/chatController.js';
import { auth } from '../middlewares/auth.js';
import { isAgent, isAdmin } from '../middlewares/role.js';
import { validate } from '../middlewares/validate.js';
import {
  startChatSchema,
  sendMessageSchema,
  closeChatSchema
} from '../validators/index.js';

const router = express.Router();

// All chat routes require authentication
router.use(auth);

// ============================================================
// CUSTOMER
// ============================================================
router.post('/', validate(startChatSchema), startChat);
router.get('/mine', getMyChat);

// ============================================================
// AGENT/ADMIN - queue & inbox (must come before /:id routes)
// ============================================================
router.get('/queue', isAgent, getQueue);
router.get('/active', isAgent, getMyActiveChats);
router.patch('/:id/claim', isAgent, claimChat);

// ============================================================
// SHARED (both sides, ownership checked in controller)
// ============================================================
router.get('/:id', getChatById);
router.post('/:id/messages', validate(sendMessageSchema), sendMessage);
router.patch('/:id/read', markChatRead);
router.patch('/:id/close', validate(closeChatSchema), closeChat);
router.delete('/:id', isAdmin, deleteChat);

export default router;