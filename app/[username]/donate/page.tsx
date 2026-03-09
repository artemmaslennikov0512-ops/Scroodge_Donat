import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { DonationWidget } from "@/components/DonationWidget";
import GoalProgress from "@/components/goals/GoalProgress";
import SiteBackground from "@/components/SiteBackground";
import { FiArrowLeft, FiTarget } from "react-icons/fi";

type PageProps = { params: Promise<{ username: string }> };

export default async function DonatePage({ params }: PageProps) {
  const { username: segment } = await params;
  const identifier = segment?.trim();
  if (!identifier) notFound();

  // Поддержка и slug стримера, и username пользователя: сначала по slug, затем по username
  const userInclude = {
    goals: {
      where: { isActive: true, isCompleted: false },
      orderBy: { createdAt: "desc" as const },
      take: 1,
    },
  } as const;

  let streamer = await db.streamer.findFirst({
    where: { slug: { equals: identifier, mode: "insensitive" } },
  });
  let user: { id: string; name: string | null; username: string | null; goals: { id: string; title: string; description: string | null; currentAmount: number; targetAmount: number; endDate: Date | null; currency: string }[] } | null = null;

  if (streamer?.userId) {
    const u = await db.user.findFirst({
      where: { id: streamer.userId },
      include: { goals: userInclude.goals },
    });
    if (u) user = u;
  }
  if (!user) {
    const u = await db.user.findFirst({
      where: { username: { equals: identifier, mode: "insensitive" } },
      include: userInclude,
    });
    if (!u) {
      if (!streamer) notFound();
    } else {
      user = u;
      if (!streamer) {
        streamer = await db.streamer.findFirst({
          where: { userId: user.id },
        });
      }
      if (!streamer && user) {
        const { ensureStreamerForUser } = await import("@/lib/streamer");
        const ensured = await ensureStreamerForUser(user.id);
        if (ensured) {
          streamer = await db.streamer.findUnique({ where: { id: ensured.id } });
        }
      }
    }
  }

  const displayUsername = user?.username ?? streamer?.slug ?? segment;
  const activeGoal = user?.goals?.[0] ?? null;

  let donationSettings: Record<string, unknown> = {};
  if (user) {
    try {
      const row = await db.userSettings.findUnique({
        where: { userId: user.id },
        select: { donationSettings: true },
      });
      const raw = row?.donationSettings;
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        donationSettings = raw as Record<string, unknown>;
      }
    } catch {
      // колонка donation_settings может отсутствовать
    }
  }

  const minAmount = typeof donationSettings.minAmount === "number" ? donationSettings.minAmount : 50;
  const maxAmount = typeof donationSettings.maxAmount === "number" ? donationSettings.maxAmount : 100000;
  const allowAnonymous = donationSettings.allowAnonymous !== false;
  const defaultMessage =
    typeof donationSettings.defaultMessage === "string" ? donationSettings.defaultMessage : undefined;
  const donationsEnabled = donationSettings.enabled !== false;

  const displayName = user?.name ?? user?.username ?? streamer?.displayName ?? "Стример";
  const initial = (displayName ?? "?")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative text-white">
      <SiteBackground />

      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-lg border-b border-cyan-500/40 px-6 py-3 relative z-10">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-light">
              <span className="font-bold text-cyan-400">SCROOGE</span>
              <span className="text-white">DONAT</span>
            </span>
          </Link>
          <Link
            href={streamer ? `/streamer/${streamer.slug}` : `/${displayUsername}`}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-cyan-400 transition"
          >
            <FiArrowLeft />
            Назад к профилю
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-24 pb-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-cyan-500/20 border-2 border-cyan-500/50 flex items-center justify-center text-4xl text-cyan-400 font-bold">
              {initial}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{displayName}</h1>
            <p className="text-gray-400">@{displayUsername}</p>
          </div>

          {activeGoal && (
            <div className="panel-hud rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 text-cyan-400 mb-3">
                <FiTarget />
                <h2 className="text-lg font-semibold">Текущая цель сбора</h2>
              </div>
              <GoalProgress
                title={activeGoal.title}
                description={activeGoal.description}
                current={activeGoal.currentAmount}
                target={activeGoal.targetAmount}
                endDate={activeGoal.endDate}
                currency={activeGoal.currency === "RUB" ? "₽" : activeGoal.currency}
                showPercentage
                size="lg"
                variant="cyan"
                className="mb-2"
              />
            </div>
          )}

          {!donationsEnabled ? (
            <div className="panel-hud rounded-xl p-6 text-center text-gray-400">
              Приём донатов временно остановлен стримером.
            </div>
          ) : streamer ? (
            <DonationWidget
              streamerId={streamer.id}
              minAmount={minAmount}
              maxAmount={maxAmount}
              allowAnonymous={allowAnonymous}
              defaultMessage={defaultMessage}
              goalId={activeGoal?.id}
            />
          ) : (
            <div className="panel-hud rounded-xl p-6 text-center text-gray-400">
              Канал ещё не настроен для приёма донатов.
            </div>
          )}

          <p className="text-center text-xs text-gray-500 mt-8">
            <span className="inline-flex items-center gap-1">
              🔒 Безопасный платёж. Деньги поступят стримеру.
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
