import { useState, useRef, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Activity, MessageSquare, CheckCircle, PlusCircle, ArrowRightLeft, Loader2, X, GripHorizontal, Minimize2, Maximize2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const GET_PROJECT_ACTIVITY = gql`
  query GetProjectActivity($projectId: Int!, $limit: Int) {
    projectActivity(projectId: $projectId, limit: $limit) {
      id
      action
      description
      userName
      createdAt
      task {
        id
        title
      }
    }
  }
`;

interface LiveActivityFeedProps {
    projectId: number;
}

const actionIcons: Record<string, any> = {
    TASK_CREATED: PlusCircle,
    TASK_UPDATED: Activity,
    TASK_MOVED: ArrowRightLeft,
    TASK_DELETED: Activity,
    COMMENT_ADDED: MessageSquare,
    PROJECT_CREATED: CheckCircle,
};

const actionColors: Record<string, string> = {
    TASK_CREATED: 'text-green-500',
    TASK_UPDATED: 'text-blue-500',
    TASK_MOVED: 'text-yellow-500',
    TASK_DELETED: 'text-red-500',
    COMMENT_ADDED: 'text-purple-500',
    PROJECT_CREATED: 'text-green-500',
};

export const LiveActivityFeed = ({ projectId }: LiveActivityFeedProps) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);
    const dragStartPos = useRef({ x: 0, y: 0 });

    const { data, loading } = useQuery(GET_PROJECT_ACTIVITY, {
        variables: { projectId, limit: 10 },
        pollInterval: 3000,
        fetchPolicy: 'network-only',
    });

    // Handle drag
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - dragStartPos.current.x,
                y: e.clientY - dragStartPos.current.y,
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // Minimized toggle button
    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 right-4 bg-brand-black text-white p-3 shadow-brutal border-2 border-brand-black hover:bg-gray-800 transition-colors z-50 flex items-center gap-2"
                title="Show Activity Feed"
            >
                <Activity size={20} />
                <span className="text-xs bg-green-500 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </button>
        );
    }

    const activities = data?.projectActivity || [];

    return (
        <div
            ref={dragRef}
            className="fixed z-50 bg-white border-2 border-brand-black shadow-brutal"
            style={{
                right: position.x === 0 ? '16px' : 'auto',
                top: position.y === 0 ? '96px' : 'auto',
                left: position.x !== 0 ? position.x : 'auto',
                transform: position.y !== 0 ? `translateY(${position.y}px)` : 'none',
                width: isMinimized ? 'auto' : '320px',
            }}
        >
            {/* Header - Draggable */}
            <div
                className="bg-brand-black text-white p-3 font-display font-bold uppercase flex items-center gap-2 cursor-move select-none"
                onMouseDown={handleMouseDown}
            >
                <GripHorizontal size={16} className="text-gray-400" />
                <Activity size={18} />
                {!isMinimized && <span>Live Activity</span>}
                <span className="text-xs bg-green-500 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>

                <div className="ml-auto flex gap-1">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1 hover:bg-white/20 rounded"
                        title={isMinimized ? 'Expand' : 'Minimize'}
                    >
                        {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-white/20 rounded"
                        title="Hide"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <div className="max-h-[300px] overflow-y-auto">
                    {loading && !data ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="animate-spin" size={20} />
                            <span className="ml-2 text-sm text-gray-500">Loading...</span>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center p-4 text-gray-400 text-sm">
                            No activity yet
                        </div>
                    ) : (
                        <div className="space-y-1 p-2">
                            {activities.map((activity: any) => {
                                const Icon = actionIcons[activity.action] || Activity;
                                const colorClass = actionColors[activity.action] || 'text-gray-500';

                                return (
                                    <div
                                        key={activity.id}
                                        className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded transition-colors"
                                    >
                                        <div className={`mt-0.5 ${colorClass}`}>
                                            <Icon size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs line-clamp-2">
                                                <span className="font-bold">{activity.userName}</span>{' '}
                                                {activity.description}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
