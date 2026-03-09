interface Donation {
  id: string;
  amount: number;
  message?: string | null;
  isAnonymous: boolean;
  createdAt: Date;
}

interface Props {
  donations: Donation[];
}

export function RecentDonations({ donations }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
      <h3 className="text-xl font-bold text-white mb-4">Последние донаты</h3>

      {donations.length === 0 ? (
        <p className="text-pink-200">Пока нет донатов</p>
      ) : (
        <div className="space-y-3">
          {donations.map((donation) => (
            <div
              key={donation.id}
              className="flex justify-between items-center p-3 bg-white/5 rounded-lg"
            >
              <div>
                <p className="text-white font-medium">
                  {donation.isAnonymous ? "Аноним" : "Пользователь"}
                </p>
                {donation.message && (
                  <p className="text-pink-200 text-sm">{donation.message}</p>
                )}
              </div>
              <p className="text-green-400 font-bold">{donation.amount} ₽</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
