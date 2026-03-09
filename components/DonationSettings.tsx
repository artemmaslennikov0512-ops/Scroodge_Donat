interface UserSettings {
  id: string;
}

interface Props {
  settings: UserSettings | null;
}

export function DonationSettings({ settings }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
      <h3 className="text-xl font-bold text-white mb-4">Настройки донатов</h3>
      {settings ? (
        <p className="text-pink-200 text-sm">
          Настройки алертов и способов приёма можно будет изменить здесь.
        </p>
      ) : (
        <p className="text-pink-200 text-sm">Настройки по умолчанию</p>
      )}
    </div>
  );
}
