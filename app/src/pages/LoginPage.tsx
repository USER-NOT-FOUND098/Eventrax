import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, AlertCircle, Moon, Rocket, Star, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'creator':
          navigate('/creator/dashboard');
          break;
        case 'teamlead':
          navigate('/teamlead/dashboard');
          break;
        case 'student':
          navigate('/student/events');
          break;
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isForgotPassword) {
      // Simulate API call for forgot password
      setTimeout(() => {
        setIsLoading(false);
        setResetSent(true);
      }, 1500);
      return;
    }

    try {
      await login(email, password);
      // Navigation will happen automatically due to the redirect above
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a001a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none h-full w-full overflow-hidden">
        <Moon className="absolute top-[15%] right-[10%] md:right-[20%] w-32 h-32 md:w-48 md:h-48 text-purple-300/10 -rotate-12 animate-[pulse_10s_ease-in-out_infinite]" />
        <Rocket className="absolute top-[60%] left-[5%] md:left-[15%] w-16 h-16 md:w-24 md:h-24 text-purple-300/10 rotate-[45deg] animate-[bounce_8s_ease-in-out_infinite]" />
        <Star className="absolute top-[25%] left-[25%] w-6 h-6 text-purple-200/20 animate-[pulse_3s_ease-in-out_infinite]" />
        <Star className="absolute bottom-[40%] right-[30%] w-4 h-4 text-purple-200/20 animate-[pulse_4s_ease-in-out_infinite]" />
        <Star className="absolute top-[50%] right-[15%] w-8 h-8 text-purple-200/20 animate-[pulse_5s_ease-in-out_infinite]" />
        <Star className="absolute bottom-[20%] left-[30%] w-5 h-5 text-purple-200/20 animate-[pulse_6s_ease-in-out_infinite]" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Back Button */}
      <Link
        to="/"
        className="group absolute top-6 left-6 md:top-8 md:left-8 z-20 flex items-center justify-center transition-transform duration-300 hover:-translate-x-1"
        aria-label="Back to Home"
      >
        <ArrowLeft className="w-6 h-6 md:w-8 md:h-8 text-white/50 group-hover:text-white transition-colors duration-300" />
      </Link>

      <div className="w-full max-w-md relative z-10 mt-12 md:mt-0">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 hover:opacity-80 transition-opacity">
          <Logo className="w-12 h-12 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)] shrink-0" invertContext={false} />
          <span className="text-2xl font-bold !text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">EVENTRAX</span>
        </Link>

        <Card className="shadow-[0_0_40px_rgba(168,85,247,0.15)] relative overflow-hidden">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold !text-black text-center">
              {isForgotPassword ? 'Reset Password' : 'Welcome back'}
            </CardTitle>
            <CardDescription className="!text-black/60 text-center">
              {isForgotPassword
                ? 'Enter your email to receive a reset link'
                : 'Sign in to your account to continue'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20">
                <AlertCircle className="h-4 w-4 text-rose-400" />
                <AlertDescription className="text-rose-400">{error}</AlertDescription>
              </Alert>
            )}

            {resetSent && isForgotPassword ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-black">Check your email</h3>
                  <p className="text-sm text-black/60">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full !border-black/10 !text-black hover:bg-black/5"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetSent(false);
                    setEmail('');
                  }}
                >
                  Return to login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="!text-black/80">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="!border-black/10 !text-black placeholder:!text-black/30 focus:!border-purple-500 focus:!ring-purple-500/20 transition-all rounded-lg"
                    required
                  />
                </div>

                {!isForgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="!text-black/80">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="!border-black/10 !text-black placeholder:!text-black/30 focus:!border-purple-500 focus:!ring-purple-500/20 transition-all pr-10 rounded-lg"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {!isForgotPassword && (
                  <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="rounded !border-black/20 text-purple-500 focus:ring-purple-500/30" />
                      <span className="text-sm !text-black/60 group-hover:!text-black transition-colors">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm !text-purple-600 hover:!text-purple-500 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 !text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all rounded-lg h-11 border-none"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isForgotPassword ? 'Sending...' : 'Signing in...'}
                    </>
                  ) : (
                    isForgotPassword ? 'Send Reset Link' : 'Sign In'
                  )}
                </Button>

                {isForgotPassword && (
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(false)}
                      className="text-sm text-black/60 hover:text-black transition-colors"
                    >
                      Back to login
                    </button>
                  </div>
                )}
              </form>
            )}

            {!isForgotPassword && (
              <>
                <div className="flex items-center gap-4 my-6">
                  <div className="h-px flex-1 bg-black/10"></div>
                  <span className="text-xs !text-black/50 uppercase tracking-wider font-medium">Or continue with</span>
                  <div className="h-px flex-1 bg-black/10"></div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent !border-black/10 !text-black hover:bg-black/5 transition-all rounded-lg h-11"
                  onClick={() => { }}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </Button>

                <p className="text-center text-sm !text-black/60 mt-6">
                  Don't have an account?{' '}
                  <a href="/signup" className="!text-purple-600 hover:!text-purple-500 font-medium transition-colors">
                    Sign up
                  </a>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs !text-white/60 mt-8">
          By signing in, you agree to our{' '}
          <a href="#" className="!text-white hover:!text-purple-300 transition-colors">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="!text-white hover:!text-purple-300 transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
