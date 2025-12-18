from django.contrib import admin
from .models import Organization, OrganizationMember, Invitation

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'business_name', 'contact_email', 'created_at')
    search_fields = ('name', 'slug', 'business_name', 'contact_email')

@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'organization', 'role', 'joined_at')
    list_filter = ('role', 'organization')
    search_fields = ('user__email', 'organization__name')

@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ('email', 'organization', 'invited_by', 'accepted', 'created_at')
    list_filter = ('accepted', 'organization')
    search_fields = ('email', 'organization__name')
