import graphene
from graphene_django import DjangoObjectType
from django.contrib.auth import get_user_model
from .models import Project, Task, TaskComment, Activity
from organizations.models import OrganizationMember

User = get_user_model()


class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'firstName', 'lastName']


class ActivityType(DjangoObjectType):
    user_name = graphene.String()
    
    class Meta:
        model = Activity
        fields = ['id', 'action', 'description', 'created_at', 'task']
    
    def resolve_user_name(self, info):
        first = self.user.first_name or ''
        last = self.user.last_name or ''
        full_name = f"{first} {last}".strip()
        return full_name if full_name else self.user.email


class ProjectType(DjangoObjectType):
    task_count = graphene.Int()
    completed_count = graphene.Int()
    in_progress_count = graphene.Int()
    todo_count = graphene.Int()
    completion_rate = graphene.Float()
    
    class Meta:
        model = Project
        fields = "__all__"
    
    def resolve_task_count(self, info):
        return self.tasks.count()
    
    def resolve_completed_count(self, info):
        return self.tasks.filter(status='DONE').count()
    
    def resolve_in_progress_count(self, info):
        return self.tasks.filter(status='IN_PROGRESS').count()
    
    def resolve_todo_count(self, info):
        return self.tasks.filter(status='TODO').count()
    
    def resolve_completion_rate(self, info):
        total = self.tasks.count()
        if total == 0:
            return 0.0
        done = self.tasks.filter(status='DONE').count()
        return round((done / total) * 100, 1)


class TaskType(DjangoObjectType):
    assignees = graphene.List(UserType)
    
    class Meta:
        model = Task
        fields = "__all__"
    
    def resolve_assignees(self, info):
        return self.assignees.all()


class TaskCommentType(DjangoObjectType):
    class Meta:
        model = TaskComment
        fields = "__all__"


def get_user_role(user, project):
    """Get user's role for the project's organization"""
    if user.is_anonymous:
        return None
    membership = OrganizationMember.objects.filter(
        user=user,
        organization=project.organization
    ).first()
    return membership.role if membership else None


class Query(graphene.ObjectType):
    all_projects = graphene.List(ProjectType)
    project = graphene.Field(ProjectType, id=graphene.Int())
    organization_projects = graphene.List(ProjectType, organization_id=graphene.Int(required=True))
    task = graphene.Field(TaskType, id=graphene.Int(required=True))
    my_assigned_tasks = graphene.List(TaskType, project_id=graphene.Int(required=True))
    
    # Advanced filtering
    filtered_tasks = graphene.List(
        TaskType,
        project_id=graphene.Int(required=True),
        status=graphene.String(),
        assignee_id=graphene.Int(),
        search=graphene.String(),
    )
    
    # Real-time activity feed
    project_activity = graphene.List(
        ActivityType,
        project_id=graphene.Int(required=True),
        limit=graphene.Int(default_value=20),
    )


    def resolve_all_projects(self, info):
        user = info.context.user
        if user.is_anonymous:
            return []
        # Only return projects from orgs the user belongs to
        user_org_ids = OrganizationMember.objects.filter(user=user).values_list('organization_id', flat=True)
        return Project.objects.filter(organization_id__in=user_org_ids)

    def resolve_project(self, info, id):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Not authenticated")
        
        project = Project.objects.get(pk=id)
        
        # Check if user belongs to this project's organization
        membership = OrganizationMember.objects.filter(user=user, organization=project.organization).first()
        if not membership:
            raise Exception("You don't have access to this project")
        
        return project

    def resolve_organization_projects(self, info, organization_id):
        user = info.context.user
        if user.is_anonymous:
            return []
        # Verify user belongs to this org
        if not OrganizationMember.objects.filter(user=user, organization_id=organization_id).exists():
            return []
        return Project.objects.filter(organization_id=organization_id)

    def resolve_task(self, info, id):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Not authenticated")
        
        task = Task.objects.prefetch_related('comments', 'assignees').get(pk=id)
        
        # Check if user belongs to the task's project's organization
        role = get_user_role(user, task.project)
        if role is None:
            raise Exception("You don't have access to this task")
        if role == 'MEMBER' and user not in task.assignees.all():
            raise Exception("You don't have access to this task")
        
        return task
    
    def resolve_my_assigned_tasks(self, info, project_id):
        user = info.context.user
        if user.is_anonymous:
            return []
        return Task.objects.filter(project_id=project_id, assignees=user)
    
    def resolve_filtered_tasks(self, info, project_id, status=None, assignee_id=None, search=None):
        user = info.context.user
        if user.is_anonymous:
            return []
        
        # Verify project access
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return []
        
        if not OrganizationMember.objects.filter(user=user, organization=project.organization).exists():
            return []
        
        queryset = Task.objects.filter(project_id=project_id)
        
        # Apply filters
        if status:
            queryset = queryset.filter(status=status)
        if assignee_id:
            queryset = queryset.filter(assignees__id=assignee_id)
        if search:
            queryset = queryset.filter(title__icontains=search)
        
        return queryset.distinct()
    
    def resolve_project_activity(self, info, project_id, limit=20):
        user = info.context.user
        if user.is_anonymous:
            return []
        
        # Verify project access
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return []
        
        if not OrganizationMember.objects.filter(user=user, organization=project.organization).exists():
            return []
        
        return Activity.objects.filter(project_id=project_id).select_related('user', 'task')[:limit]


class CreateProject(graphene.Mutation):
    class Arguments:
        organization_id = graphene.Int(required=True)
        name = graphene.String(required=True)
        description = graphene.String()
        status = graphene.String()
        due_date = graphene.Date()

    project = graphene.Field(ProjectType)

    def mutate(self, info, organization_id, name, **kwargs):
        user = info.context.user
        # Check if user is owner
        membership = OrganizationMember.objects.filter(
            user=user, organization_id=organization_id, role='OWNER'
        ).first()
        if not membership:
            raise Exception("Only owners can create projects")
        
        project = Project(organization_id=organization_id, name=name, **kwargs)
        project.save()
        return CreateProject(project=project)


class CreateTask(graphene.Mutation):
    class Arguments:
        project_id = graphene.Int(required=True)
        title = graphene.String(required=True)
        description = graphene.String()
        assignee_ids = graphene.List(graphene.Int)

    task = graphene.Field(TaskType)

    def mutate(self, info, project_id, title, description=None, assignee_ids=None):
        user = info.context.user
        project = Project.objects.get(pk=project_id)
        
        # Check if user is owner
        role = get_user_role(user, project)
        if role != 'OWNER':
            raise Exception("Only owners can create tasks")
        
        task = Task(project=project, title=title, description=description or "")
        task.save()
        
        # Add assignees
        if assignee_ids:
            assignees = User.objects.filter(id__in=assignee_ids)
            task.assignees.set(assignees)
        
        # Log activity
        Activity.objects.create(
            project=project,
            user=user,
            action='TASK_CREATED',
            description=f'created task "{title}"',
            task=task
        )
        
        return CreateTask(task=task)


class UpdateTask(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        title = graphene.String()
        description = graphene.String()
        status = graphene.String()
        assignee_ids = graphene.List(graphene.Int)

    task = graphene.Field(TaskType)

    def mutate(self, info, id, assignee_ids=None, **kwargs):
        user = info.context.user
        task = Task.objects.get(pk=id)
        old_status = task.status
        
        # Check if user is owner
        role = get_user_role(user, task.project)
        if role != 'OWNER':
            raise Exception("Only owners can edit tasks")
        
        # Update fields
        for key, value in kwargs.items():
            if value is not None:
                setattr(task, key, value)
        task.save()
        
        # Update assignees if provided
        if assignee_ids is not None:
            assignees = User.objects.filter(id__in=assignee_ids)
            task.assignees.set(assignees)
        
        # Log activity
        if 'status' in kwargs and kwargs['status'] != old_status:
            Activity.objects.create(
                project=task.project,
                user=user,
                action='TASK_MOVED',
                description=f'moved "{task.title}" from {old_status} to {kwargs["status"]}',
                task=task
            )
        else:
            Activity.objects.create(
                project=task.project,
                user=user,
                action='TASK_UPDATED',
                description=f'updated task "{task.title}"',
                task=task
            )
        
        return UpdateTask(task=task)


class DeleteTask(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)

    success = graphene.Boolean()

    def mutate(self, info, id):
        user = info.context.user
        task = Task.objects.get(pk=id)
        
        # Check if user is owner
        role = get_user_role(user, task.project)
        if role != 'OWNER':
            raise Exception("Only owners can delete tasks")
        
        task.delete()
        return DeleteTask(success=True)


class CreateComment(graphene.Mutation):
    class Arguments:
        task_id = graphene.Int(required=True)
        content = graphene.String(required=True)

    comment = graphene.Field(TaskCommentType)

    def mutate(self, info, task_id, content):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Must be logged in to comment")
        
        task = Task.objects.get(pk=task_id)
        
        # Check if user can access this task
        role = get_user_role(user, task.project)
        if role == 'MEMBER' and user not in task.assignees.all():
            raise Exception("You don't have access to this task")
        
        comment = TaskComment(task=task, content=content, author=user)
        comment.save()
        return CreateComment(comment=comment)


class Mutation(graphene.ObjectType):
    create_project = CreateProject.Field()
    create_task = CreateTask.Field()
    create_comment = CreateComment.Field()
    update_task = UpdateTask.Field()
    delete_task = DeleteTask.Field()
