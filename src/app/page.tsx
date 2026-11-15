import { SITE_CONFIG } from "@/constants/site";
import Countdown from "@/components/countdown";
import Image from "next/image";
import TeamCard from "@/components/team-card";
import AmbientBackground from "@/components/ambient-background";
import MouseSpotlight from "@/components/mouse-spotlight";

export default function Home() {
    return (
  <MouseSpotlight>
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b0b] text-white">
  <AmbientBackground />
  <div className="relative z-10">
      <nav className="flex items-center justify-between px-8 py-6">
        <h2 className="text-xl font-bold tracking-wider">
          SAFA <span className="text-green-500">AQSA</span>
        </h2>

        <span className="text-sm text-gray-400">
          SAFA QURAN COLLEGE
        </span>
      </nav>

      <section className="flex min-h-[75vh] flex-col items-center justify-center px-6 text-center">
        <Image
  src="/safa-fest-logo.png"
  alt="SAFA Arts Fest 2K27 Official Logo"
  width={482}
  height={315}
  priority
  className="mb-8 h-auto w-48 md:w-64"
/>
        <p className="mb-6 text-sm tracking-[0.4em] text-green-400">
          {SITE_CONFIG.institution}
        </p>

        <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl">
          {SITE_CONFIG.name}
        </h1>

        <h2 className="mt-8 text-4xl font-bold text-green-400 md:text-6xl">
          {SITE_CONFIG.theme}
        </h2>

        <p className="mt-5 text-lg text-gray-300 md:text-xl">
          {SITE_CONFIG.tagline}
        </p>

        <div className="mt-10">
          <p className="text-xl font-semibold">
            {SITE_CONFIG.date}
          </p>
          <p className="mt-2 text-gray-400">
            {SITE_CONFIG.time} IST
          </p>
        </div>
                <Countdown />

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="/leaderboard"
            className="rounded-lg bg-green-600 px-7 py-3 font-semibold transition-all duration-300 hover:bg-green-500 hover:shadow-[0_0_25px_rgba(22,163,74,0.65)] hover:-translate-y-1"
          >
            Explore Leaderboard
          </a>

          <a
            href="/results"
            className="rounded-lg border border-white/30 px-7 py-3 font-semibold transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_25px_rgba(255,255,255,0.35)] hover:-translate-y-1"
          >
            View Results
          </a>
        </div>
      </section>
      <section className="bg-[#111111] px-6 py-20">
  <div className="mx-auto max-w-5xl">

    <p className="mb-4 text-center text-sm font-semibold tracking-[0.35em] text-green-400">
      THE VISION BEHIND
    </p>

    <h2 className="mb-12 text-center text-4xl font-bold text-white md:text-5xl">
      WAQOOLU
    </h2>

    <div className="space-y-6 text-justify text-base leading-8 text-gray-300 md:text-lg">

      <p>
        We live in an age where truth and falsehood are increasingly intertwined,
        making it difficult for people to distinguish reality from illusion.
        The rapid advancement of Artificial Intelligence (AI), the overwhelming
        influence of social media, and the excessive flow of information through
        news and media platforms often distance people from the truth. In such
        a time, recognising the truth itself has become a great challenge.
        It is therefore essential to understand the pulse of the present age,
        stand firmly for the truth, and transform creativity into a powerful
        means of communicating it.
      </p>

      <p>
        This is where the significance of the SAFA Quran College Arts Fest,
        organised by AQSA, becomes evident. The Holy Qur'an is Al-Furqan —
        the criterion that distinguishes truth from falsehood. Through this
        arts festival, AQSA aims to empower students to understand the challenges
        of the contemporary world through the light of Qur'anic truth and to
        communicate that truth to society through art, creativity, and meaningful
        expression.
      </p>

      <p>
        "WAQOOLU - Understanding the Times, Expressing the Truth" is not merely
        a call for artistic performances; it is a vision to nurture a generation
        that understands its times, recognises contemporary challenges, remains
        firmly rooted in Qur'anic values, and fearlessly expresses the truth
        through the language of art. To move forward with the changing world
        without losing sight of the truth, and to channel creativity towards
        the betterment of society and the propagation of truth — this is the
        mission of WAQOOLU.
      </p>

    </div>
  </div>
</section>
<section className="bg-[#0b0b0b] px-6 py-20">
  <div className="mx-auto max-w-5xl">

    <p className="mb-4 text-center text-sm font-semibold tracking-[0.35em] text-green-400">
      TWO TEAMS. ONE VISION.
    </p>

    <h2 className="mb-12 text-center text-4xl font-bold md:text-5xl">
      MEET THE TEAMS
    </h2>

    <div className="grid gap-8 md:grid-cols-2">

      <TeamCard
  name="FASAHA"
  color="#168343"
  glow="rgba(22,131,67,0.45)"
  description="A team united by creativity, knowledge and determination, ready to express its spirit through the power of art."
/>

      <TeamCard
  name="BALAGHA"
  color="#2463C7"
  glow="rgba(36,99,199,0.45)"
  description="A team driven by talent, unity and passion, ready to make its mark through creativity and expression."
/>

    </div>
  </div>
</section>
</div>
      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-gray-400">
        {SITE_CONFIG.conductedBy}
      </footer>
    </main>
      </MouseSpotlight>
  );
}