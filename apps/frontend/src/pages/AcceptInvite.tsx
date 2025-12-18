import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ScriptBadge } from '../components/ui/ScriptBadge';
import { Loader2 } from 'lucide-react';

const ACCEPT_INVITE = gql`
  mutation AcceptInvite($token: String!, $password: String!, $firstName: String!, $lastName: String!) {
    acceptInvite(token: $token, password: $password, firstName: $firstName, lastName: $lastName) {
      user { id email }
      authToken
    }
  }
`;

export default function AcceptInvite() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');

    const [acceptInvite, { loading }] = useMutation(ACCEPT_INVITE);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const { data } = await acceptInvite({
                variables: {
                    token,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName
                }
            });

            localStorage.setItem('token', data.acceptInvite.authToken);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to accept invitation');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-display font-black italic tracking-tighter mb-2">
                        Join the Team
                    </h1>
                    <ScriptBadge className="bg-brand-yellow">Accept Invitation</ScriptBadge>
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
                            required
                        />
                        <Input
                            label="Last Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? <Loader2 className="animate-spin" /> : 'Create Account & Join'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
