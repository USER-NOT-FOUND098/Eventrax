import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, GraduationCap, Megaphone, Users, Moon, Rocket, Star, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

const ROLES = [
    {
        id: 'student',
        label: 'Student',
        description: 'Register for events & volunteer',
        icon: GraduationCap,
        requiresApproval: false
    },
    {
        id: 'teamlead',
        label: 'Team Lead',
        description: 'Lead sub-events & manage volunteers',
        icon: Users,
        requiresApproval: true
    },
    {
        id: 'creator',
        label: 'Event Creator',
        description: 'Create & manage events',
        icon: Megaphone,
        requiresApproval: true
    },
];

export function SignUpPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        institution: '',
        role: 'student'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            const { data } = await api.post('/auth/register.php', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                institution: formData.institution
            });

            if (data.success) {
                const selectedRole = ROLES.find(r => r.id === formData.role);
                if (selectedRole?.requiresApproval) {
                    setSuccess('Registration submitted! Your account is pending admin approval.');
                } else {
                    setSuccess('Registration successful! You can now login.');
                    setTimeout(() => navigate('/login'), 2000);
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
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
            {/* Ambient background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

            {/* Back Button */}
            <Link
                to="/"
                className="group absolute top-6 left-6 md:top-8 md:left-8 z-20 flex items-center justify-center transition-transform duration-300 hover:-translate-x-1"
                aria-label="Back to Home"
            >
                <ArrowLeft className="w-6 h-6 md:w-8 md:h-8 text-white/50 group-hover:text-white transition-colors duration-300" />
            </Link>

            <div className="w-full max-w-md relative z-10 py-8">
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-3 mb-8 mt-12 md:mt-0 hover:opacity-80 transition-opacity">
                    <Logo className="w-12 h-12 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)] shrink-0" invertContext={false} />
                    <span className="text-2xl font-bold !text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">EVENTRAX</span>
                </Link>

                <Card className="shadow-[0_0_40px_rgba(168,85,247,0.15)] relative overflow-hidden">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold !text-black text-center">
                            Create an account
                        </CardTitle>
                        <CardDescription className="!text-black/60 text-center">
                            Join Eventrax to start managing events
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20">
                                <AlertCircle className="h-4 w-4 text-rose-400" />
                                <AlertDescription className="text-rose-400">{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="bg-emerald-500/10 border-emerald-500/20">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                <AlertDescription className="text-emerald-400">{success}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="!text-black/80">I am a...</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {ROLES.map((role) => {
                                        const Icon = role.icon;
                                        return (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
                                                className={cn(
                                                    'p-3 rounded-lg border text-left flex flex-col transition-all cursor-pointer',
                                                    formData.role === role.id
                                                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-700 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                                        : 'bg-black/5 border-black/10 text-black/60 hover:bg-black/10 hover:text-black'
                                                )}
                                            >
                                                <Icon className="w-5 h-5 mb-1 flex-shrink-0" />
                                                <span className="font-medium block leading-tight">{role.label}</span>
                                                <span className="text-[10px] sm:text-xs opacity-70 leading-tight mt-1 flex-grow">{role.description}</span>
                                                {role.requiresApproval && (
                                                    <span className="text-[10px] text-amber-400 block mt-2 font-medium">Requires approval</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="!text-black/80">Full Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="!border-black/10 !text-black placeholder:!text-black/30 focus:!border-purple-500 focus:!ring-purple-500/20 transition-all rounded-lg"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="!text-black/80">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="!border-black/10 !text-black placeholder:!text-black/30 focus:!border-purple-500 focus:!ring-purple-500/20 transition-all rounded-lg"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="institution" className="!text-black/80">Institution (Optional)</Label>
                                <Input
                                    id="institution"
                                    name="institution"
                                    type="text"
                                    placeholder="Your college or organization"
                                    value={formData.institution}
                                    onChange={handleChange}
                                    className="!border-black/10 !text-black placeholder:!text-black/30 focus:!border-purple-500 focus:!ring-purple-500/20 transition-all rounded-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="!text-black/80">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Create a password"
                                        value={formData.password}
                                        onChange={handleChange}
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

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="!text-black/80">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="!border-black/10 !text-black placeholder:!text-black/30 focus:!border-purple-500 focus:!ring-purple-500/20 transition-all rounded-lg"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 !text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all rounded-lg h-11 border-none mt-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </form>

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
                            Sign up with Google
                        </Button>

                        <p className="text-center text-sm !text-black/60 mt-6">
                            Already have an account?{' '}
                            <Link to="/login" className="!text-purple-600 hover:!text-purple-500 font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </CardContent>
                </Card>

                <p className="text-center text-xs !text-white/60 mt-8">
                    By signing up, you agree to our{' '}
                    <a href="#" className="!text-white hover:!text-purple-300 transition-colors">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="!text-white hover:!text-purple-300 transition-colors">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}
