import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

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
      icon: '◉',
      title: 'AI-Powered Interviews',
      desc: 'Practice with our intelligent AI interviewer that simulates real technical interviews'
    },
    {
      icon: '▦',
      title: 'Real-Time Feedback',
      desc: 'Get instant feedback on your performance, communication, and technical depth'
    },
    {
      icon: '◈',
      title: 'Coding Challenges',
      desc: 'Solve real coding problems and improve your problem-solving skills'
    },
    {
      icon: '▲',
      title: 'Detailed Analytics',
      desc: 'Track your progress with comprehensive performance metrics and insights'
    },
    {
      icon: '☯',
      title: 'Multiple Roles',
      desc: 'Practice for various positions: Frontend, Backend, DevOps, Data Science, and more'
    },
    {
      icon: '◆',
      title: 'Video Recording',
      desc: 'Record and review your interview responses to improve your presentation skills'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Students' },
    { value: '95%', label: 'Success Rate' },
    { value: '6', label: 'Role Types' },
    { value: '24/7', label: 'Available' }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full backdrop-blur-lg bg-slate-900/70 border-b border-blue-600/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center font-bold text-lg">
              AI
            </div>
            <span className="text-xl font-bold">InterviewAI</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 text-slate-300 hover:text-white transition font-medium"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition shadow-lg shadow-blue-600/30"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-40 pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Gradient background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-40 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Main Heading */}
          <div className="text-center space-y-6 mb-12">
            <div className="inline-block px-4 py-2 bg-blue-600/20 border border-blue-600/50 rounded-full">
              <span className="text-blue-300 font-semibold text-sm">✨ The Future of Interview Prep</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight">
              Master Technical
              <span className="block bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
                Interviews with AI
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Practice real interview scenarios with our AI-powered interviewer. Get instant feedback, improve your skills, and land your dream job.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-600 transition shadow-lg shadow-blue-600/40 hover:shadow-blue-600/50"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 border border-slate-600 rounded-lg font-bold text-lg hover:bg-slate-800/50 transition"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 pt-12 border-t border-slate-800">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-blue-400 mb-2">{stat.value}</p>
                <p className="text-slate-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 sm:px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Powerful Features for Success
            </h2>
            <p className="text-slate-400 text-lg">Everything you need to ace your technical interviews</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-blue-600/50 transition group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition transform">{feature.icon}</div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 px-4 sm:px-6 bg-gradient-to-b from-slate-800/30 to-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 text-lg">Start practicing in 3 simple steps</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create Account', desc: 'Sign up and choose your target role' },
              { step: '2', title: 'Select Interview', desc: 'Pick difficulty and interview type' },
              { step: '3', title: 'Get Results', desc: 'Receive detailed feedback and analysis' }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 px-4 sm:px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Loved by Developers
            </h2>
            <p className="text-slate-400 text-lg">Join thousands who've successfully landed their dream roles</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: 'Sarah Chen', role: 'Senior Engineer @ Google', text: 'InterviewAI helped me prepare thoroughly. The feedback was incredibly valuable!' },
              { name: 'Alex Kumar', role: 'Full Stack Dev @ Amazon', text: 'The realistic interview simulations gave me the confidence I needed to ace the real thing.' },
              { name: 'Emma Wilson', role: 'Tech Lead @ Meta', text: 'Best investment I made for my career. Highly recommended for anyone preparing for interviews.' }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-slate-300 mb-4 italic">"{testimonial.text}"</p>
                <p className="font-bold">{testimonial.name}</p>
                <p className="text-slate-400 text-sm">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 sm:px-6 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-600/50 rounded-2xl p-12 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Ready to ace your interviews?
            </h2>
            <p className="text-slate-300 text-lg mb-8">
              Join thousands of developers who've transformed their interview skills with InterviewAI.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-600 transition shadow-lg shadow-blue-600/40"
            >
              Start Your Free Trial Today
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Follow</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2026 InterviewAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
