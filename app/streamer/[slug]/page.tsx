import { notFound } from "next/navigation";
import { getStreamerBySlug } from "@/lib/composition";
import { DonationWidget } from "@/components/DonationWidget";

type PageProps = { params: Promise<{ slug: string }> };

export default async function StreamerPage({ params }: PageProps) {
  const { slug } = await params;
  const streamer = await getStreamerBySlug(slug);
  if (!streamer) notFound();

  return (
    <main className="min-h-screen bg-[rgb(var(--color-bg-page))] p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text))] mb-2">
          {streamer.displayName}
        </h1>
        <p className="text-[rgb(var(--color-text-muted))] mb-6">@{streamer.slug}</p>
        <DonationWidget
          streamerId={streamer.id}
          minAmount={10}
          maxAmount={100000}
        />
      </div>
    </main>
  );
}
