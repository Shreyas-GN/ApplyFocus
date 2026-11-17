const PROBLEMS = [
  {
    num: "01",
    title: "Applying without knowing if you fit",
    desc: "Most job descriptions don't tell you which requirements are firm and which are flexible. You submit and hope.",
  },
  {
    num: "02",
    title: "Your strongest experience stays hidden",
    desc: "Years of relevant work buried across old roles. Without a structured profile, you can't surface what matters most for each opportunity.",
  },
  {
    num: "03",
    title: "Every resume feels like starting from scratch",
    desc: "Adapting your resume for each role means copying, pasting and second-guessing — with no way to know if the changes help.",
  },
  {
    num: "04",
    title: "Positioning skills without guidance",
    desc: "You have transferable skills, but connecting them to what a job description asks for requires analysis you don't have time for.",
  },
  {
    num: "05",
    title: "Applications scattered across tabs and notes",
    desc: "Twenty open applications. No follow-up system. No record of which resume version you used. Everything's everywhere.",
  },
];

export function LandingProblems() {
  return (
    <section className="bg-lp-bg py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* Header */}
        <div className="mb-16">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-lp-accent">
            The problem
          </p>
          <h2 className="mt-4 max-w-[600px] font-display text-[40px] leading-[1.06] text-lp-ink sm:text-[54px]">
            The conventional job search is frustrating. For good reason.
          </h2>
          <p className="mt-5 max-w-[520px] font-ui text-[17px] leading-[1.7] text-lp-body">
            These aren&apos;t personal failings. They&apos;re systemic gaps — and ApplyFocus is built to close them.
          </p>
        </div>

        {/* Problem cards */}
        <div className="grid gap-px bg-lp-border sm:grid-cols-2 lg:grid-cols-3 rounded-2xl overflow-hidden border border-lp-border">
          {PROBLEMS.map((p, i) => (
            <div
              key={p.num}
              className={`bg-lp-surface p-7 sm:p-8 ${i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}`}
            >
              <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-lp-accent/60">
                {p.num}
              </span>
              <h3 className="mt-3 font-ui text-[18px] font-semibold leading-[1.3] text-lp-ink sm:text-[19px]">
                {p.title}
              </h3>
              <p className="mt-3 font-ui text-[14px] leading-[1.7] text-lp-body">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
