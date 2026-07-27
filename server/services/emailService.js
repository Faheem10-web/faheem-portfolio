import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT) || 587;

  if (!user || !pass) {
    console.warn('⚠️ SMTP credentials not found in .env. Nodemailer will fall back to local logging.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  });
};

/**
 * Sends a notification email to the Admin for new contact submissions.
 */
export const sendAdminEmail = async (contactSettings, messageData) => {
  const transporter = createTransporter();
  const dateObj = new Date(messageData.createdAt || Date.now());
  const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const adminEmail = contactSettings.email || 'avfaheeem@gmail.com';
  const subjectTemplate = contactSettings.emailSubject || 'New Portfolio Contact - {{name}}';
  const subject = subjectTemplate.replace(/\{\{\s*name\s*\}\}/gi, messageData.name);

  const textBody = `New Portfolio Contact

Name:
${messageData.name}

Email:
${messageData.email}

Phone:
${messageData.phone || 'Not provided'}

Service:
${messageData.serviceRequired || 'Not specified'}

Subject:
${messageData.subject || 'No Subject'}

Message:
${messageData.message}

Date:
${dateStr}

Time:
${timeStr}`;

  if (!transporter) {
    console.log(`[LOCAL EMAIL SIMULATOR] To Admin (${adminEmail}):\nSubject: ${subject}\n\n${textBody}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${messageData.name} (via Portfolio)" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: subject,
      text: textBody,
      replyTo: messageData.email
    });
    console.log(`📧 Notification email sent to Admin: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending admin notification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sends an automatic confirmation/thank-you email to the visitor.
 */
export const sendVisitorAutoReply = async (contactSettings, messageData) => {
  if (contactSettings.enableAutoReply === false) {
    console.log('ℹ️ Auto-reply is disabled in settings.');
    return { success: true, disabled: true };
  }

  const transporter = createTransporter();
  const visitorEmail = messageData.email;
  const visitorName = messageData.name;
  const adminEmail = contactSettings.email || 'avfaheeem@gmail.com';
  const adminWhatsapp = contactSettings.whatsapp || '+91 7356164236';

  const subject = `Thank you for contacting Faheem A V`;
  const textBody = `Hi ${visitorName},

Thank you for contacting me.

I have successfully received your message.

I will review your enquiry and get back to you as soon as possible.

Regards,

Faheem A V
UI/UX Designer

Email:
${adminEmail}

WhatsApp:
${adminWhatsapp}`;

  if (!transporter) {
    console.log(`[LOCAL EMAIL SIMULATOR] Auto-reply to Visitor (${visitorEmail}):\nSubject: ${subject}\n\n${textBody}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Faheem A V" <${process.env.SMTP_USER}>`,
      to: visitorEmail,
      subject: subject,
      text: textBody
    });
    console.log(`📧 Auto-reply confirmation sent to visitor: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending visitor auto-reply email:', error);
    return { success: false, error: error.message };
  }
};
