// backend/src/routes/ticketRoutes.js
import express from 'express';
import { 
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  assignTicket,
  changeStatus,
  addComment,
  getDashboardStats
} from '../controllers/ticketController.js';
import { auth } from '../middlewares/auth.js';
import { role } from '../middlewares/role.js';
import { validate } from '../middlewares/validate.js';
import { 
  createTicketSchema, 
  updateTicketSchema,
  assignTicketSchema,
  changeStatusSchema,
  addCommentSchema
} from '../validators/ticketValidator.js';

const router = express.Router();

// All ticket routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Create a new ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [internet, iptv, billing, technical, other]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', validate(createTicketSchema), createTicket);

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: Get all tickets with filters
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in-progress, resolved, closed]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [internet, iptv, billing, technical, other]
 *         description: Filter by category
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assigned agent ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, description, ticketId
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: Tickets fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', getTickets);

/**
 * @swagger
 * /api/tickets/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket fetched successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Ticket not found
 */
router.get('/:id', getTicketById);

/**
 * @swagger
 * /api/tickets/{id}:
 *   put:
 *     summary: Update ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [internet, iptv, billing, technical, other]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *     responses:
 *       200:
 *         description: Ticket updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Ticket not found
 */
router.put('/:id', validate(updateTicketSchema), updateTicket);

/**
 * @swagger
 * /api/tickets/{id}:
 *   delete:
 *     summary: Delete ticket (Admin only)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Ticket not found
 */
router.delete('/:id', role(['admin']), deleteTicket);

/**
 * @swagger
 * /api/tickets/{id}/assign:
 *   patch:
 *     summary: Assign ticket to agent (Admin only)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignedTo
 *             properties:
 *               assignedTo:
 *                 type: string
 *                 description: Agent user ID
 *     responses:
 *       200:
 *         description: Ticket assigned successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Ticket or agent not found
 */
router.patch('/:id/assign', role(['admin']), validate(assignTicketSchema), assignTicket);

/**
 * @swagger
 * /api/tickets/{id}/status:
 *   patch:
 *     summary: Change ticket status
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in-progress, resolved, closed]
 *               resolution:
 *                 type: string
 *                 description: Required when resolving
 *     responses:
 *       200:
 *         description: Status changed successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Ticket not found
 */
router.patch('/:id/status', validate(changeStatusSchema), changeStatus);

/**
 * @swagger
 * /api/tickets/{id}/comments:
 *   post:
 *     summary: Add comment to ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               isInternal:
 *                 type: boolean
 *                 description: Internal note (agent/admin only)
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Ticket not found
 */
router.post('/:id/comments', validate(addCommentSchema), addComment);

export default router;