import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export const sendOrderConfirmationEmail = async (
  toEmail: string,
  customerName: string,
  orderNumber: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number
): Promise<void> => {
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name} (x${item.quantity})</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h1 style="color: #4f46e5;">Order Confirmation</h1>
      <p>Hi ${customerName},</p>
      <p>Thank you for your order! We've received your order <strong>#${orderNumber}</strong> and it is being processed.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr>
            <td style="padding: 12px 8px; font-weight: bold;">Grand Total</td>
            <td style="padding: 12px 8px; font-weight: bold; text-align: right;">$${total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      <p>You can view your order status at any time in your profile dashboard.</p>
      <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">ApexCommerce Inc. • All rights reserved.</p>
    </div>
  `;

  if (!transporter) {
    console.log(`[Email Mock] Order confirmation sent to ${toEmail} for order #${orderNumber}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: toEmail,
      subject: `Order Confirmation #${orderNumber} - ApexCommerce`,
      html,
    });
  } catch (err) {
    console.error('[Email Error] Failed to send order confirmation email:', err);
  }
};

export const sendPasswordResetEmail = async (
  toEmail: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #4f46e5;">Password Reset Request</h2>
      <p>You requested a password reset for your ApexCommerce account.</p>
      <p>Click the link below to set a new password. This link expires in 1 hour:</p>
      <div style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Reset My Password
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">If you did not request this, please disregard this email.</p>
    </div>
  `;

  if (!transporter) {
    console.log(`[Email Mock] Password reset link for ${toEmail}: ${resetUrl}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: toEmail,
      subject: 'Reset your ApexCommerce password',
      html,
    });
  } catch (err) {
    console.error('[Email Error] Failed to send password reset email:', err);
  }
};
