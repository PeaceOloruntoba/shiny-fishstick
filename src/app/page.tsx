import { ArrowDown, ArrowRight, Check, Clock3, Sparkles, Star } from "lucide-react";
import { EarlyAccessForm } from "@/components/early-access-form";

const services = [
  {
    number: "01",
    title: "A fresh start",
    description: "A thoughtful clean for the rooms you use every day.",
    note: "Everyday home care",
    icon: Sparkles,
    tone: "peach",
  },
  {
    number: "02",
    title: "A little deeper",
    description: "More time for the details that make a room feel renewed.",
    note: "Extra detail, at your pace",
    icon: Star,
    tone: "sage",
  },
  {
    number: "03",
    title: "Your own rhythm",
    description: "Choose the rooms and priorities that matter most to you.",
    note: "A plan shaped around home",
    icon: Clock3,
    tone: "lilac",
  },
];

const steps = [
  ["01", "Choose your clean", "Tell us about your home and what needs attention."],
  ["02", "We coordinate the details", "Our team confirms availability and keeps you updated."],
  ["03", "Come home to a reset", "Your service follows a clear checklist, with support if plans change."],
];

export default function HomePage() {
  return (
    <main>
      <div className="announcement">
        <span className="announcement-dot" />
        Thoughtful home care, coming soon to select neighbourhoods
        <a href="#booking">Join the early list <ArrowRight size={14} /></a>
      </div>

      <header className="site-header wrap">
        <a className="brand" href="#top" aria-label="HomeOps home">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span>homeops<span className="brand-period">.</span></span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#services">Our services</a>
          <a href="#how-it-works">How it works</a>
          <a href="#our-promise">Our approach</a>
        </nav>
        <a className="button button-dark header-cta" href="#booking">Get early access <ArrowRight size={16} /></a>
      </header>

      <section className="hero wrap" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> A softer landing at the end of the day</div>
          <h1>Make room for<br /><span>what matters.</span></h1>
          <p className="hero-intro">A well-cared-for home changes how the whole day feels. We’re making it easier to get there, one thoughtful clean at a time.</p>
          <div className="hero-actions">
            <a className="button button-coral" href="#booking">Find your kind of clean <ArrowRight size={17} /></a>
            <a className="text-link" href="#how-it-works">See how it works <ArrowDown size={15} /></a>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars" aria-hidden="true"><span>A</span><span>T</span><span>M</span></div>
            <p><strong>A more considered kind of home care</strong><br />Clear details. A real team. Room to breathe.</p>
          </div>
        </div>

        <div className="hero-art" aria-label="Illustration of a calm, sunlit home" role="img">
          <div className="art-sun" />
          <div className="art-window"><div /><div /><div /><div /></div>
          <div className="art-wall-frame"><span>HOME<br />IS A<br />FEELING</span><i /></div>
          <div className="art-sofa"><div className="sofa-back" /><div className="sofa-seat" /><div className="sofa-arm left" /><div className="sofa-arm right" /><div className="sofa-cushion" /></div>
          <div className="art-table"><div className="table-top" /><div className="table-leg" /><div className="table-vase"><i /></div></div>
          <div className="art-plant"><i /><i /><i /><i /><span /></div>
          <div className="art-rug" />
          <div className="art-note"><span className="note-icon"><Check size={15} /></span><span><strong>A little more breathing room</strong><small>That’s the feeling we’re after.</small></span></div>
          <div className="art-caption">THE EVERYDAY RESET <span>✳</span></div>
        </div>
        <div className="hero-asterisk">✳</div>
      </section>

      <section className="ticker" aria-label="Our service principles">
        <div className="ticker-track"><span>GOOD CARE, MADE SIMPLE</span><i>✳</i><span>YOUR HOME, YOUR RHYTHM</span><i>✳</i><span>THOUGHTFUL BY DESIGN</span><i>✳</i><span>GOOD CARE, MADE SIMPLE</span><i>✳</i><span>YOUR HOME, YOUR RHYTHM</span><i>✳</i></div>
      </section>

      <section className="section services-section wrap" id="services">
        <div className="section-heading">
          <div><div className="eyebrow"><span className="eyebrow-line" /> A good place to begin</div><h2>Care that fits<br />the way you <em>live.</em></h2></div>
          <p>Every home is different. Start with the kind of help you need, and we’ll make the next step feel easy.</p>
        </div>
        <div className="service-grid">
          {services.map((service) => {
            const Icon = service.icon;
            return <a className={`service-card ${service.tone}`} href="#booking" key={service.number}>
              <div className="service-card-top"><span>{service.number} / HOME CARE</span><span className="service-icon"><Icon size={19} strokeWidth={1.6} /></span></div>
              <div className="service-illustration"><div className="illustration-shape"><span /><i /><b /></div><span className="service-spark">✳</span></div>
              <div className="service-card-bottom"><div><h3>{service.title}</h3><p>{service.description}</p></div><span className="round-arrow"><ArrowRight size={17} /></span></div>
              <div className="service-note">{service.note}</div>
            </a>;
          })}
        </div>
        <p className="service-footnote">Packages, coverage, timing, and pricing will be confirmed before booking opens.</p>
      </section>

      <section className="promise-section" id="our-promise">
        <div className="promise-inner wrap">
          <div className="promise-art" aria-hidden="true"><div className="promise-circle"><span>GOOD<br />CARE<br /><i>feels like</i><br />COMING<br />HOME</span></div><span className="promise-spark spark-one">✳</span><span className="promise-spark spark-two">✳</span><div className="promise-leaf leaf-one" /><div className="promise-leaf leaf-two" /></div>
          <div className="promise-copy"><div className="eyebrow"><span className="eyebrow-line" /> More than a checklist</div><h2>A home is personal.<br />Your care should be <em>too.</em></h2><p>We’re building a service around the small things that make a big difference: knowing what to expect, having someone to reach, and feeling looked after along the way.</p>
            <ul className="promise-list"><li><span><Check size={14} /></span> Clear service details before you book</li><li><span><Check size={14} /></span> A dedicated team coordinating the service</li><li><span><Check size={14} /></span> A simple way to ask for help if plans change</li></ul>
            <a className="text-link dark-link" href="#how-it-works">Get to know our approach <ArrowRight size={15} /></a>
          </div>
        </div>
      </section>

      <section className="section how-section wrap" id="how-it-works">
        <div className="how-heading"><div className="eyebrow"><span className="eyebrow-line" /> From to-do list to done</div><h2>Three little steps.<br /><em>A lighter day.</em></h2></div>
        <div className="steps-grid">{steps.map(([number, title, detail]) => <div className="step" key={number}><span className="step-number">{number}</span><div className="step-rule" /><h3>{title}</h3><p>{detail}</p></div>)}</div>
        <div className="how-cta"><span>Less to manage. More room to live.</span><a className="button button-dark" href="#booking">Get early access <ArrowRight size={16} /></a></div>
      </section>

      <section className="booking-band" id="booking"><div className="booking-inner wrap"><div><div className="eyebrow"><span className="eyebrow-line" /> Be first to know</div><h2>A little more ease<br />is on its way.</h2><p>We’re preparing our first neighbourhood launch. Leave your details and we’ll share updates as service areas and booking dates are confirmed.</p></div><EarlyAccessForm /></div><div className="booking-spark">✳</div></section>

      <footer className="site-footer wrap"><a className="brand footer-brand" href="#top"><span className="brand-mark"><span /><span /><span /><span /></span><span>homeops<span className="brand-period">.</span></span></a><span className="footer-note">A more considered kind of home care.</span><div className="footer-links"><a href="#services">Services</a><a href="#how-it-works">How it works</a><a href="mailto:hello@homeops.ng">Get in touch</a></div><span className="copyright">© 2026 HomeOps. Name is a working title.</span></footer>
    </main>
  );
}
