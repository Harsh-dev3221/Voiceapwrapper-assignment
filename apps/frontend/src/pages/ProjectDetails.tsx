import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    useDraggable,
    useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { BrutalCard } from '../components/ui/BrutalCard';
import { ScriptBadge } from '../components/ui/ScriptBadge';
import { Button } from '../components/ui/Button';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LiveActivityFeed } from '../components/LiveActivityFeed';
import { GripVertical, Plus } from 'lucide-react';

const GET_PROJECT = gql`
  query GetProject($id: Int!) {
    project(id: $id) {
      id
      name
      description
      tasks {
        id
        title
        status
        assignees {
          id
          email
          firstName
        }
      }
    }
  }
`;

const UPDATE_TASK_STATUS = gql`
  mutation UpdateTaskStatus($id: Int!, $status: String!) {
    updateTask(id: $id, status: $status) {
      task {
        id
        status
      }
    }
  }
`;

// Draggable Task Card
const DraggableTask = ({ task, onClick, isOwner }: { task: any; onClick: () => void; isOwner: boolean }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task },
        disabled: !isOwner,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style}>
            <BrutalCard
                className={`p-4 group transition-all cursor-pointer ${isDragging ? 'rotate-2 scale-105' : 'hover:rotate-1'}`}
                onClick={onClick}
            >
                <div className="flex items-start gap-2">
                    {isOwner && (
                        <div
                            {...listeners}
                            {...attributes}
                            className="cursor-grab active:cursor-grabbing p-1 -ml-2 hover:bg-gray-100 rounded"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GripVertical size={16} className="text-gray-400" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold mb-2 leading-tight font-display">{task.title}</h4>
                        <div className="text-xs font-bold text-gray-500 border-t-2 border-gray-100 pt-2">
                            {task.assignees?.length > 0
                                ? task.assignees.map((u: any) => u.firstName || u.email).join(', ')
                                : 'Unassigned'}
                        </div>
                    </div>
                </div>
            </BrutalCard>
        </div>
    );
};

// Droppable Column
const DroppableColumn = ({
    id,
    title,
    tasks,
    onTaskClick,
    onAddTask,
    isOwner
}: {
    id: string;
    title: string;
    tasks: any[];
    onTaskClick: (taskId: number) => void;
    onAddTask: () => void;
    isOwner: boolean;
}) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div className="flex-1 w-full lg:min-w-[300px]">
            <div className="bg-brand-black text-white p-3 font-display font-bold text-xl uppercase tracking-wider mb-4 border-2 border-brand-black shadow-brutal flex justify-between items-center">
                <span>{title}</span>
                <span className="font-body text-sm text-brand-yellow font-bold bg-white/20 px-2 rounded-full">
                    {tasks.length}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className={`space-y-4 min-h-[200px] p-2 -m-2 rounded transition-colors ${isOver ? 'bg-yellow-100 border-2 border-dashed border-brand-yellow' : ''
                    }`}
            >
                {tasks.map(task => (
                    <DraggableTask
                        key={task.id}
                        task={task}
                        onClick={() => onTaskClick(parseInt(task.id))}
                        isOwner={isOwner}
                    />
                ))}

                {tasks.length === 0 && (
                    <div className="border-2 border-dashed border-gray-300 p-8 text-center">
                        <p className="font-bold text-gray-300 text-lg">
                            {isOver ? 'DROP HERE' : 'EMPTY'}
                        </p>
                    </div>
                )}

                {id === 'TODO' && isOwner && (
                    <button
                        onClick={onAddTask}
                        className="w-full py-3 border-2 border-dashed border-gray-400 font-bold text-gray-400 hover:border-brand-black hover:text-brand-black hover:bg-yellow-50 transition-colors uppercase flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Add Task
                    </button>
                )}
            </div>
        </div>
    );
};

export default function ProjectDetails() {
    const { projectId } = useParams();
    const numericProjectId = parseInt(projectId || '0');
    const { isOwner } = useAuth();
    const { showToast, showError } = useToast();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [activeTask, setActiveTask] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    const { loading, error, data, refetch } = useQuery(GET_PROJECT, {
        variables: { id: numericProjectId }
    });

    const [updateStatus] = useMutation(UPDATE_TASK_STATUS, {
        onCompleted: () => {
            refetch();
            showToast('success', 'Task Moved', 'Status updated successfully');
        },
        onError: (error) => showError(error),
    });

    const handleDragStart = (event: DragStartEvent) => {
        setActiveTask(event.active.data.current?.task);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = parseInt(active.id as string);
        const newStatus = over.id as string;
        const task = data?.project?.tasks?.find((t: any) => t.id === active.id);

        if (task && task.status !== newStatus) {
            updateStatus({
                variables: { id: taskId, status: newStatus },
                optimisticResponse: {
                    updateTask: {
                        __typename: 'UpdateTask',
                        task: {
                            __typename: 'TaskType',
                            id: taskId,
                            status: newStatus,
                        },
                    },
                },
            });
        }
    };

    if (loading) return <div className="p-12 text-5xl font-display font-black text-gray-200 animate-pulse uppercase">Loading...</div>;
    if (error) return (
        <div className="p-8 border-4 border-red-500 bg-red-50 text-red-600 font-bold text-xl uppercase">
            Error: {error.message}
        </div>
    );

    const { project } = data;
    const tasks = project.tasks || [];

    const todoTasks = tasks.filter((t: any) => t.status === 'TODO');
    const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS');
    const doneTasks = tasks.filter((t: any) => t.status === 'DONE');

    return (
        <div className="h-full flex flex-col">
            <div className="mb-8 border-b-2 border-brand-black pb-6 flex justify-between items-start bg-white p-6 shadow-brutal border-2 relative z-10">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-4xl lg:text-5xl font-black italic tracking-tighter">{project.name}</h1>
                        <ScriptBadge className="rotate-3 bg-brand-yellow text-sm">active project</ScriptBadge>
                    </div>
                    <p className="text-xl max-w-3xl font-body text-gray-600 font-medium">{project.description}</p>
                    {isOwner && (
                        <p className="text-sm text-gray-400 mt-2 font-bold">💡 Drag tasks to move between columns</p>
                    )}
                </div>
                {isOwner && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={20} strokeWidth={3} />
                        New Task
                    </Button>
                )}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4 h-full items-start w-full">
                    <DroppableColumn
                        id="TODO"
                        title="To Do"
                        tasks={todoTasks}
                        onTaskClick={setSelectedTaskId}
                        onAddTask={() => setIsCreateModalOpen(true)}
                        isOwner={isOwner}
                    />
                    <DroppableColumn
                        id="IN_PROGRESS"
                        title="Doing"
                        tasks={inProgressTasks}
                        onTaskClick={setSelectedTaskId}
                        onAddTask={() => setIsCreateModalOpen(true)}
                        isOwner={isOwner}
                    />
                    <DroppableColumn
                        id="DONE"
                        title="Done"
                        tasks={doneTasks}
                        onTaskClick={setSelectedTaskId}
                        onAddTask={() => setIsCreateModalOpen(true)}
                        isOwner={isOwner}
                    />
                </div>

                <DragOverlay>
                    {activeTask ? (
                        <BrutalCard className="p-4 rotate-3 scale-105 shadow-2xl">
                            <h4 className="text-lg font-bold leading-tight font-display">{activeTask.title}</h4>
                        </BrutalCard>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Floating Activity Feed */}
            <LiveActivityFeed projectId={numericProjectId} />

            {/* Modals */}
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                projectId={numericProjectId}
                onTaskCreated={refetch}
            />

            <TaskDetailModal
                isOpen={selectedTaskId !== null}
                onClose={() => setSelectedTaskId(null)}
                taskId={selectedTaskId}
                onTaskUpdated={refetch}
            />
        </div>
    );
}
