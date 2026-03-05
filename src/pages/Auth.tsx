import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, X, CheckCircle, Cloud, HardDrive } from 'lucide-react';
import { isSupabaseConfigured, signIn as supabaseSignIn, signUp as supabaseSignUp } from '../lib/supabase';

export function Auth() {
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginWithSupabase, isAuthenticated, isLoading } = useApp();
  const navigate = useNavigate();
  
  // Check if Supabase is configured
  const cloudEnabled = isSupabaseConfigured();

  // Auto redirect when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    try {
      if (cloudEnabled) {
        // Try Supabase login first
        const { session, user } = await supabaseSignIn(formData.email, formData.password);
        if (session && user) {
          // Use the context's Supabase login handler
          await loginWithSupabase(user, session);
        }
      } else {
        // Fallback to localStorage login
        const success = login(formData.email, formData.password);
        if (!success) {
          setError('Email hoặc mật khẩu không đúng. Nếu chưa có tài khoản, hãy đăng ký trước.');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
      if (errorMessage.includes('Invalid login credentials')) {
        setError('Email hoặc mật khẩu không đúng');
      } else if (errorMessage.includes('Email not confirmed')) {
        setError('Vui lòng xác nhận email của bạn trước khi đăng nhập');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">Life OS</h1>
          <p className="text-gray-600 dark:text-gray-400 italic">Your potential is endless.</p>
          
          {/* Storage Mode Indicator */}
          <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            cloudEnabled 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          }`}>
            {cloudEnabled ? (
              <>
                <Cloud className="w-4 h-4" />
                Chế độ đám mây (Supabase)
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4" />
                Chế độ ngoại tuyến (LocalStorage)
              </>
            )}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-10 pr-12 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Chưa có tài khoản?{' '}
            <button
              onClick={() => setShowRegisterModal(true)}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-sm text-gray-500 dark:text-gray-400">
          {cloudEnabled ? (
            <p>☁️ Dữ liệu được đồng bộ và lưu trữ an toàn trên đám mây</p>
          ) : (
            <p>💾 Dữ liệu được lưu trữ cục bộ trên trình duyệt</p>
          )}
        </div>
      </div>

      {/* Register Modal */}
      {showRegisterModal && (
        <RegisterModal 
          onClose={() => setShowRegisterModal(false)} 
          cloudEnabled={cloudEnabled}
        />
      )}
    </div>
  );
}

// Register Modal Component
function RegisterModal({ onClose, cloudEnabled }: { onClose: () => void; cloudEnabled: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useApp();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email không hợp lệ');
      setLoading(false);
      return;
    }

    try {
      if (cloudEnabled) {
        // Register with Supabase
        const { user } = await supabaseSignUp(formData.email, formData.password, formData.name);
        
        if (user) {
          // Check if email confirmation is required
          if (user.identities && user.identities.length === 0) {
            // Email already exists
            setError('Email đã được sử dụng. Vui lòng sử dụng email khác.');
          } else if (!user.confirmed_at) {
            // Email confirmation required
            setNeedsEmailConfirmation(true);
            setSuccess(true);
          } else {
            // No confirmation needed
            setSuccess(true);
          }
        }
      } else {
        // Register with localStorage
        const result = register(formData.email, formData.password, formData.name);
        if (result) {
          setSuccess(true);
        } else {
          setError('Email đã tồn tại. Vui lòng sử dụng email khác.');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
      if (errorMessage.includes('User already registered')) {
        setError('Email đã được đăng ký. Vui lòng đăng nhập.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Success view
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fadeIn text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Đăng ký thành công! 🎉
          </h2>
          
          {needsEmailConfirmation ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Chúng tôi đã gửi email xác nhận đến:
              </p>
              <p className="text-indigo-600 dark:text-indigo-400 font-medium mb-4">
                {formData.email}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Vui lòng kiểm tra hộp thư (bao gồm cả thư rác) và nhấn vào liên kết xác nhận trước khi đăng nhập.
              </p>
            </>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tài khoản của bạn đã được tạo. Bạn có thể đăng nhập ngay bây giờ.
            </p>
          )}
          
          <button
            onClick={onClose}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {needsEmailConfirmation ? 'Đã hiểu' : 'Đăng nhập ngay'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fadeIn relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tạo tài khoản mới</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Điền thông tin bên dưới để đăng ký
          </p>
          
          {/* Storage Mode Indicator */}
          <div className={`mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
            cloudEnabled 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          }`}>
            {cloudEnabled ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
            {cloudEnabled ? 'Đám mây' : 'Ngoại tuyến'}
          </div>
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Họ và tên"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu (ít nhất 6 ký tự)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-10 pr-12 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Xác nhận mật khẩu"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full pl-10 pr-12 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password requirements */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Yêu cầu mật khẩu:</p>
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <li className={`flex items-center gap-2 ${formData.password.length >= 6 ? 'text-green-500' : ''}`}>
                {formData.password.length >= 6 ? '✓' : '○'} Ít nhất 6 ký tự
              </li>
              <li className={`flex items-center gap-2 ${formData.password === formData.confirmPassword && formData.confirmPassword ? 'text-green-500' : ''}`}>
                {formData.password === formData.confirmPassword && formData.confirmPassword ? '✓' : '○'} Mật khẩu xác nhận khớp
              </li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : (
              'Đăng ký'
            )}
          </button>
        </form>

        {/* Back to login */}
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 text-sm hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            ← Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}
