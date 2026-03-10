/**
 * Отправка писем: верификация email, одобрение/отклонение верификации стримера.
 * При отсутствии SMTP в dev логирует ссылку в консоль.
 */

import nodemailer from "nodemailer";
import { getBaseUrl, getSmtpFrom, getNodeEnv } from "@/lib/config";

const APP_NAME = "ScroogeDonat";

/** Проверка, что SMTP настроен под Mail.ru (smtp.mail.ru). */
function isMailRu(): boolean {
  const host = process.env.SMTP_HOST?.toLowerCase();
  return host === "smtp.mail.ru" || host?.endsWith(".mail.ru") === true;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  const portNum = port ? Number(port) : 465;
  return nodemailer.createTransport({
    host,
    port: portNum,
    secure: portNum === 465,
    ...(isMailRu() && { tls: { rejectUnauthorized: true } }),
    auth: { user, pass },
  });
}

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  devLog?: string;
};

async function sendMailIfConfigured(options: SendMailOptions): Promise<void> {
  const { to, subject, html, devLog } = options;
  const transporter = getTransporter();
  const from = getSmtpFrom(process.env.SMTP_USER);
  if (transporter) {
    await transporter.sendMail({ from, to, subject, html });
  } else if (getNodeEnv() === "development" && devLog !== undefined) {
    // eslint-disable-next-line no-console
    console.log("[dev]", devLog);
  } else {
    // В production без SMTP письма не уходят — логируем, чтобы было видно в docker compose logs
    console.warn(
      "[email] SMTP не настроен (SMTP_HOST, SMTP_USER, SMTP_PASSWORD в .env на сервере). Письмо не отправлено:",
      { to, subject: subject.slice(0, 50) }
    );
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${getBaseUrl()}/api/auth/verify-email?token=${token}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%); margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 24px; padding: 40px; }
        h1 { font-size: 32px; font-weight: bold; margin-bottom: 16px; background: linear-gradient(135deg, #38bdf8, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p { color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }
        .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(139, 92, 246, 0.2); font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Добро пожаловать в ${APP_NAME}! 🚀</h1>
        <p>Подтвердите ваш email, чтобы начать получать донаты и использовать все возможности платформы.</p>
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Подтвердить email</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">Если кнопка не работает, скопируйте ссылку:<br><span style="color: #8b5cf6;">${verificationUrl}</span></p>
        <p style="font-size: 14px; color: #6b7280;">Ссылка действительна 24 часа. Если вы не регистрировались на ${APP_NAME}, проигнорируйте это письмо.</p>
        <div class="footer"><p>© ${new Date().getFullYear()} ${APP_NAME}.</p></div>
      </div>
    </body>
    </html>
  `;
  await sendMailIfConfigured({
    to: email,
    subject: `Подтверждение email на ${APP_NAME}`,
    html,
    devLog: `Verification email: ${email} Link: ${verificationUrl}`,
  });
}

export async function sendVerificationApprovedEmail(
  email: string,
  username: string
): Promise<void> {
  const url = `${getBaseUrl()}/dashboard`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%); margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 24px; padding: 40px; }
        .badge { background: linear-gradient(135deg, #22c55e, #10b981); color: white; padding: 8px 16px; border-radius: 100px; display: inline-block; margin-bottom: 20px; }
        .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; text-decoration: none; border-radius: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">✓ Верификация пройдена</div>
        <h1>Поздравляем, ${username}! 🎉</h1>
        <p>Ваш аккаунт стримера успешно верифицирован. Теперь вам доступны все функции платформы.</p>
        <ul style="color: #9ca3af; margin-bottom: 30px;">
          <li>✅ Повышенный лимит на вывод</li>
          <li>✅ Доверие зрителей (бейдж верификации)</li>
          <li>✅ Доступ к эксклюзивным алертам</li>
          <li>✅ Приоритетная поддержка</li>
        </ul>
        <div style="text-align: center;">
          <a href="${url}" class="button">Перейти в кабинет</a>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendMailIfConfigured({
    to: email,
    subject: "Верификация стримера пройдена!",
    html,
    devLog: `Verification approved email: ${email}`,
  });
}

export async function sendVerificationRejectedEmail(
  email: string,
  username: string,
  reason: string
): Promise<void> {
  const url = `${getBaseUrl()}/dashboard/verification`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%); margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 24px; padding: 40px; }
        .reason { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 16px; margin: 20px 0; }
        .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; text-decoration: none; border-radius: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Заявка на верификацию отклонена</h1>
        <p>Здравствуйте, ${username}. К сожалению, ваша заявка на верификацию стримера была отклонена.</p>
        <div class="reason">
          <strong style="color: #ef4444;">Причина:</strong>
          <p style="color: #9ca3af; margin-top: 8px;">${reason}</p>
        </div>
        <p style="color: #9ca3af;">Вы можете подать заявку повторно, исправив указанные замечания.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${url}" class="button">Подать повторно</a>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendMailIfConfigured({
    to: email,
    subject: "Заявка на верификацию отклонена",
    html,
    devLog: `Verification rejected email: ${email} Reason: ${reason}`,
  });
}

/** Письмо со ссылкой для смены пароля (из личного кабинета). Тот же формат ссылки, что и сброс. */
export async function sendPasswordChangeEmail(email: string, resetUrl: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%); margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 24px; padding: 40px; }
        h1 { font-size: 24px; color: #8b5cf6; margin-bottom: 16px; }
        p { color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }
        .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(139, 92, 246, 0.2); font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Смена пароля</h1>
        <p>Вы запросили смену пароля в личном кабинете. Нажмите кнопку ниже, чтобы задать новый пароль. Ссылка действительна 1 час.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" class="button">Задать новый пароль</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">Если вы не запрашивали смену пароля, проигнорируйте это письмо. Пароль не изменится.</p>
        <p style="font-size: 14px; color: #6b7280;">Ссылка: ${resetUrl}</p>
        <div class="footer"><p>© ${new Date().getFullYear()} ScroogeDonat.</p></div>
      </div>
    </body>
    </html>
  `;
  await sendMailIfConfigured({
    to: email,
    subject: "Смена пароля — ScroogeDonat",
    html,
    devLog: `Password change email: ${email} Link: ${resetUrl}`,
  });
}

/** Письмо со ссылкой для сброса пароля. При отсутствии SMTP в dev логирует ссылку в консоль. */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%); margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(34, 211, 238, 0.3); border-radius: 24px; padding: 40px; }
        h1 { font-size: 24px; color: #22d3ee; margin-bottom: 16px; }
        p { color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }
        .button { display: inline-block; padding: 16px 32px; background: #22d3ee; color: #0a0a0f; text-decoration: none; border-radius: 12px; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(34, 211, 238, 0.2); font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Сброс пароля</h1>
        <p>Вы запросили сброс пароля. Нажмите кнопку ниже, чтобы задать новый пароль. Ссылка действительна 1 час.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" class="button">Задать новый пароль</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">Если вы не запрашивали сброс, проигнорируйте это письмо. Пароль не изменится.</p>
        <p style="font-size: 14px; color: #6b7280;">Ссылка: ${resetUrl}</p>
        <div class="footer"><p>© ${new Date().getFullYear()} ${APP_NAME}.</p></div>
      </div>
    </body>
    </html>
  `;
  await sendMailIfConfigured({
    to: email,
    subject: `Сброс пароля — ${APP_NAME}`,
    html,
    devLog: `Password reset email: ${email} Link: ${resetUrl}`,
  });
}
