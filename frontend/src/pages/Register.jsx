import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { register, reset } from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const RegisterPro = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
  });

  const { name, email, password, password2 } = formData;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isError) {
      toast.error(message);
      dispatch(reset());
    }

    if (isSuccess || user) {
      navigate('/');
      dispatch(reset());
    }
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (password !== password2) {
      toast.error('Passwords do not match');
    } else {
      const userData = {
        name,
        email,
        password,
      };
      dispatch(register(userData));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <h1 className="text-2xl font-bold text-white">InterviewAI</h1>
          </div>
          <p className="text-slate-400">Start mastering your interview skills today</p>
        </div>

        {/* Register Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-blue-600/30 rounded-xl p-8 backdrop-blur">
          <h2 className="text-xl font-bold text-white mb-6">Create your account</h2>

          <form onSubmit={onSubmit} className="space-y-4 mb-6">
            {/* Username */}
            <div>
              <label className="block text-slate-300 font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={onChange}
                placeholder="Enter your full name"
                className="w-full bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none placeholder-slate-500 focus:bg-slate-700 transition"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-300 font-medium mb-2">Email address</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="Enter your email"
                className="w-full bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none placeholder-slate-500 focus:bg-slate-700 transition"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="Create a password"
                className="w-full bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none placeholder-slate-500 focus:bg-slate-700 transition"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-slate-300 font-medium mb-2">Confirm password</label>
              <input
                type="password"
                name="password2"
                value={password2}
                onChange={onChange}
                placeholder="Confirm your password"
                className="w-full bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none placeholder-slate-500 focus:bg-slate-700 transition"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 mt-6"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>By creating an account, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPro;
