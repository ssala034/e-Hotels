import Link from "next/link";

export default function Home() {
  return (
    <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-black px-6 py-16">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center shadow-sm">
        <h1 className="text-3xl font-semibold leading-tight text-zinc-100 sm:text-4xl">
          The best online hotel booking system
        </h1>
        <p className="mt-4 text-base text-zinc-300 sm:text-lg">
          Find your next stay in minutes with a simple and friendly booking experience.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-zinc-100 px-6 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-300"
        >
          Get Start
        </Link>
      </div>
    </section>
  );
}
