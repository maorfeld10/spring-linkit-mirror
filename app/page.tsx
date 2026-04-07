import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 bg-blue-50">
      <h1 className="text-4xl font-bold text-blue-900">
        Spring LinkIt Mirror
      </h1>
      <p className="text-lg text-blue-700">
        Grade 1 ELA &amp; Math Benchmark Practice
      </p>
      <div className="flex gap-6">
        <Link
          href="/student"
          className="rounded-2xl bg-green-500 px-8 py-4 text-xl font-semibold text-white shadow-lg hover:bg-green-600 transition-colors min-h-[64px] flex items-center"
        >
          Start Practice
        </Link>
        <Link
          href="/admin"
          className="rounded-2xl bg-slate-600 px-8 py-4 text-xl font-semibold text-white shadow-lg hover:bg-slate-700 transition-colors min-h-[64px] flex items-center"
        >
          Admin Dashboard
        </Link>
      </div>
    </main>
  );
}
