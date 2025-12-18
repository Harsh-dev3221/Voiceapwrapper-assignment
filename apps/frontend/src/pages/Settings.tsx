import { useAuth } from '../contexts/AuthContext';
import { BrutalCard } from '../components/ui/BrutalCard';
import { Button } from '../components/ui/Button';
import { ScriptBadge } from '../components/ui/ScriptBadge';
import { User, Building2, Shield, CreditCard, LogOut, Info } from 'lucide-react';

export default function Settings() {
    const { user, currentOrg, isOwner, logout } = useAuth();

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-5xl mb-2">Settings</h1>
                <p className="text-xl font-body text-gray-600">
                    Manage your account and organization settings.
                </p>
            </div>

            {/* Account Section */}
            <BrutalCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <User size={24} />
                    <h2 className="text-2xl font-display font-bold uppercase">Account</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Name</label>
                        <p className="font-bold text-lg">{user?.firstName} {user?.lastName}</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                        <p className="font-bold text-lg">{user?.email}</p>
                    </div>
                </div>
            </BrutalCard>

            {/* Organization Section */}
            <BrutalCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Building2 size={24} />
                    <h2 className="text-2xl font-display font-bold uppercase">Organization</h2>
                </div>

                {currentOrg ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Organization Name</label>
                                <p className="font-bold text-lg">{currentOrg.name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Your Role</label>
                                <div className="mt-1">
                                    <ScriptBadge className={isOwner ? 'bg-brand-yellow' : 'bg-gray-200'}>
                                        {isOwner ? 'Owner' : 'Member'}
                                    </ScriptBadge>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500">No organization selected.</p>
                )}
            </BrutalCard>

            {/* Plan & Limits */}
            <BrutalCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <CreditCard size={24} />
                    <h2 className="text-2xl font-display font-bold uppercase">Plan & Limits</h2>
                </div>

                <div className="bg-brand-yellow/20 border-2 border-brand-yellow p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Info size={18} />
                        <span className="font-bold">Free Tier</span>
                    </div>
                    <p className="text-sm text-gray-600">
                        You are on the free plan with the following limits:
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-gray-200">
                        <span className="font-bold">Projects</span>
                        <span className="text-sm">
                            <span className="font-bold text-brand-black">1</span>
                            <span className="text-gray-400"> / 1 max</span>
                        </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-gray-200">
                        <span className="font-bold">Tasks per Project</span>
                        <span className="text-sm">
                            <span className="font-bold text-brand-black">Unlimited</span>
                        </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-gray-200">
                        <span className="font-bold">Team Members</span>
                        <span className="text-sm">
                            <span className="font-bold text-brand-black">5</span>
                            <span className="text-gray-400"> / 5 max</span>
                        </span>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-gray-200">
                    <Button variant="secondary" className="w-full opacity-50 cursor-not-allowed">
                        Upgrade to Pro (Coming Soon)
                    </Button>
                </div>
            </BrutalCard>

            {/* Permissions */}
            <BrutalCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Shield size={24} />
                    <h2 className="text-2xl font-display font-bold uppercase">Your Permissions</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                        { name: 'View Projects', allowed: true },
                        { name: 'Create Projects', allowed: isOwner },
                        { name: 'Create Tasks', allowed: isOwner },
                        { name: 'Edit Tasks', allowed: isOwner },
                        { name: 'Invite Members', allowed: isOwner },
                        { name: 'View Assigned Tasks', allowed: true },
                    ].map(perm => (
                        <div
                            key={perm.name}
                            className={`p-3 border-2 ${perm.allowed ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}
                        >
                            <span className={`text-sm font-bold ${perm.allowed ? 'text-green-700' : 'text-gray-400'}`}>
                                {perm.allowed ? '✓' : '✗'} {perm.name}
                            </span>
                        </div>
                    ))}
                </div>
            </BrutalCard>

            {/* Danger Zone */}
            <BrutalCard className="p-6 border-red-500">
                <h2 className="text-xl font-display font-bold uppercase mb-4 text-red-600">Danger Zone</h2>
                <Button onClick={logout} className="bg-red-500 hover:bg-red-600 border-red-700">
                    <LogOut size={18} />
                    Sign Out
                </Button>
            </BrutalCard>
        </div>
    );
}
