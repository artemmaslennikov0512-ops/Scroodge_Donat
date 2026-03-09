"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { FiLock, FiKey, FiCheckCircle, FiMail } from "react-icons/fi";

export default function SecurityForm() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorSecret] = useState("JBSWY3DPEHPK3PXP");
  const [passwordChangeSent, setPasswordChangeSent] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  const onRequestPasswordChange = async () => {
    setPasswordChangeLoading(true);
    try {
      const res = await fetch("/api/user/request-password-change", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setPasswordChangeSent(true);
        toast.success(json.message || "Ссылка отправлена на вашу почту");
      } else {
        toast.error(json.error || "Не удалось отправить письмо");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const enableTwoFactor = () => {
    setShowTwoFactorSetup(true);
  };

  const confirmTwoFactor = () => {
    toast.success("2FA включена (демо)");
    setTwoFactorEnabled(true);
    setShowTwoFactorSetup(false);
  };

  return (
    <div className="space-y-8">
      <div className="bg-black/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FiLock />
          Смена пароля
        </h3>
        <p className="text-gray-400 mb-4">
          Для смены пароля на вашу почту будет отправлена ссылка. Перейдите по ней и задайте новый пароль. Вход по логину и паролю остаётся без подтверждения почты.
        </p>
        {passwordChangeSent ? (
          <div className="flex items-center gap-2 text-green-400">
            <FiMail />
            <span>Письмо отправлено. Проверьте почту (и папку «Спам»). Ссылка действительна 1 час.</span>
            <button
              type="button"
              onClick={() => setPasswordChangeSent(false)}
              className="ml-2 text-sm text-pink-400 hover:underline"
            >
              Отправить снова
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onRequestPasswordChange}
            disabled={passwordChangeLoading}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg text-white font-medium hover:shadow-lg transition disabled:opacity-50"
          >
            {passwordChangeLoading ? "Отправка…" : "Отправить ссылку на почту"}
          </button>
        )}
      </div>

      <div className="bg-black/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FiKey />
          Двухфакторная аутентификация
        </h3>
        {twoFactorEnabled ? (
          <div className="flex items-center gap-2 text-green-400">
            <FiCheckCircle />
            <span>2FA включена (демо)</span>
            <button
              type="button"
              onClick={() => setTwoFactorEnabled(false)}
              className="ml-4 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30"
            >
              Отключить
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 mb-4">
              Защитите свой аккаунт с помощью двухфакторной аутентификации
            </p>
            {!showTwoFactorSetup ? (
              <button
                type="button"
                onClick={enableTwoFactor}
                className="px-4 py-2 bg-pink-600/20 border border-pink-500/40 rounded-lg text-pink-400 hover:bg-pink-600/30"
              >
                Включить 2FA
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-300">
                  Отсканируйте QR-код в приложении Google Authenticator:
                </p>
                <div className="p-4 bg-white rounded-lg inline-block">
                  <div className="w-48 h-48 bg-gray-300 flex items-center justify-center text-black rounded">
                    QR-код (демо)
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Или введите секретный ключ: <code className="bg-black/30 px-1 rounded">{twoFactorSecret}</code>
                </p>
                <div>
                  <input
                    type="text"
                    placeholder="Введите код из приложения"
                    className="w-full px-4 py-2 bg-black/30 border border-pink-500/40 rounded-lg text-white mb-2"
                  />
                  <button
                    type="button"
                    onClick={confirmTwoFactor}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg text-white"
                  >
                    Подтвердить
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
