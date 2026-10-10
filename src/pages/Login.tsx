import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import logoImg from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginAsAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setGoogleError(null);
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        toast.success('Welcome back!');
        navigate('/');
      } else {
        setGoogleError(result.error || 'Google inloggen mislukt');
        toast.error('Google inloggen mislukt');
      }
    } catch {
      setGoogleError('Onverwachte fout bij Google inloggen');
      toast.error('Google inloggen mislukt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login({
        email: formData.email,
        password: formData.password,
      });

      if (success) {
        toast.success('Welcome back!');
        navigate('/');
      } else {
        toast.error('Invalid email or password');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient spotlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="w-full max-w-md relative z-10 bg-[#161617]/90 border border-white/[0.08] rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center group">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center justify-center p-2.5 transition-transform duration-200 group-hover:scale-105">
              <img src={logoImg} alt="CloudiAudi" className="w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(40,80,200,0.45)]" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-4">Welkom terug</h1>
          <p className="text-[#86868b] text-sm mt-1">
            Log in met jouw CloudiAudi account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold text-[#86868b]">E-mailadres</Label>
            <Input
              id="email"
              type="email"
              placeholder="naam@cloudiaudi.nl"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading}
              className="h-11 bg-[#1c1c1e] border-white/[0.08] rounded-2xl text-sm focus-visible:ring-[#fa233b] placeholder:text-[#86868b]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold text-[#86868b]">Wachtwoord</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Jouw wachtwoord"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
                className="h-11 bg-[#1c1c1e] border-white/[0.08] rounded-2xl text-sm focus-visible:ring-[#fa233b] placeholder:text-[#86868b]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={formData.rememberMe}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, rememberMe: checked as boolean })
                }
              />
              <Label htmlFor="remember" className="text-xs text-[#86868b] cursor-pointer">
                Onthoud mij
              </Label>
            </div>
            <Link
              to="/forgot-password"
              className="text-[#fa233b] hover:underline transition-colors"
            >
              Wachtwoord vergeten?
            </Link>
          </div>

          <Button
            type="submit"
            variant="apple"
            size="lg"
            className="w-full h-11 font-semibold text-sm shadow-xl mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Inloggen...
              </>
            ) : (
              'Inloggen'
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
            <span className="bg-[#161617] px-3 text-[#86868b]">Of ga verder met</span>
          </div>
        </div>

        {/* Social Login */}
        <Button
          variant="secondary"
          size="lg"
          className="w-full h-11 border-white/[0.08] text-xs font-semibold"
          disabled={isLoading}
          onClick={handleGoogleLogin}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>

        {googleError && (
          <div className="mt-4 p-4 rounded-2xl bg-[#fa233b]/10 border border-[#fa233b]/20 text-xs space-y-2">
            <p className="font-semibold text-[#fa233b]">Firebase melding</p>
            <p className="text-[#86868b] leading-relaxed">{googleError}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-xs rounded-full"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.hostname);
                  toast.success(`Gekopieerd: ${window.location.hostname}`);
                }}
              >
                Kopieer huidig domein
              </Button>
              <Button
                type="button"
                size="sm"
                variant="default"
                className="text-xs rounded-full"
                onClick={() => {
                  loginAsAdmin();
                  toast.success('Ingelogd als beheerder Jamal Drenthe');
                  navigate('/');
                }}
              >
                Direct inloggen als beheerder
              </Button>
            </div>
          </div>
        )}

        {/* Quick Admin Login button */}
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full mt-3 h-11 rounded-full border-white/[0.08] text-xs font-semibold"
          onClick={() => {
            loginAsAdmin();
            toast.success('Ingelogd als Jamal Drenthe (Admin)');
            navigate('/');
          }}
        >
          Snel inloggen als Jamal Drenthe (Admin)
        </Button>

        {/* Sign up link */}
        <p className="text-center mt-7 text-xs text-[#86868b]">
          Nog geen CloudiAudi account?{' '}
          <Link to="/register" className="text-[#fa233b] hover:underline font-semibold">
            Maak een account aan
          </Link>
        </p>
      </div>
    </div>
  );
}
