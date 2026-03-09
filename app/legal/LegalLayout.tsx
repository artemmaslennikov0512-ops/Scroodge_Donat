import Link from "next/link";
import { FiZap, FiArrowLeft } from "react-icons/fi";

export function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-amber-500/10 py-4">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-amber-400 hover:text-amber-300"
          >
            <FiArrowLeft className="text-lg" />
            На главную
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <FiZap className="text-xl text-amber-400" />
            <span className="font-bold text-amber-400">
              SCROOGE<span className="text-white">DONAT</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-6 py-10 max-w-3xl">
        <h1 className="text-3xl font-bold text-white mb-8 border-b border-amber-500/20 pb-4">
          {title}
        </h1>
        <article className="prose prose-invert prose-amber max-w-none text-gray-300 space-y-6 [&_strong]:text-white [&_a]:text-amber-400 [&_a]:underline [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6">
          {children}
        </article>
      </main>
    </div>
  );
}
