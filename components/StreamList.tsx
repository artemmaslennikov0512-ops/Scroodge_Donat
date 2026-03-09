import Link from "next/link";

interface Stream {
  id: string;
  slug: string;
  displayName: string;
}

interface Props {
  streams: Stream[];
}

export function StreamList({ streams }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
      <h3 className="text-xl font-bold text-white mb-4">Мои стримы</h3>

      {streams.length === 0 ? (
        <p className="text-pink-200">Пока нет подключённых стримов</p>
      ) : (
        <ul className="space-y-2">
          {streams.map((stream) => (
            <li key={stream.id}>
              <Link
                href={`/streamer/${stream.slug}`}
                className="text-pink-300 hover:text-white transition"
              >
                {stream.displayName} (@{stream.slug})
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
