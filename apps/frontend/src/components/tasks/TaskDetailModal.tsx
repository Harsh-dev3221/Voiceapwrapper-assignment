import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ScriptBadge } from '../ui/ScriptBadge';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Send, Trash2, Users, X } from 'lucide-react';

const GET_TASK = gql`
  query GetTask($id: Int!) {
    task(id: $id) {
      id
      title
      description
      status
      assignees {
        id
        email
        firstName
        lastName
      }
      comments {
        id
        content
        author {
          id
          email
          firstName
        }
        timestamp
      }
    }
  }
`;

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

const UPDATE_TASK = gql`
  mutation UpdateTask($id: Int!, $title: String, $description: String, $assigneeIds: [Int]) {
    updateTask(id: $id, title: $title, description: $description, assigneeIds: $assigneeIds) {
      task {
        id
        title
        description
        assignees {
          id
          email
          firstName
        }
      }
    }
  }
`;

const CREATE_COMMENT = gql`
  mutation CreateComment($taskId: Int!, $content: String!) {
    createComment(taskId: $taskId, content: $content) {
      comment {
        id
        content
        author {
          id
          email
        }
        timestamp
      }
    }
  }
`;

const DELETE_TASK = gql`
  mutation DeleteTask($id: Int!) {
    deleteTask(id: $id) {
      success
    }
  }
`;

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId: number | null;
    onTaskUpdated: () => void;
}

export const TaskDetailModal = ({ isOpen, onClose, taskId, onTaskUpdated }: TaskDetailModalProps) => {
    const { isOwner, currentOrg } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
    const [newComment, setNewComment] = useState('');

    const { data, loading, refetch } = useQuery(GET_TASK, {
        variables: { id: taskId },
        skip: !taskId,
        onCompleted: (taskData) => {
            if (taskData?.task) {
                setEditTitle(taskData.task.title);
                setEditDescription(taskData.task.description || '');
                setSelectedAssignees(taskData.task.assignees?.map((a: any) => parseInt(a.id)) || []);
            }
        },
    });

    const { data: membersData } = useQuery(GET_ORG_MEMBERS, {
        variables: { organizationId: currentOrg ? parseInt(currentOrg.id) : 0 },
        skip: !currentOrg || !isEditing
    });

    // Reset assignees when task data changes
    useEffect(() => {
        if (data?.task) {
            setSelectedAssignees(data.task.assignees?.map((a: any) => parseInt(a.id)) || []);
        }
    }, [data?.task?.id]);

    const [updateTask, { loading: updating }] = useMutation(UPDATE_TASK, {
        onCompleted: () => {
            setIsEditing(false);
            refetch();
            onTaskUpdated();
        },
    });

    const [createComment, { loading: commenting }] = useMutation(CREATE_COMMENT, {
        onCompleted: () => {
            setNewComment('');
            refetch();
        },
    });

    const [deleteTask, { loading: deleting }] = useMutation(DELETE_TASK, {
        onCompleted: () => {
            onClose();
            onTaskUpdated();
        },
    });

    const members = membersData?.organizationMembers?.filter((m: any) => m.role === 'MEMBER') || [];

    const toggleAssignee = (userId: number) => {
        setSelectedAssignees(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSave = () => {
        if (!taskId || !editTitle.trim()) return;
        updateTask({
            variables: {
                id: taskId,
                title: editTitle,
                description: editDescription || null,
                assigneeIds: selectedAssignees.length > 0 ? selectedAssignees : null,
            },
        });
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskId || !newComment.trim()) return;
        createComment({
            variables: {
                taskId,
                content: newComment,
            },
        });
    };

    const handleDelete = () => {
        if (!taskId) return;
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTask({ variables: { id: taskId } });
        }
    };

    if (!isOpen || !taskId) return null;

    const task = data?.task;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Task' : 'Task Details'} className="max-w-2xl">
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin" size={40} />
                </div>
            ) : task ? (
                <div className="space-y-6">
                    {/* Task Info */}
                    {isEditing ? (
                        <div className="space-y-4">
                            <Input
                                label="Title"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                            />
                            <div className="flex flex-col gap-2">
                                <label className="font-display font-bold uppercase tracking-wider text-sm">Description</label>
                                <textarea
                                    className="brutal-input min-h-[80px] resize-none"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                />
                            </div>

                            {/* Assignee Selection */}
                            <div className="flex flex-col gap-2">
                                <label className="font-display font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                    <Users size={16} /> Assign To
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
                                    <p className="text-sm text-gray-500 italic">No members to assign.</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t-2 border-brand-black">
                                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">Cancel</Button>
                                <Button onClick={handleSave} disabled={updating} className="flex-1">
                                    {updating ? <Loader2 className="animate-spin" size={16} /> : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-3xl font-display font-black">{task.title}</h3>
                                    <ScriptBadge className="mt-2 text-sm">{task.status}</ScriptBadge>
                                </div>
                                {isOwner && (
                                    <div className="flex gap-2">
                                        <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit</Button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            className="p-3 bg-red-100 border-2 border-red-500 text-red-600 hover:bg-red-200 transition-colors shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]"
                                        >
                                            {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-600 font-body">{task.description || 'No description.'}</p>

                            {/* Assignees */}
                            {task.assignees?.length > 0 && (
                                <div className="mt-4 p-3 bg-gray-50 border-2 border-gray-200">
                                    <p className="text-sm font-bold flex items-center gap-2 mb-2">
                                        <Users size={16} /> Assigned To:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {task.assignees.map((user: any) => (
                                            <span key={user.id} className="px-2 py-1 bg-brand-yellow border-2 border-brand-black text-xs font-bold">
                                                {user.firstName || user.email}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Comments Section */}
                    <div className="border-t-4 border-brand-black pt-6">
                        <h4 className="text-xl font-display font-bold uppercase mb-4">
                            Comments ({task.comments?.length || 0})
                        </h4>

                        <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                            {task.comments?.length > 0 ? (
                                task.comments.map((comment: any) => (
                                    <div key={comment.id} className="p-3 bg-gray-50 border-2 border-gray-200">
                                        <p className="font-body">{comment.content}</p>
                                        <p className="text-xs text-gray-400 mt-1 font-bold">
                                            {comment.author?.firstName || comment.author?.email || 'Unknown'} • {new Date(comment.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-center py-4 font-bold">No comments yet.</p>
                            )}
                        </div>

                        {/* Add Comment Form */}
                        <form onSubmit={handleAddComment} className="flex gap-2">
                            <input
                                type="text"
                                className="brutal-input flex-1"
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <Button type="submit" disabled={commenting || !newComment.trim()}>
                                {commenting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                            </Button>
                        </form>
                    </div>
                </div>
            ) : (
                <p className="text-red-500 font-bold">Task not found or you don't have access.</p>
            )}
        </Modal>
    );
};
