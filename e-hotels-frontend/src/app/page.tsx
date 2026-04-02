import Link from "next/link";

export default function Home() {
  return (
    <section className="relative flex min-h-[calc(100vh-8rem)] items-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-2xl text-left md:pl-12 lg:pl-20">
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            The best online hotel booking system
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-200 sm:text-lg">
            Find your next stay in minutes with a simple and friendly booking experience.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-sky-200 px-6 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-100"
          >
            Get Start
          </Link>
        </div>
      </div>
    </section>
  );
}
