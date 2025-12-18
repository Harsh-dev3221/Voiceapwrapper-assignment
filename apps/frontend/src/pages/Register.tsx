import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ScriptBadge } from '../components/ui/ScriptBadge';
import { Loader2 } from 'lucide-react';

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        businessName: '',
        address: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(formData);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-display font-black italic tracking-tighter mb-2">
                        Create Account
                    </h1>
                    <ScriptBadge className="bg-brand-yellow">Owner Registration</ScriptBadge>
                </div>

                <form onSubmit={handleSubmit} className="brutal-card space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border-2 border-red-500 text-red-600 font-bold text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="John"
                            required
                        />
                        <Input
                            label="Last Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Doe"
                            required
                        />
                    </div>

                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@company.com"
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                    />

                    <div className="border-t-4 border-brand-black pt-6">
                        <h3 className="font-display font-bold text-lg uppercase mb-4">Business Information</h3>

                        <Input
                            label="Business Name"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            placeholder="Acme Corporation"
                            required
                        />

                        <div className="mt-4 flex flex-col gap-2">
                            <label className="font-display font-bold uppercase tracking-wider text-sm">
                                Address (Optional)
                            </label>
                            <textarea
                                name="address"
                                className="brutal-input min-h-[80px] resize-none"
                                placeholder="123 Business St, City, Country"
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? <Loader2 className="animate-spin" /> : 'Create Organization'}
                    </Button>

                    <p className="text-center text-sm font-bold">
                        Already have an account?{' '}
                        <Link to="/login" className="text-brand-yellow underline hover:no-underline">
                            Sign In
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
