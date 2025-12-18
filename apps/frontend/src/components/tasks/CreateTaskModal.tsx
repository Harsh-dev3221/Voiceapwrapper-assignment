import { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, UserPlus, X } from 'lucide-react';

const GET_ORG_MEMBERS = gql`
  query GetOrgMembers($organizationId: Int!) {
    organizationMembers(organizationId: $organizationId) {
      id
      user {
        id
        email
        firstName
        lastName
      }
      role
    }
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask($projectId: Int!, $title: String!, $description: String, $assigneeIds: [Int]) {
    createTask(projectId: $projectId, title: $title, description: $description, assigneeIds: $assigneeIds) {
      task {
        id
        title
        description
        status
        assignees {
          id
          email
        }
      }
    }
  }
`;

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number;
    onTaskCreated: () => void;
}

export const CreateTaskModal = ({ isOpen, onClose, projectId, onTaskCreated }: CreateTaskModalProps) => {
    const { currentOrg } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);

    const { data: membersData } = useQuery(GET_ORG_MEMBERS, {
        variables: { organizationId: currentOrg ? parseInt(currentOrg.id) : 0 },
        skip: !currentOrg
    });

    const [createTask, { loading }] = useMutation(CREATE_TASK, {
        onCompleted: () => {
            onTaskCreated();
            onClose();
            setTitle('');
            setDescription('');
            setSelectedAssignees([]);
        }
    });

    const members = membersData?.organizationMembers?.filter((m: any) => m.role === 'MEMBER') || [];

    const toggleAssignee = (userId: number) => {
        setSelectedAssignees(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        createTask({
            variables: {
                projectId,
                title,
                description: description || null,
                assigneeIds: selectedAssignees.length > 0 ? selectedAssignees : null
            }
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Task">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Task Title"
                    placeholder="e.g., Design landing page"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    autoFocus
                />

                <div className="flex flex-col gap-2">
                    <label className="font-display font-bold uppercase tracking-wider text-sm">
                        Description
                    </label>
                    <textarea
                        className="brutal-input min-h-[80px] resize-none"
                        placeholder="What needs to be done?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {/* Assignee Selection */}
                <div className="flex flex-col gap-2">
                    <label className="font-display font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                        <UserPlus size={16} /> Assign To
                    </label>

                    {members.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {members.map((member: any) => {
                                const isSelected = selectedAssignees.includes(parseInt(member.user.id));
                                return (
                                    <button
                                        key={member.user.id}
                                        type="button"
                                        onClick={() => toggleAssignee(parseInt(member.user.id))}
                                        className={`px-3 py-2 border-2 border-brand-black text-sm font-bold transition-colors flex items-center gap-2 ${isSelected
                                                ? 'bg-brand-yellow shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                : 'bg-white hover:bg-gray-100'
                                            }`}
                                    >
                                        {member.user.firstName || member.user.email}
                                        {isSelected && <X size={14} />}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No members to assign. Invite members first.</p>
                    )}
                </div>

                <div className="flex gap-3 pt-4 border-t-2 border-brand-black">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading || !title.trim()} className="flex-1">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Task'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
