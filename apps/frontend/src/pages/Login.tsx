import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ScriptBadge } from '../components/ui/ScriptBadge';
import { Loader2 } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-6xl font-display font-black italic tracking-tighter mb-2">
                        WORK<span className="text-stroke-black">FLOW</span>
                    </h1>
                    <ScriptBadge className="bg-brand-yellow">Login to your account</ScriptBadge>
                </div>

                <form onSubmit={handleSubmit} className="brutal-card space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border-2 border-red-500 text-red-600 font-bold text-sm">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                    </Button>

                    <p className="text-center text-sm font-bold">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-brand-yellow underline hover:no-underline">
                            Register as Owner
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
