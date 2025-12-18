from django.contrib import admin
from .models import Project, Task, TaskComment

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'status', 'due_date', 'created_at')
    list_filter = ('status', 'organization')
    search_fields = ('name', 'description')

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'status', 'due_date', 'created_at')
    list_filter = ('status', 'project')
    search_fields = ('title', 'description')
    filter_horizontal = ('assignees',)  # Nice widget for ManyToMany

@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ('task', 'author', 'timestamp')
    search_fields = ('content',)
