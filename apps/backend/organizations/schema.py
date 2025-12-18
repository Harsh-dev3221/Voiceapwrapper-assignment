import graphene
from graphene_django import DjangoObjectType
from .models import Organization, OrganizationMember
from core.schema import UserType


class OrganizationType(DjangoObjectType):
    class Meta:
        model = Organization
        fields = "__all__"


class OrganizationMemberType(DjangoObjectType):
    user = graphene.Field(UserType)
    
    class Meta:
        model = OrganizationMember
        fields = "__all__"


class Query(graphene.ObjectType):
    # Only expose organization data to authenticated users
    my_organizations = graphene.List(OrganizationType)
    organization = graphene.Field(OrganizationType, id=graphene.Int(), slug=graphene.String())
    organization_members = graphene.List(OrganizationMemberType, organization_id=graphene.Int(required=True))

    def resolve_my_organizations(self, info):
        """Returns only organizations the user belongs to"""
        user = info.context.user
        if user.is_anonymous:
            return []
        memberships = OrganizationMember.objects.filter(user=user).select_related('organization')
        return [m.organization for m in memberships]

    def resolve_organization(self, info, id=None, slug=None):
        """Returns org only if user is a member"""
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Not authenticated")
        
        org = None
        if id:
            org = Organization.objects.get(pk=id)
        elif slug:
            org = Organization.objects.get(slug=slug)
        
        if org is None:
            return None
        
        # Check if user belongs to this org
        if not OrganizationMember.objects.filter(user=user, organization=org).exists():
            raise Exception("You don't have access to this organization")
        
        return org
    
    def resolve_organization_members(self, info, organization_id):
        """Returns members only if user belongs to the org"""
        user = info.context.user
        if user.is_anonymous:
            return []
        
        # Check if user belongs to this org
        if not OrganizationMember.objects.filter(user=user, organization_id=organization_id).exists():
            raise Exception("You don't have access to this organization")
        
        return OrganizationMember.objects.filter(organization_id=organization_id).select_related('user')


class Mutation(graphene.ObjectType):
    # Note: Organization creation is done via RegisterOwner in core/schema.py
    # No direct CreateOrganization mutation exposed - orgs are created during owner registration
    pass
