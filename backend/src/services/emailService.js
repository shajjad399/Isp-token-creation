// ============================================================
// backend/src/services/emailService.js
// ============================================================
// Description: Complete email service with all email templates
// Version: 3.1.0 (Migrated to Gmail SMTP)
// ============================================================

import env from '../config/env.js';
import logger from '../config/logger.js';
import nodemailer from 'nodemailer';

// Create transporter with Gmail SMTP settings
const transporter = nodemailer.createTransport({
  host: env.email.host || 'smtp.gmail.com',
  port: env.email.port || 587,
  secure: env.email.secure || false,
  auth: {
    user: env.email.user,
    pass: env.email.pass
  },
  // Connection settings
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  // Debug mode for development
  debug: env.isDevelopment || false,
  logger: env.isDevelopment || false
});

class EmailService {
  constructor() {
    this.initialized = false;
    this.init();
  }

  async init() {
    // Check if Gmail SMTP credentials are configured
    if (!env.email?.user || !env.email?.pass) {
      console.warn('⚠️ Email credentials not configured. Email service will be disabled.');
      console.warn('   Please set EMAIL_USER and EMAIL_PASS in environment variables.');
      this.initialized = false;
      return;
    }

    // Verify SMTP connection
    await this.verifyConnection();
  }

  async verifyConnection() {
    try {
      // Verify SMTP connection
      await transporter.verify();
      this.initialized = true;
      logger.info(`✅ Email service initialized successfully (Gmail SMTP - ${env.email.user})`);
      logger.info(`   Host: ${env.email.host}:${env.email.port}`);
      return true;
    } catch (error) {
      console.warn('⚠️ Email service initialization failed:');
      console.warn(`   Error: ${error.message}`);
      console.warn('   Please check your Gmail SMTP credentials.');
      console.warn('   Make sure you are using App Password, not your regular Gmail password.');
      console.warn('   How to generate App Password: https://myaccount.google.com/apppasswords');
      this.initialized = false;
      return false;
    }
  }

  /**
   * Send email using Nodemailer with Gmail SMTP
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    if (!this.initialized) {
      logger.warn('⚠️ Email service not initialized, skipping email send');
      return false;
    }

    // Validate recipient
    if (!to) {
      logger.error('❌ No recipient specified');
      return false;
    }

    try {
      // Prepare mail options
      const mailOptions = {
        from: env.email.from || env.email.user,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject || 'No Subject',
        html: html || '',
        text: text || html?.replace(/<[^>]*>/g, '') || '',
      };

      // Handle attachments for Nodemailer
      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments.map((a) => ({
          filename: a.filename || 'attachment',
          ...(a.content && { content: Buffer.from(a.content, 'base64') }),
          ...(a.path && { path: a.path }),
          ...(a.cid && { cid: a.cid })
        }));
      }

      // Send email using Nodemailer
      const info = await transporter.sendMail(mailOptions);

      logger.info(`📧 Email sent successfully`);
      logger.info(`   To: ${to}`);
      logger.info(`   Subject: ${subject}`);
      logger.info(`   Message ID: ${info.messageId}`);
      logger.info(`   Response: ${info.response || 'OK'}`);
      
      return true;
    } catch (error) {
      logger.error(`❌ Failed to send email`);
      logger.error(`   To: ${to}`);
      logger.error(`   Subject: ${subject}`);
      logger.error(`   Error: ${error.message}`);
      
      // Log additional error details for debugging
      if (error.code) {
        logger.error(`   Error Code: ${error.code}`);
      }
      if (error.response) {
        logger.error(`   SMTP Response: ${error.response}`);
      }
      if (error.responseCode) {
        logger.error(`   SMTP Response Code: ${error.responseCode}`);
      }
      
      // Specific error handling
      if (error.code === 'EAUTH') {
        logger.error('   🔑 Authentication failed. Please check your EMAIL_USER and EMAIL_PASS.');
        logger.error('   Make sure you are using an App Password: https://myaccount.google.com/apppasswords');
      } else if (error.code === 'ECONNECTION' || error.code === 'ESOCKET') {
        logger.error('   🔌 Connection failed. Please check your network and EMAIL_HOST/EMAIL_PORT settings.');
      } else if (error.code === 'ETIMEDOUT') {
        logger.error('   ⏱️ Connection timed out. Please check your internet connection.');
      }
      
      return false;
    }
  }

  // ============================================================
  // SEND VERIFICATION EMAIL
  // ============================================================

  async sendVerificationEmail(email, name, verificationToken) {
    const verifyLink = `${env.frontendUrl}/verify-email?token=${verificationToken}`;
    const subject = 'Verify Your Email - ISP Ticketing System';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1a1a2e; background: #f0f2f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e8edf2; }
          .header .logo { background: #2563eb; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; }
          .header h1 { color: #1a1a2e; font-size: 24px; margin: 16px 0 0; }
          .content { padding: 30px 0; }
          .content h2 { color: #1a1a2e; font-size: 20px; margin: 0 0 8px; }
          .content p { color: #4a4a5a; margin: 8px 0 16px; }
          .button { display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 12px rgba(37,99,235,0.3); transition: background 0.2s; }
          .button:hover { background: #1d4ed8; }
          .warning { background: #fef3c7; padding: 16px 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #f59e0b; }
          .warning p { margin: 0; color: #92400e; }
          .footer { text-align: center; padding-top: 24px; border-top: 1px solid #e8edf2; color: #8a8a9a; font-size: 14px; }
          .footer a { color: #2563eb; text-decoration: none; }
          @media (max-width: 480px) { .container { padding: 24px; } .button { display: block; text-align: center; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐</div>
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for creating an account with <strong>ISP Ticketing System</strong>!</p>
            <p>Please verify your email address to activate your account and start using our services.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyLink}" class="button">Verify Email Address</a>
            </div>
            <div class="warning">
              <p><strong>⚠️ This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <p style="font-size: 14px; color: #6a6a7a;">Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 8px; font-size: 14px; color: #2563eb;">${verifyLink}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ISP Ticketing System. All rights reserved.</p>
            <p>This is an automated message, please do not reply directly.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  // ============================================================
  // SEND WELCOME EMAIL
  // ============================================================

  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to ISP Ticketing System';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1a1a2e; background: #f0f2f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e8edf2; }
          .header .logo { background: #22c55e; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; }
          .header h1 { color: #1a1a2e; font-size: 24px; margin: 16px 0 0; }
          .content { padding: 30px 0; }
          .content h2 { color: #1a1a2e; font-size: 20px; margin: 0 0 8px; }
          .content p { color: #4a4a5a; margin: 8px 0 16px; }
          .button { display: inline-block; background: #22c55e; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 12px rgba(34,197,94,0.3); transition: background 0.2s; }
          .button:hover { background: #16a34a; }
          .footer { text-align: center; padding-top: 24px; border-top: 1px solid #e8edf2; color: #8a8a9a; font-size: 14px; }
          @media (max-width: 480px) { .container { padding: 24px; } .button { display: block; text-align: center; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎉</div>
            <h1>Welcome to ISP Ticketing System</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We're thrilled to have you on board! Your account has been successfully created.</p>
            <p>With ISP Ticketing System, you can:</p>
            <ul style="color: #4a4a5a; padding-left: 20px;">
              <li>✅ Create and track support tickets</li>
              <li>✅ Get real-time updates on your tickets</li>
              <li>✅ Communicate with our support team</li>
              <li>✅ View your complete ticket history</li>
            </ul>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.frontendUrl}/login" class="button">Get Started</a>
            </div>
            <p style="font-size: 14px; color: #6a6a7a;">If you have any questions, feel free to reply to this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ISP Ticketing System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  // ============================================================
  // SEND PASSWORD RESET EMAIL
  // ============================================================

  async sendPasswordResetEmail(email, name, resetToken) {
    const resetLink = `${env.frontendUrl}/reset-password?token=${resetToken}`;
    const subject = 'Reset Your Password - ISP Ticketing System';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1a1a2e; background: #f0f2f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e8edf2; }
          .header .logo { background: #dc2626; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; }
          .header h1 { color: #1a1a2e; font-size: 24px; margin: 16px 0 0; }
          .content { padding: 30px 0; }
          .content h2 { color: #1a1a2e; font-size: 20px; margin: 0 0 8px; }
          .content p { color: #4a4a5a; margin: 8px 0 16px; }
          .button { display: inline-block; background: #dc2626; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 12px rgba(220,38,38,0.3); transition: background 0.2s; }
          .button:hover { background: #b91c1c; }
          .warning { background: #fef3c7; padding: 16px 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #f59e0b; }
          .warning p { margin: 0; color: #92400e; }
          .footer { text-align: center; padding-top: 24px; border-top: 1px solid #e8edf2; color: #8a8a9a; font-size: 14px; }
          @media (max-width: 480px) { .container { padding: 24px; } .button { display: block; text-align: center; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔑</div>
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password for your ISP Ticketing System account.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <div class="warning">
              <p><strong>⚠️ This link will expire in 1 hour.</strong></p>
              <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            <p style="font-size: 14px; color: #6a6a7a;">Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 8px; font-size: 14px; color: #2563eb;">${resetLink}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ISP Ticketing System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  // ============================================================
  // SEND TICKET NOTIFICATION EMAIL
  // ============================================================

  async sendTicketNotification(ticket, eventType) {
    const customer = ticket.customer;
    const email = customer?.email;
    const name = customer?.name || 'Customer';

    if (!email) {
      logger.warn('No customer email found for ticket notification');
      return false;
    }

    let subject, html;

    switch (eventType) {
      case 'created':
        subject = `Ticket #${ticket.ticketId} Created - ${ticket.title}`;
        html = this._ticketCreatedTemplate(name, ticket);
        break;
      case 'updated':
        subject = `Ticket #${ticket.ticketId} Updated - ${ticket.title}`;
        html = this._ticketUpdatedTemplate(name, ticket);
        break;
      case 'assigned':
        subject = `Ticket #${ticket.ticketId} Assigned - ${ticket.title}`;
        html = this._ticketAssignedTemplate(name, ticket);
        break;
      case 'resolved':
        subject = `Ticket #${ticket.ticketId} Resolved - ${ticket.title}`;
        html = this._ticketResolvedTemplate(name, ticket);
        break;
      default:
        return false;
    }

    return this.sendEmail({ to: email, subject, html });
  }

  // ============================================================
  // TICKET TEMPLATES (UNCHANGED)
  // ============================================================

  _ticketCreatedTemplate(name, ticket) {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Ticket Created</title>
      <style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f4f4f4;margin:0;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:10px;padding:30px}.header{background:#2563eb;color:#fff;padding:20px;text-align:center;border-radius:10px 10px 0 0;margin:-30px -30px 20px}.details{background:#f9f9f9;padding:15px;border-radius:8px;margin:15px 0}.button{display:inline-block;background:#2563eb;color:#fff;padding:10px 25px;text-decoration:none;border-radius:5px}.footer{text-align:center;color:#666;font-size:12px;padding-top:20px;border-top:1px solid #eee;margin-top:20px}</style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Ticket Created Successfully</h1></div>
          <h2>Hello ${name},</h2>
          <p>Your ticket has been created successfully.</p>
          <div class="details">
            <p><strong>Ticket ID:</strong> #${ticket.ticketId}</p>
            <p><strong>Title:</strong> ${ticket.title}</p>
            <p><strong>Category:</strong> ${ticket.category}</p>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
            <p><strong>Status:</strong> ${ticket.status}</p>
          </div>
          <p style="text-align:center;margin:20px 0;"><a href="${env.frontendUrl}/tickets/${ticket._id}" class="button">View Ticket</a></p>
          <div class="footer"><p>© ${new Date().getFullYear()} ISP Ticketing System</p></div>
        </div>
      </body>
      </html>
    `;
  }

  _ticketUpdatedTemplate(name, ticket) {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Ticket Updated</title>
      <style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f4f4f4;margin:0;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:10px;padding:30px}.header{background:#f59e0b;color:#fff;padding:20px;text-align:center;border-radius:10px 10px 0 0;margin:-30px -30px 20px}.details{background:#f9f9f9;padding:15px;border-radius:8px;margin:15px 0}.button{display:inline-block;background:#f59e0b;color:#fff;padding:10px 25px;text-decoration:none;border-radius:5px}.footer{text-align:center;color:#666;font-size:12px;padding-top:20px;border-top:1px solid #eee;margin-top:20px}</style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Ticket Updated</h1></div>
          <h2>Hello ${name},</h2>
          <p>Your ticket #${ticket.ticketId} has been updated.</p>
          <div class="details">
            <p><strong>Ticket ID:</strong> #${ticket.ticketId}</p>
            <p><strong>Title:</strong> ${ticket.title}</p>
            <p><strong>Current Status:</strong> ${ticket.status}</p>
          </div>
          <p style="text-align:center;margin:20px 0;"><a href="${env.frontendUrl}/tickets/${ticket._id}" class="button">View Ticket</a></p>
          <div class="footer"><p>© ${new Date().getFullYear()} ISP Ticketing System</p></div>
        </div>
      </body>
      </html>
    `;
  }

  _ticketAssignedTemplate(name, ticket) {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Ticket Assigned</title>
      <style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f4f4f4;margin:0;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:10px;padding:30px}.header{background:#8b5cf6;color:#fff;padding:20px;text-align:center;border-radius:10px 10px 0 0;margin:-30px -30px 20px}.details{background:#f9f9f9;padding:15px;border-radius:8px;margin:15px 0}.button{display:inline-block;background:#8b5cf6;color:#fff;padding:10px 25px;text-decoration:none;border-radius:5px}.footer{text-align:center;color:#666;font-size:12px;padding-top:20px;border-top:1px solid #eee;margin-top:20px}</style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Agent Assigned</h1></div>
          <h2>Hello ${name},</h2>
          <p>An agent has been assigned to your ticket #${ticket.ticketId}.</p>
          <div class="details">
            <p><strong>Ticket ID:</strong> #${ticket.ticketId}</p>
            <p><strong>Title:</strong> ${ticket.title}</p>
            ${ticket.assignedTo ? `<p><strong>Assigned To:</strong> ${ticket.assignedTo.name}</p>` : ''}
          </div>
          <p style="text-align:center;margin:20px 0;"><a href="${env.frontendUrl}/tickets/${ticket._id}" class="button">View Ticket</a></p>
          <div class="footer"><p>© ${new Date().getFullYear()} ISP Ticketing System</p></div>
        </div>
      </body>
      </html>
    `;
  }

  _ticketResolvedTemplate(name, ticket) {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Ticket Resolved</title>
      <style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f4f4f4;margin:0;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:10px;padding:30px}.header{background:#22c55e;color:#fff;padding:20px;text-align:center;border-radius:10px 10px 0 0;margin:-30px -30px 20px}.details{background:#f9f9f9;padding:15px;border-radius:8px;margin:15px 0}.button{display:inline-block;background:#22c55e;color:#fff;padding:10px 25px;text-decoration:none;border-radius:5px}.footer{text-align:center;color:#666;font-size:12px;padding-top:20px;border-top:1px solid #eee;margin-top:20px}</style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Ticket Resolved</h1></div>
          <h2>Hello ${name},</h2>
          <p>Great news! Your ticket #${ticket.ticketId} has been resolved.</p>
          <div class="details">
            <p><strong>Ticket ID:</strong> #${ticket.ticketId}</p>
            <p><strong>Title:</strong> ${ticket.title}</p>
            ${ticket.resolution ? `<p><strong>Resolution:</strong> ${ticket.resolution}</p>` : ''}
            <p><strong>Resolved At:</strong> ${new Date(ticket.resolvedAt).toLocaleString()}</p>
          </div>
          <p style="text-align:center;margin:20px 0;"><a href="${env.frontendUrl}/tickets/${ticket._id}" class="button">View Ticket</a></p>
          <div class="footer"><p>© ${new Date().getFullYear()} ISP Ticketing System</p></div>
        </div>
      </body>
      </html>
    `;
  }
}

// ============================================================
// ✅ EXPORT (UNCHANGED)
// ============================================================

const emailService = new EmailService();

export const sendWelcomeEmail = (email, name) => emailService.sendWelcomeEmail(email, name);
export const sendPasswordResetEmail = (email, name, token) => emailService.sendPasswordResetEmail(email, name, token);
export const sendVerificationEmail = (email, name, token) => emailService.sendVerificationEmail(email, name, token);
export const sendTicketNotification = (ticket, eventType) => emailService.sendTicketNotification(ticket, eventType);
export const sendEmail = (options) => emailService.sendEmail(options);

export default emailService;