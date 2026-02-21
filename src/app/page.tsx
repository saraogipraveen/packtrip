import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center text-center">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
          PackTrip
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8">
          The ultimate trip planner and CRM. Organize groups, build itineraries, and split expenses all in one place.
        </p>
      </main>
    </div>
  );
}
