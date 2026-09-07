import { Resend } from 'resend';

// Initialize Resend client lazily or safely
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Reusable general-purpose email sender using Resend API.
 * Gracefully handles missing API keys and network errors without crashing callers.
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  from,
}: SendEmailOptions): Promise<{ success: boolean; data?: any; error?: any }> => {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn(
        '[EmailService] RESEND_API_KEY is not configured in server/.env. Skipping email dispatch.'
      );
      return { success: false, error: 'RESEND_API_KEY is not configured' };
    }

    // Default sending domain. Resend test domain is 'onboarding@resend.dev'
    const defaultFrom = process.env.RESEND_FROM_EMAIL || 'EcoMarket <onboarding@resend.dev>';
    const sender = from || defaultFrom;

    console.log(`[EmailService] Dispatching email to: ${to} | Subject: "${subject}"`);

    const result = await resend.emails.send({
      from: sender,
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error('[EmailService] Resend returned an error:', result.error);
      return { success: false, error: result.error };
    }

    console.log('[EmailService] Email sent successfully! ID:', result.data?.id);
    return { success: true, data: result.data };
  } catch (err: any) {
    console.error('[EmailService] Exception while sending email via Resend:', err.message || err);
    return { success: false, error: err };
  }
};

/**
 * Generates an on-brand responsive HTML email for order cancellations.
 */
export const buildOrderCancellationHtml = ({
  orderId,
  customerName,
  cancellationReason,
  items,
  total,
  orderUrl,
}: {
  orderId: string;
  customerName?: string;
  cancellationReason?: string | null;
  items: Array<{ title: string; quantity: number; price: number }>;
  total: number | string;
  orderUrl: string;
}): string => {
  const formattedTotal = Number(total).toFixed(2);
  const itemsHtml = items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #F3F4F6;">
        <td style="padding: 10px 0; font-size: 13px; color: #1F2937;">
          <strong>${item.title}</strong>
        </td>
        <td style="padding: 10px 0; font-size: 13px; color: #4B5563; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 0; font-size: 13px; color: #1F2937; text-align: right; font-weight: 600;">
          ₹${(Number(item.price) * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Cancelled</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9FAFB; color: #111827;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #1E3E1A; padding: 24px 32px; text-align: left;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
                🌿 EcoMarket
              </h1>
              <p style="margin: 4px 0 0 0; color: #A7F3D0; font-size: 12px; font-weight: 500;">
                Sustainable Marketplace & Learning
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <div style="background-color: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 6px 0; color: #991B1B; font-size: 16px; font-weight: 700;">
                  Order Cancelled
                </h2>
                <p style="margin: 0; color: #B91C1C; font-size: 13px; line-height: 1.4;">
                  Hello ${customerName || 'Customer'}, your order <strong>#${orderId.slice(0, 13)}</strong> has been cancelled.
                </p>
              </div>

              <!-- Reason Box -->
              ${
                cancellationReason
                  ? `
                <div style="margin-bottom: 24px; padding: 14px 16px; background-color: #F9FAFB; border-left: 4px solid #DC2626; border-radius: 4px;">
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B7280; font-weight: 700; display: block; margin-bottom: 4px;">
                    Reason provided by seller:
                  </span>
                  <span style="font-size: 13px; color: #1F2937; font-style: italic;">
                    "${cancellationReason}"
                  </span>
                </div>
              `
                  : ''
              }

              <!-- Refund Notice -->
              <p style="font-size: 13px; color: #4B5563; line-height: 1.5; margin-bottom: 24px;">
                If you were charged for this transaction, a full refund has been automatically initiated back to your original payment method. Depending on your bank or payment provider, refunds typically reflect within 3–5 business days.
              </p>

              <!-- Item Summary -->
              <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">
                Items in Cancelled Order
              </h3>
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border-top: 1px solid #E5E7EB;">
                <thead>
                  <tr style="border-bottom: 1px solid #E5E7EB;">
                    <th align="left" style="padding: 8px 0; font-size: 11px; color: #6B7280; text-transform: uppercase;">Item</th>
                    <th align="center" style="padding: 8px 0; font-size: 11px; color: #6B7280; text-transform: uppercase;">Qty</th>
                    <th align="right" style="padding: 8px 0; font-size: 11px; color: #6B7280; text-transform: uppercase;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding-top: 12px; font-size: 13px; font-weight: 700; color: #111827;">Total Amount:</td>
                    <td align="right" style="padding-top: 12px; font-size: 15px; font-weight: 800; color: #1E3E1A;">₹${formattedTotal}</td>
                  </tr>
                </tfoot>
              </table>

              <!-- Call to Action -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px;">
                <tr>
                  <td align="center">
                    <a href="${orderUrl}" target="_blank" style="display: inline-block; background-color: #2D5A27; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                      View Order Receipt
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 20px 32px; border-top: 1px solid #E5E7EB; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9CA3AF;">
                Need help or have questions regarding this cancellation? Contact our support team.
              </p>
              <p style="margin: 6px 0 0 0; font-size: 10px; color: #D1D5DB;">
                © ${new Date().getFullYear()} EcoMarket Platform. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

/**
 * Triggers the customer cancellation email notification.
 * Safe to call; guarantees not to throw or interrupt upstream database transactions.
 */
export const sendOrderCancellationEmail = async ({
  customerEmail,
  customerName,
  orderId,
  cancellationReason,
  items,
  total,
}: {
  customerEmail: string;
  customerName?: string;
  orderId: string;
  cancellationReason?: string | null;
  items: Array<{ title: string; quantity: number; price: number }>;
  total: number | string;
}) => {
  if (!customerEmail) {
    console.warn(`[EmailService] No recipient email provided for order #${orderId}`);
    return;
  }

  const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const orderUrl = `${clientBaseUrl}/order/${orderId}`;

  const html = buildOrderCancellationHtml({
    orderId,
    customerName,
    cancellationReason,
    items,
    total,
    orderUrl,
  });

  return await sendEmail({
    to: customerEmail,
    subject: `Your EcoMarket Order #${orderId.slice(0, 8)} Has Been Cancelled`,
    html,
  });
};
