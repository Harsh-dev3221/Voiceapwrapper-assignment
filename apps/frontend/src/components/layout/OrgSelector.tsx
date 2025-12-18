import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMutation, gql } from '@apollo/client';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ScriptBadge } from '../ui/ScriptBadge';
import { ChevronDown, Users, Plus, Copy, Check, Loader2 } from 'lucide-react';

const INVITE_MEMBER = gql`
  mutation InviteMember($email: String!, $organizationId: Int!) {
    inviteMember(email: $email, organizationId: $organizationId) {
      success
      inviteToken
    }
  }
`;

export const OrgSelector = () => {
    const { currentOrg, isOwner } = useAuth();
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const [inviteMember, { loading }] = useMutation(INVITE_MEMBER);

    const handleInvite = async () => {
        if (!currentOrg || !inviteEmail) return;

        try {
            const { data } = await inviteMember({
                variables: {
                    email: inviteEmail,
                    organizationId: parseInt(currentOrg.id)
                }
            });

            const link = `${window.location.origin}/invite/${data.inviteMember.inviteToken}`;
            setInviteLink(link);
            setInviteEmail('');
        } catch (error) {
            console.error('Failed to invite:', error);
        }
    };

    const copyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!currentOrg) return null;

    return (
        <>
            <div className="p-4 border-b-2 border-brand-black">
                <button className="w-full flex items-center justify-between p-3 bg-gray-50 border-2 border-brand-black hover:bg-gray-100 transition-colors">
                    <div className="text-left">
                        <p className="font-display font-bold text-sm uppercase">{currentOrg.name}</p>
                        <ScriptBadge className="text-xs mt-1 bg-brand-yellow">{isOwner ? 'Owner' : 'Member'}</ScriptBadge>
                    </div>
                    <ChevronDown size={20} />
                </button>

                {isOwner && (
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="w-full mt-2 flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-400 text-gray-600 hover:border-brand-black hover:text-brand-black transition-colors font-bold text-sm uppercase"
                    >
                        <Users size={16} /> Invite Member
                    </button>
                )}
            </div>

            <Modal
                isOpen={showInviteModal}
                onClose={() => { setShowInviteModal(false); setInviteLink(null); }}
                title="Invite Member"
            >
                {inviteLink ? (
                    <div className="space-y-4">
                        <p className="font-bold text-green-600">Invitation created!</p>
                        <div className="p-3 bg-gray-100 border-2 border-brand-black font-mono text-sm break-all">
                            {inviteLink}
                        </div>
                        <Button onClick={copyLink} className="w-full">
                            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
                        </Button>
                        <p className="text-sm text-gray-500">Share this link with the person you want to invite.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Input
                            label="Member Email"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="member@example.com"
                        />
                        <Button onClick={handleInvite} disabled={loading || !inviteEmail} className="w-full">
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <><Plus size={16} /> Send Invite</>}
                        </Button>
                    </div>
                )}
            </Modal>
        </>
    );
};
