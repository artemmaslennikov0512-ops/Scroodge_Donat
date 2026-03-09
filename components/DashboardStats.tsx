interface Props {
  balance: number;
  totalDonations: number;
  donationsCount: number;
  isVerified: boolean;
  isStreamer: boolean;
}

export function DashboardStats({
  balance,
  totalDonations,
  donationsCount,
  isVerified,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
        <p className="text-pink-200 text-sm">Баланс</p>
        <p className="text-2xl font-bold text-white">{balance.toLocaleString()} ₽</p>
      </div>

      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
        <p className="text-pink-200 text-sm">Всего донатов</p>
        <p className="text-2xl font-bold text-white">{totalDonations.toLocaleString()} ₽</p>
      </div>

      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
        <p className="text-pink-200 text-sm">Количество</p>
        <p className="text-2xl font-bold text-white">{donationsCount}</p>
      </div>

      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
        <p className="text-pink-200 text-sm">Статус</p>
        <p className="text-xl font-bold text-white">
          {isVerified ? "✅ Верифицирован" : "⏳ На верификации"}
        </p>
      </div>
    </div>
  );
}
