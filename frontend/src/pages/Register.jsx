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
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-primary">InterviewAI</h1>
          </div>
          <p className="text-gray-500 text-sm">Start mastering your interview skills today</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-card">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Create your account</h2>

          <form onSubmit={onSubmit} className="space-y-4 mb-6">
            {/* Username */}
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">Full Name</label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={onChange}
                placeholder="Enter your full name"
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none placeholder-gray-400 transition"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">Email address</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="Enter your email"
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none placeholder-gray-400 transition"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">Password</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="Create a password"
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none placeholder-gray-400 transition"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">Confirm password</label>
              <input
                type="password"
                name="password2"
                value={password2}
                onChange={onChange}
                placeholder="Confirm your password"
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none placeholder-gray-400 transition"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm disabled:opacity-50 mt-6"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-xs">
          <p>By creating an account, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPro;
