import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Plus, CheckCircle, Clock, ListTodo } from 'lucide-react';
import { BrutalCard } from '../components/ui/BrutalCard';
import { Button } from '../components/ui/Button';
import { ScriptBadge } from '../components/ui/ScriptBadge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const GET_PROJECTS = gql`
  query GetProjects {
    allProjects {
      id
      name
      description
      status
      taskCount
      completedCount
      inProgressCount
      todoCount
      completionRate
    }
  }
`;

const CREATE_PROJECT = gql`
  mutation CreateProject($organizationId: Int!, $name: String!, $description: String) {
    createProject(organizationId: $organizationId, name: $name, description: $description) {
      project {
        id
        name
      }
    }
  }
`;

export default function Dashboard() {
    const { isOwner, currentOrg } = useAuth();
    const { showToast, showError } = useToast();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDesc, setProjectDesc] = useState('');

    const FREE_TIER_PROJECT_LIMIT = 1;

    const { loading, error, data, refetch } = useQuery(GET_PROJECTS);

    const [createProject, { loading: creating }] = useMutation(CREATE_PROJECT, {
        onCompleted: () => {
            setShowCreateModal(false);
            setProjectName('');
            setProjectDesc('');
            refetch();
            showToast('success', 'Project Created', 'Your new project is ready!');
        },
        onError: (error) => {
            showError(error);
        }
    });

    const handleCreate = () => {
        if (!projectName.trim() || !currentOrg) return;
        createProject({
            variables: {
                organizationId: parseInt(currentOrg.id),
                name: projectName,
                description: projectDesc || null
            }
        });
    };

    const handleOpenCreateModal = () => {
        if (projects.length >= FREE_TIER_PROJECT_LIMIT) {
            showToast('warning', 'Project Limit Reached', `Free tier allows ${FREE_TIER_PROJECT_LIMIT} project. Upgrade to Pro for unlimited projects.`);
            return;
        }
        setShowCreateModal(true);
    };

    if (loading) return <div className="text-2xl font-display animate-pulse">LOADING...</div>;
    if (error) return <div className="text-red-600 font-bold border-2 border-red-600 p-4">ERROR: {error.message}</div>;

    // Calculate overall stats
    const projects = data.allProjects || [];
    const totalTasks = projects.reduce((sum: number, p: any) => sum + (p.taskCount || 0), 0);
    const totalDone = projects.reduce((sum: number, p: any) => sum + (p.completedCount || 0), 0);
    const totalInProgress = projects.reduce((sum: number, p: any) => sum + (p.inProgressCount || 0), 0);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl mb-2">Dashboard</h1>
                    <p className="text-xl font-body text-gray-600 max-w-2xl">
                        Manage your chaos. Organize your brutal reality.
                    </p>
                </div>
                {isOwner && (
                    <Button onClick={handleOpenCreateModal}>
                        <Plus size={20} strokeWidth={3} />
                        New Project
                    </Button>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <BrutalCard className="p-4 bg-brand-yellow">
                    <p className="text-sm font-bold uppercase text-gray-700">Projects</p>
                    <p className="text-4xl font-black">{projects.length}</p>
                </BrutalCard>
                <BrutalCard className="p-4">
                    <p className="text-sm font-bold uppercase text-gray-500 flex items-center gap-2">
                        <ListTodo size={16} /> Total Tasks
                    </p>
                    <p className="text-4xl font-black">{totalTasks}</p>
                </BrutalCard>
                <BrutalCard className="p-4">
                    <p className="text-sm font-bold uppercase text-gray-500 flex items-center gap-2">
                        <Clock size={16} /> In Progress
                    </p>
                    <p className="text-4xl font-black text-amber-500">{totalInProgress}</p>
                </BrutalCard>
                <BrutalCard className="p-4">
                    <p className="text-sm font-bold uppercase text-gray-500 flex items-center gap-2">
                        <CheckCircle size={16} /> Completed
                    </p>
                    <p className="text-4xl font-black text-green-500">{totalDone}</p>
                </BrutalCard>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project: any) => (
                    <Link key={project.id} to={`/projects/${project.id}`} className="block group">
                        <BrutalCard className="h-full flex flex-col justify-between group-hover:-translate-y-2 transition-transform">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-2xl font-bold line-clamp-2">{project.name}</h3>
                                    <div className={`w-3 h-3 border-2 border-brand-black rounded-full ${project.status === 'ACTIVE' ? 'bg-green-400' : 'bg-gray-300'}`} />
                                </div>
                                <p className="font-body text-gray-500 mb-4 line-clamp-2">
                                    {project.description || "No description provided."}
                                </p>

                                {/* Progress Bar */}
                                <div className="mb-2">
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span>{project.completionRate}% Complete</span>
                                        <span>{project.completedCount}/{project.taskCount} tasks</span>
                                    </div>
                                    <div className="h-3 bg-gray-200 border-2 border-brand-black overflow-hidden">
                                        <div
                                            className="h-full bg-green-400 transition-all"
                                            style={{ width: `${project.completionRate}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Task Breakdown */}
                                <div className="flex gap-3 text-xs font-bold">
                                    <span className="text-gray-400">{project.todoCount} todo</span>
                                    <span className="text-amber-500">{project.inProgressCount} doing</span>
                                    <span className="text-green-500">{project.completedCount} done</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center border-t-2 border-brand-black pt-4 mt-4">
                                <span className="font-bold text-sm text-gray-400">ID: #{project.id}</span>
                                {project.status === 'ACTIVE' && (
                                    <ScriptBadge className="text-sm px-2 py-0 bg-white rotate-2 group-hover:rotate-0 transition-transform">
                                        Active
                                    </ScriptBadge>
                                )}
                            </div>
                        </BrutalCard>
                    </Link>
                ))}

                {projects.length === 0 && (
                    <BrutalCard className="border-dashed flex items-center justify-center p-12 bg-gray-50 col-span-full">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-gray-400">No Projects</h3>
                            <p className="mb-4 text-gray-500">Create your first project to get started.</p>
                            {isOwner && (
                                <Button onClick={() => setShowCreateModal(true)}>Create Project</Button>
                            )}
                        </div>
                    </BrutalCard>
                )}
            </div>

            {/* Create Project Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Project">
                <div className="space-y-4">
                    <Input
                        label="Project Name"
                        placeholder="e.g., Website Redesign"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        autoFocus
                    />
                    <div className="flex flex-col gap-2">
                        <label className="font-display font-bold uppercase tracking-wider text-sm">Description</label>
                        <textarea
                            className="brutal-input min-h-[80px] resize-none"
                            placeholder="What's this project about?"
                            value={projectDesc}
                            onChange={(e) => setProjectDesc(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 pt-4 border-t-2 border-brand-black">
                        <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={creating || !projectName.trim()} className="flex-1">
                            {creating ? 'Creating...' : 'Create Project'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
