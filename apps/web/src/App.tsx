import { useState } from 'react';
import './index.css';

const FEATURES = [
  {
    icon: '🎯',
    title: 'Curated for you',
    desc: 'Tell us what you love and we surface events that actually match your vibe — not just whatever is nearby.',
  },
  {
    icon: '🔒',
    title: 'Real people only',
    desc: 'Every host is verified. Every attendee is vouched. No bots, no flakes, no cringe.',
  },
  {
    icon: '✨',
    title: 'Small groups, big memories',
    desc: 'Intimate sizes — 2 to 50 people — so you actually meet someone, not just stand in a crowd.',
  },
  {
    icon: '💬',
    title: 'Group chat included',
    desc: 'Connect with your crew before and after. Relive the night. Plan the next one.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Pick your interests',
    desc: 'Wine, hiking, board games, cooking classes — choose what you love and we do the rest.',
  },
  {
    step: '02',
    title: 'Browse your feed',
    desc: 'A scroll of real events near you, organized by tonight, this weekend, or whenever.',
  },
  {
    step: '03',
    title: 'Request to join',
    desc: 'Send a quick request. The host reviews and approves. Everyone stays intentional.',
  },
  {
    step: '04',
    title: 'Show up. Have fun.',
    desc: 'Attend the event, meet cool people, and build memories that actually last.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Sofia R.',
    city: 'Toronto',
    avatar: '🧡',
    text: "I moved to a new city and was terrified of not knowing anyone. GoDo had me at a wine night within three days. I've been back every week.",
  },
  {
    name: 'Marcus T.',
    city: 'New York',
    avatar: '💙',
    text: 'Finally an app that gets it. Small groups, vetted hosts, no awkward huge parties. Just genuinely fun evenings.',
  },
  {
    name: 'Priya M.',
    city: 'Miami',
    avatar: '💚',
    text: "I've hosted six events on GoDo. Every attendee shows up excited. The quality of connection is unlike anything else.",
  },
];

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <span className="text-2xl font-black text-[#3882F6] tracking-tight">GoDo</span>
        <div className="hidden sm:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
          <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          <a href="#testimonials" className="hover:text-gray-900 transition-colors">Stories</a>
        </div>
        <a
          href="#waitlist"
          className="bg-[#3882F6] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#2563EB] transition-colors"
        >
          Join Waitlist
        </a>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[#3882F6]/5 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#E8F0FE] text-[#3882F6] text-sm font-semibold px-4 py-2 rounded-full mb-8">
          <span>🎉</span>
          <span>Now open in Toronto, New York & Miami</span>
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-tight tracking-tight mb-6">
          Find your people.<br />
          <span className="text-[#3882F6]">Do more stuff.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          GoDo connects you with real people doing real things nearby — wine nights, hikes, cooking classes, chill hangs. No algorithms. No awkward DMs. Just good times.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <a
            href="#waitlist"
            className="bg-[#3882F6] text-white text-base font-semibold px-8 py-4 rounded-full hover:bg-[#2563EB] transition-colors shadow-lg shadow-blue-200"
          >
            Join the Waitlist
          </a>
          <a
            href="#how-it-works"
            className="bg-gray-100 text-gray-700 text-base font-semibold px-8 py-4 rounded-full hover:bg-gray-200 transition-colors"
          >
            See how it works →
          </a>
        </div>
        <PhoneMockup />
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative flex justify-center">
      <div className="relative w-[280px] sm:w-[320px]">
        <div className="absolute -top-6 -left-24 w-52 h-52 bg-[#3882F6]/10 rounded-3xl rotate-12 blur-sm hidden lg:block" />
        <div className="absolute -bottom-8 -right-20 w-40 h-40 bg-purple-100 rounded-3xl -rotate-12 blur-sm hidden lg:block" />
        <div className="relative bg-gray-900 rounded-[44px] p-3 shadow-2xl shadow-gray-400/40">
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-full z-10" />
          <div className="bg-white rounded-[36px] overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
            <AppScreen />
          </div>
        </div>
      </div>
    </div>
  );
}

function AppScreen() {
  return (
    <div className="h-full bg-white flex flex-col text-left overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-10 pb-3">
        <span className="text-xl font-black text-[#3882F6]">GoDo</span>
        <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-[9px] font-bold">3</span>
        </div>
      </div>
      <div className="flex gap-2 px-4 pb-3">
        {['All', 'Tonight', 'Weekend'].map((f, i) => (
          <span
            key={f}
            className={`text-[10px] font-semibold px-3 py-1 rounded-full ${
              i === 0 ? 'bg-[#3882F6] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f}
          </span>
        ))}
      </div>
      <div className="flex-1 px-4 space-y-3 overflow-hidden">
        <MockCard
          title="Wine Night 🍷"
          label="Tonight at 7 PM"
          loc="Downtown"
          price="Free"
          attending={4}
          spots={2}
          color="bg-rose-100"
        />
        <MockCard
          title="Morning Hike 🥾"
          label="Sat at 8 AM"
          loc="High Park"
          price="$5"
          attending={8}
          spots={4}
          color="bg-green-100"
        />
      </div>
      <div className="pb-4 px-4 pt-2 flex justify-around items-center border-t border-gray-100">
        {['🏠', '🗺️', '＋', '💬', '👤'].map((icon, i) => (
          <span
            key={i}
            className={`text-base ${i === 2 ? 'bg-[#3882F6] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm' : ''}`}
          >
            {icon}
          </span>
        ))}
      </div>
    </div>
  );
}

function MockCard({
  title,
  label,
  loc,
  price,
  attending,
  spots,
  color,
}: {
  title: string;
  label: string;
  loc: string;
  price: string;
  attending: number;
  spots: number;
  color: string;
}) {
  return (
    <div className="rounded-b-2xl overflow-hidden shadow-md shadow-gray-200/60">
      <div className={`${color} w-full h-28`} />
      <div className="bg-white px-3 pt-2 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-500">{attending} attending • {spots} spots left</span>
          <span className="text-[10px] font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-full">{price}</span>
        </div>
        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{label}</span>
        <p className="text-[12px] font-bold text-gray-900 mt-1 mb-1">{title}</p>
        <p className="text-[10px] text-gray-500 mb-2">📍 {loc}</p>
        <button className="w-full bg-[#3882F6] text-white text-[10px] font-semibold py-1.5 rounded-lg">
          Check it Out
        </button>
      </div>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-[#F8F9FA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Built for real connection</h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Every feature is designed to get you off the app and into the world.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-gray-900 mb-4">From scroll to IRL in minutes</h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">No friction. No awkwardness. Just a clear path to a great night.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {HOW_IT_WORKS.map((step, idx) => (
            <div key={step.step} className="relative text-center">
              {idx < HOW_IT_WORKS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-[#3882F6]/30 to-transparent" />
              )}
              <div className="w-16 h-16 bg-[#E8F0FE] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-xl font-black text-[#3882F6]">{step.step}</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-[#F8F9FA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-gray-900 mb-4">People are loving it</h2>
          <p className="text-lg text-gray-500">Real stories from our early community.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-7 shadow-sm">
              <p className="text-gray-700 text-sm leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <section id="waitlist" className="py-24 bg-[#3882F6]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-4xl font-black text-white mb-4">
          Ready to actually go do stuff?
        </h2>
        <p className="text-blue-100 text-lg mb-10">
          Join thousands of people on the waitlist. We'll let you know the moment GoDo opens in your city.
        </p>
        {submitted ? (
          <div className="bg-white/20 backdrop-blur rounded-2xl p-8">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-white text-xl font-bold">You're on the list!</p>
            <p className="text-blue-100 mt-2 text-sm">We'll reach out when GoDo launches near you.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-5 py-4 rounded-full bg-white text-gray-900 placeholder-gray-400 text-sm font-medium outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-900 text-white text-sm font-bold px-7 py-4 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-60 shrink-0"
            >
              {loading ? '...' : "I'm In"}
            </button>
          </form>
        )}
        <p className="text-blue-200 text-xs mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="text-2xl font-black text-white tracking-tight">GoDo</span>
          <div className="flex gap-8 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="mailto:hello@godo.app" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-xs text-gray-600">© 2025 GoDo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="font-sans">
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <WaitlistSection />
      <Footer />
    </div>
  );
}
