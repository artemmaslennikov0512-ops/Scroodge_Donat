/**
 * Rate limit для создания донатов: по IP и по streamerId.
 * In-memory хранилище (для одного инстанса). Для нескольких инстансов — Redis.
 */

const IP_WINDOW_MS = 15 * 60 * 1000; // 15 мин
const IP_MAX_REQUESTS = 60;
const STREAMER_WINDOW_MS = 15 * 60 * 1000;
const STREAMER_MAX_REQUESTS = 30;

type Entry = { count: number; resetAt: number };

const ipStore = new Map<string, Entry>();
const streamerStore = new Map<string, Entry>();

function cleanup(store: Map<string, Entry>) {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function checkLimit(store: Map<string, Entry>, key: string, windowMs: number, max: number): boolean {
  cleanup(store);
  const now = Date.now();
  let entry = store.get(key);
  if (!entry) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return true;
  }
  if (entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export function checkDonationCreateRateLimit(ip: string, streamerId: string): { allowed: boolean; reason?: string } {
  if (!checkLimit(ipStore, ip, IP_WINDOW_MS, IP_MAX_REQUESTS)) {
    return { allowed: false, reason: "Слишком много запросов с вашего IP. Попробуйте позже." };
  }
  if (!checkLimit(streamerStore, streamerId, STREAMER_WINDOW_MS, STREAMER_MAX_REQUESTS)) {
    return { allowed: false, reason: "Слишком много донатов этому стримеру. Попробуйте позже." };
  }
  return { allowed: true };
}

// Админ-логин: защита от перебора пароля
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_MAX_ATTEMPTS = 5;
const adminLoginStore = new Map<string, Entry>();

export function checkAdminLoginRateLimit(ip: string): { allowed: boolean; reason?: string } {
  if (!checkLimit(adminLoginStore, ip, ADMIN_LOGIN_WINDOW_MS, ADMIN_LOGIN_MAX_ATTEMPTS)) {
    return { allowed: false, reason: "Слишком много попыток входа. Попробуйте через 15 минут." };
  }
  return { allowed: true };
}

// Регистрация: защита от массовой регистрации
const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 ч
const REGISTER_MAX_PER_IP = 5;
const registerStore = new Map<string, Entry>();

export function checkRegisterRateLimit(ip: string): { allowed: boolean; reason?: string } {
  if (!checkLimit(registerStore, ip, REGISTER_WINDOW_MS, REGISTER_MAX_PER_IP)) {
    return { allowed: false, reason: "Слишком много регистраций с вашего IP. Попробуйте позже." };
  }
  return { allowed: true };
}

// Сброс пароля (forgot-password): защита от перебора и спама
const FORGOT_PW_WINDOW_MS = 60 * 60 * 1000;
const FORGOT_PW_MAX_PER_IP = 3;
const forgotPwStore = new Map<string, Entry>();

export function checkForgotPasswordRateLimit(ip: string): { allowed: boolean; reason?: string } {
  if (!checkLimit(forgotPwStore, ip, FORGOT_PW_WINDOW_MS, FORGOT_PW_MAX_PER_IP)) {
    return { allowed: false, reason: "Слишком много запросов. Попробуйте через час." };
  }
  return { allowed: true };
}

// Запрос ссылки на смену пароля (авторизованный пользователь)
const REQUEST_PW_CHANGE_WINDOW_MS = 60 * 60 * 1000;
const REQUEST_PW_CHANGE_MAX_PER_USER = 3;
const requestPwChangeStore = new Map<string, Entry>();

export function checkRequestPasswordChangeRateLimit(userId: string): { allowed: boolean; reason?: string } {
  if (!checkLimit(requestPwChangeStore, userId, REQUEST_PW_CHANGE_WINDOW_MS, REQUEST_PW_CHANGE_MAX_PER_USER)) {
    return { allowed: false, reason: "Слишком много запросов. Попробуйте через час." };
  }
  return { allowed: true };
}
