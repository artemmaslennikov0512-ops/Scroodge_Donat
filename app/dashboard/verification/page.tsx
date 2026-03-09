"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiUpload, FiCheck, FiAlertCircle } from "react-icons/fi";
import BackButton from "@/components/BackButton";
import { FileUpload } from "@/components/FileUpload";
import { VerificationStatus } from "@/components/VerificationStatus";
import toast from "react-hot-toast";

export default function StreamerVerification() {
  const router = useRouter();
  const { status } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<{
    status: string;
    adminComment?: string | null;
  } | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    passportNumber: "",
    inn: "",
    telegram: "",
    phone: "",
  });
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/auth/streamer-verification")
      .then((res) => res.json())
      .then((data) => data.verification && setVerification(data.verification))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2 && (!passportFile || !selfieFile)) {
      toast.error("Загрузите оба файла");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("fullName", formData.fullName);
      fd.set("passportNumber", formData.passportNumber.replace(/\s/g, ""));
      if (formData.inn) fd.set("inn", formData.inn.replace(/\s/g, ""));
      if (formData.telegram) fd.set("telegram", formData.telegram);
      if (formData.phone) fd.set("phone", formData.phone);
      if (passportFile) fd.set("passportFile", passportFile);
      if (selfieFile) fd.set("selfieFile", selfieFile);

      const res = await fetch("/api/auth/streamer-verification", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка отправки");
      }
      setVerification({ status: "pending" });
      setStep(3);
      toast.success("Заявка отправлена");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (verification?.status === "approved") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <VerificationStatus status="approved" />
          <Link
            href="/dashboard"
            className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl text-white font-bold"
          >
            В личный кабинет
          </Link>
        </div>
      </div>
    );
  }

  if (verification?.status === "rejected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <VerificationStatus
            status="rejected"
            comment={verification.adminComment || undefined}
          />
          <button
            type="button"
            onClick={() => setVerification(null)}
            className="w-full mt-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl font-bold"
          >
            Подать повторно
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Верификация стримера
            </h1>
            <p className="text-gray-400">
              Подтвердите свою личность для статуса верифицированного стримера.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  step >= i ? "bg-pink-600" : "bg-gray-700"
                }`}
              >
                {step > i ? (
                  <FiCheck className="text-white" />
                ) : (
                  <span className="text-white text-sm">{i}</span>
                )}
              </div>
              {i < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > i ? "bg-pink-600" : "bg-gray-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-pink-500/40"
          >
            <div>
              <label className="block text-gray-400 mb-2">Полное имя (как в паспорте)</label>
              <input
                type="text"
                placeholder="Иванов Иван Иванович"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-4 py-3 bg-black/30 border border-pink-500/40 rounded-lg text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Номер паспорта</label>
              <input
                type="text"
                placeholder="00 00 000000"
                value={formData.passportNumber}
                onChange={(e) =>
                  setFormData({ ...formData, passportNumber: e.target.value })
                }
                className="w-full px-4 py-3 bg-black/30 border border-pink-500/40 rounded-lg text-white focus:outline-none focus:border-pink-500"
              />
              <p className="text-xs text-gray-500 mt-1">Серия (4 цифры) и номер (6 цифр)</p>
            </div>
            <div>
              <label className="block text-gray-400 mb-2">ИНН (если есть)</label>
              <input
                type="text"
                placeholder="000000000000"
                value={formData.inn}
                onChange={(e) =>
                  setFormData({ ...formData, inn: e.target.value })
                }
                className="w-full px-4 py-3 bg-black/30 border border-pink-500/40 rounded-lg text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Telegram для связи</label>
              <input
                type="text"
                placeholder="@username"
                value={formData.telegram}
                onChange={(e) =>
                  setFormData({ ...formData, telegram: e.target.value })
                }
                className="w-full px-4 py-3 bg-black/30 border border-pink-500/40 rounded-lg text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Телефон</label>
              <input
                type="tel"
                placeholder="+7 900 123-45-67"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-3 bg-black/30 border border-pink-500/40 rounded-lg text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-pink-500/40"
          >
            <FileUpload
              label="Скан паспорта"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              file={passportFile}
              onChange={setPassportFile}
            />
            <FileUpload
              label="Фото с паспортом (селфи)"
              accept="image/jpeg,image/png,image/jpg"
              file={selfieFile}
              onChange={setSelfieFile}
            />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-pink-500/40"
          >
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="text-3xl text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Заявка отправлена!</h2>
            <p className="text-gray-400 mb-6">
              Мы проверим документы в течение 24 часов. Вы получите уведомление.
            </p>
            <div className="bg-pink-600/20 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                Статус: <span className="text-yellow-400">На рассмотрении</span>
              </p>
            </div>
          </motion.div>
        )}

        {(step === 1 || step === 2) && (
          <p className="text-gray-400 text-sm mt-6 mb-2">
            Нажимая «Продолжить» или «Отправить заявку», вы соглашаетесь с{" "}
            <Link href="/oferta" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline">
              Договором-офертой
            </Link>
            ,{" "}
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline">
              Пользовательским соглашением
            </Link>
            {" "}и{" "}
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline">
              Политикой конфиденциальности
            </Link>
            {" "}и{" "}
            <Link href="/personal-data" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline">
              Политикой обработки персональных данных
            </Link>
            .
          </p>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 && step < 3 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-white"
            >
              Назад
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={step === 1 ? () => setStep(2) : handleSubmit}
              disabled={loading || (step === 1 && !formData.fullName.trim())}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg text-white font-medium ml-auto disabled:opacity-50"
            >
              {loading ? "Отправка..." : step === 1 ? "Продолжить" : "Отправить заявку"}
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg text-white font-medium ml-auto inline-block"
            >
              В личный кабинет
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
