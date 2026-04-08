import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import RoleIcon from '../components/RoleIcon';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'AI Screening Interviews Agents',
      desc: 'Role-specific AI Interviewers trained for technical, behavioral, and cultural assessments.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      title: 'Multi-Role & Multi Region Hiring',
      desc: 'Create interview series and customize each round with each candidate\'s unique characteristics.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Candidate Insights & Analytics',
      desc: 'Optimize the entire hiring process and build a scalable, result-oriented system for your company.'
    },
  ];

  const howItWorks = [
    { step: '01', title: 'Upload Your Resume', desc: 'Share your background and target role for personalized AI interview sessions.' },
    { step: '02', title: 'Practice with AI', desc: 'Engage in realistic interview simulations with our intelligent AI interviewer.' },
    { step: '03', title: 'Get Detailed Reports', desc: 'Receive comprehensive feedback, scores, and actionable insights to improve.' },
  ];

  const stats = [
    { value: '10,000+', label: 'Interviews Conducted' },
    { value: '95%', label: 'Success Rate' },
    { value: '6+', label: 'Role Categories' },
    { value: '24/7', label: 'Always Available' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50 shadow-nav">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-primary tracking-tight">InterviewAI</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Solutions</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Resources</a>
            <a href="#stats" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Customers</a>
            <a href="#cta" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Get A Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            {/* Announcement Banner */}
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full mb-8 bg-white shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">The Future of Hiring: AI Interviews 2026</span>
              <RoleIcon icon="zap" className="w-4 h-4 text-accent animate-pulse" />
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] text-primary max-w-4xl tracking-tight">
              AI interviews for the future of work
            </h1>

            <p className="text-lg text-gray-500 max-w-2xl mt-6 leading-relaxed">
              Orchestrate intelligent interview agents to automate screening, evaluate candidates, and accelerate hiring decisions with speed and precision.
            </p>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => navigate('/register')}
                className="px-7 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/20 text-sm"
              >
                Get A Demo
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-7 py-3.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Start Free Trial
              </button>
            </div>
          </div>

          {/* Hero Visual - Feature Cards Preview */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-surface rounded-2xl border border-gray-200 p-6 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-400 font-medium">Results in hours, not days</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Top talents</p>
                  <p className="text-sm text-gray-500">Smart interviews for smarter hiring decisions.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">S</div>
                  <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-xs font-bold text-green-600">A</div>
                  <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs font-bold text-purple-600">M</div>
                </div>
                <span className="text-xs text-gray-400 font-medium">100+ Participants</span>
              </div>
            </div>

            <div className="bg-primary rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-white/80">Screen 10x more candidates in the same time with AI interviews</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-2xl font-bold">98%</p>
                    <p className="text-xs text-white/60 mt-1">Accuracy Rate</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-2xl font-bold">5min</p>
                    <p className="text-xs text-white/60 mt-1">Avg Setup</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm text-gray-400 font-medium mb-8">
            World-class teams trust InterviewAI
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40">
            {['Microsoft', 'Google', 'Amazon', 'Meta', 'Apple', 'Netflix'].map((company) => (
              <span key={company} className="text-lg font-bold text-gray-900 tracking-tight">{company}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-primary leading-tight">
              The Execution Platform for<br />Intelligent Hiring
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto leading-relaxed">
              AI Interviews is the agent-powered workspace built for modern talent teams. It transforms job requirements into structured, bias-aware, and data-driven hiring decisions—faster and at scale.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="mt-8 px-6 py-3 border-2 border-accent text-accent font-semibold rounded-lg hover:bg-accent hover:text-white transition text-sm"
            >
              Explore The Platform
            </button>
          </div>

          {/* Feature Cards */}
          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-card-hover hover:border-gray-300 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6 group-hover:bg-accent group-hover:text-white transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                <div className="flex items-center gap-1 mt-6 text-accent text-sm font-semibold group-hover:gap-2 transition-all">
                  <span>Learn more</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Streamline Section */}
      <section className="py-20 px-6 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-primary leading-tight mb-4">
                Streamline interview operations with intelligent queuing.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Remove scheduling friction and reduce time-to-interview with automated interview queuing — making life easier for recruiters, coordinators, and candidates.
              </p>
              <button className="px-5 py-2.5 border-2 border-accent text-accent font-semibold rounded-lg hover:bg-accent hover:text-white transition text-sm">
                Discover Scheduling Queues
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-medium text-gray-500">Interview Queue</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-green-600">98%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {['Frontend Developer', 'Backend Engineer', 'Data Scientist'].map((role, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-accent' : 'bg-amber-500'}`}></div>
                      <span className="text-sm font-medium text-gray-700">{role}</span>
                    </div>
                    <span className="text-xs text-gray-400">{i === 0 ? 'In Progress' : i === 1 ? 'Queued' : 'Scheduled'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-primary">
              How It Works
            </h2>
            <p className="text-gray-500 mt-4 text-lg">Start practicing in 3 simple steps</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-16 h-16 bg-accent text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform shadow-md shadow-blue-600/20">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 px-6 bg-surface border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-4xl sm:text-5xl font-bold text-primary mb-2">{stat.value}</p>
                <p className="text-gray-500 font-medium text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reporting Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-card order-2 md:order-1">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-bold text-gray-900">Reports</span>
                <div className="flex gap-2 text-xs text-gray-400">
                  <span>Day</span>
                  <span className="text-accent font-medium">Week</span>
                  <span>Month</span>
                </div>
              </div>
              <div className="space-y-4">
                {[85, 72, 91, 68, 88].map((score, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-8">Q{i + 1}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${score >= 80 ? 'bg-accent' : 'bg-amber-500'}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 w-8">{score}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary leading-tight mb-4">
                Track your hiring performance with clear, actionable insights.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Monitor key recruitment metrics in real-time, track stakeholder decisions, and stay aligned with your growth goals.
              </p>
              <button className="px-5 py-2.5 border-2 border-accent text-accent font-semibold rounded-lg hover:bg-accent hover:text-white transition text-sm">
                Discover Reporting & Insights
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-primary rounded-3xl p-12 sm:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/30"></div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Connected to Your Hiring Ecosystem
              </h2>
              <a href="#" className="text-blue-300 text-sm font-medium inline-flex items-center gap-1 mb-8 hover:text-blue-200 transition">
                See Our Integrations <span>→</span>
              </a>
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                {[
                  { icon: 'target', color: 'text-blue-400' },
                  { icon: 'backend', color: 'text-green-400' },
                  { icon: 'chart', color: 'text-purple-400' },
                  { icon: 'link', color: 'text-orange-400' },
                  { icon: 'mobile', color: 'text-pink-400' },
                  { icon: 'shield', color: 'text-emerald-400' },
                  { icon: 'zap', color: 'text-yellow-400' },
                  { icon: 'paint', color: 'text-indigo-400' }
                ].map((item, i) => (
                  <div key={i} className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 cursor-pointer backdrop-blur-sm group">
                    <RoleIcon icon={item.icon} className={`w-7 h-7 ${item.color} group-hover:scale-110 transition-transform`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-5 gap-8 mb-12">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-primary">InterviewAI</span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                The intelligent interview platform for modern hiring teams. Automate, evaluate, and hire with confidence.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Product</h3>
              <ul className="space-y-3 text-gray-500 text-sm">
                <li><a href="#" className="hover:text-gray-900 transition">Features</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Company</h3>
              <ul className="space-y-3 text-gray-500 text-sm">
                <li><a href="#" className="hover:text-gray-900 transition">About</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">Careers</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Legal</h3>
              <ul className="space-y-3 text-gray-500 text-sm">
                <li><a href="#" className="hover:text-gray-900 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">Terms</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 InterviewAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
