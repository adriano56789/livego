import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import fs from 'fs/promises';
import { InternalServerError } from './errorResponse.js';

// Obter diretório atual em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do transportador de e-mail
const createTransporter = () => {
  // Em produção, use um serviço de e-mail real
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Em desenvolvimento, use o Ethereal Email para testes
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'kayli.keeling@ethereal.email',
      pass: 'wB2hY4rXjKxYc5vGX9',
    },
  });
};

// Carregar template EJS
const loadTemplate = async (templateName, data) => {
  try {
    const templatePath = path.join(
      __dirname,
      '..',
      'views',
      'emails',
      `${templateName}.ejs`
    );
    
    const template = await fs.readFile(templatePath, 'utf-8');
    return ejs.render(template, { 
      ...data,
      appName: process.env.APP_NAME || 'LiveGo',
      appUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      currentYear: new Date().getFullYear()
    });
  } catch (error) {
    console.error('Erro ao carregar o template de e-mail:', error);
    throw new InternalServerError('Falha ao carregar o template de e-mail');
  }
};

/**
 * Envia um e-mail usando o template EJS especificado
 * @param {Object} options - Opções do e-mail
 * @param {string} options.to - Endereço de e-mail do destinatário
 * @param {string} options.subject - Assunto do e-mail
 * @param {string} options.template - Nome do template EJS (sem extensão)
 * @param {Object} options.data - Dados para o template
 * @returns {Promise<Object>} - Informações sobre o e-mail enviado
 */
export const sendEmail = async ({ to, subject, template, data = {} }) => {
  try {
    // Configurações do e-mail
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'LiveGo'}" <${process.env.EMAIL_FROM || 'noreply@livego.com'}>`,
      to,
      subject,
      html: await loadTemplate(template, data),
    };

    // Se estiver em desenvolvimento, exibe o preview no console
    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl({
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html
      });
      
      console.log('Preview URL:', previewUrl);
    }

    // Envia o e-mail
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    
    return info;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw new InternalServerError('Falha ao enviar o e-mail');
  }
};

// Funções específicas para tipos de e-mail

export const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  await sendEmail({
    to: user.email,
    subject: 'Verifique seu endereço de e-mail',
    template: 'verify-email',
    data: {
      name: user.name || user.username,
      verificationUrl,
      token,
    },
  });
};

export const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  await sendEmail({
    to: user.email,
    subject: 'Redefinição de senha',
    template: 'password-reset',
    data: {
      name: user.name || user.username,
      resetUrl,
      token,
      expiresIn: '10 minutos',
    },
  });
};

export const sendPasswordChangedEmail = async (user, ipAddress) => {
  await sendEmail({
    to: user.email,
    subject: 'Senha alterada com sucesso',
    template: 'password-changed',
    data: {
      name: user.name || user.username,
      ipAddress,
      date: new Date().toLocaleString(),
    },
  });
};

export const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Bem-vindo ao LiveGo!',
    template: 'welcome',
    data: {
      name: user.name || user.username,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
    },
  });
};

export const sendAccountLockedEmail = async (user, unlockToken) => {
  const unlockUrl = `${process.env.FRONTEND_URL}/unlock-account?token=${unlockToken}`;
  
  await sendEmail({
    to: user.email,
    subject: 'Sua conta foi bloqueada',
    template: 'account-locked',
    data: {
      name: user.name || user.username,
      unlockUrl,
      ipAddress: user.lastIp,
      date: new Date().toLocaleString(),
    },
  });
};

export const sendNewDeviceLoginEmail = async (user, deviceInfo, ipAddress) => {
  await sendEmail({
    to: user.email,
    subject: 'Novo login detectado',
    template: 'new-device-login',
    data: {
      name: user.name || user.username,
      deviceInfo: {
        browser: deviceInfo.browser || 'Navegador desconhecido',
        os: deviceInfo.os || 'Sistema operacional desconhecido',
        device: deviceInfo.device || 'Dispositivo desconhecido',
      },
      ipAddress,
      date: new Date().toLocaleString(),
      changePasswordUrl: `${process.env.FRONTEND_URL}/change-password`,
    },
  });
};

// Exportação padrão para compatibilidade
const emailService = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendWelcomeEmail,
  sendAccountLockedEmail,
  sendNewDeviceLoginEmail,
};

export default emailService;
