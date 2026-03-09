"use client";

import { FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";

interface VerificationStatusProps {
  status: "pending" | "approved" | "rejected";
  comment?: string;
}

export function VerificationStatus({ status, comment }: VerificationStatusProps) {
  if (status === "approved") {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCheckCircle className="text-4xl text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Верификация пройдена</h2>
        <p className="text-gray-400">
          Ваш аккаунт стримера верифицирован. Вам доступны все возможности платформы.
        </p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-red-500/30 text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiXCircle className="text-4xl text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Заявка отклонена</h2>
        <p className="text-gray-400 mb-4">
          К сожалению, ваша заявка на верификацию не была одобрена.
        </p>
        {comment && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-300">
              <strong className="text-red-400">Причина:</strong> {comment}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-yellow-500/30 text-center">
      <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <FiClock className="text-4xl text-yellow-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">На рассмотрении</h2>
      <p className="text-gray-400">
        Ваша заявка проверяется. Мы уведомим вас о результате.
      </p>
    </div>
  );
}
