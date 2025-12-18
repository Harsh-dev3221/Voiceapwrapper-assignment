import graphene
import graphql_jwt
from graphene_django import DjangoObjectType
from django.contrib.auth import get_user_model
from django.utils.text import slugify
import secrets

from organizations.models import Organization, OrganizationMember, Invitation

User = get_user_model()


class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name']


class OrganizationMemberType(DjangoObjectType):
    class Meta:
        model = OrganizationMember
        fields = '__all__'


class Query(graphene.ObjectType):
    me = graphene.Field(UserType)
    my_organizations = graphene.List('organizations.schema.OrganizationType')
    my_membership = graphene.Field(OrganizationMemberType, organization_id=graphene.Int(required=True))

    def resolve_me(self, info):
        user = info.context.user
        if user.is_anonymous:
            return None
        return user

    def resolve_my_organizations(self, info):
        user = info.context.user
        if user.is_anonymous:
            return []
        memberships = OrganizationMember.objects.filter(user=user).select_related('organization')
        return [m.organization for m in memberships]

    def resolve_my_membership(self, info, organization_id):
        user = info.context.user
        if user.is_anonymous:
            return None
        return OrganizationMember.objects.filter(user=user, organization_id=organization_id).first()


class RegisterOwner(graphene.Mutation):
    """Register a new Owner with their Organization"""
    class Arguments:
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        first_name = graphene.String(required=True)
        last_name = graphene.String(required=True)
        business_name = graphene.String(required=True)
        address = graphene.String()

    user = graphene.Field(UserType)
    organization = graphene.Field('organizations.schema.OrganizationType')
    token = graphene.String()

    def mutate(self, info, email, password, first_name, last_name, business_name, address=None):
        # Create User
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Create Organization
        slug = slugify(business_name)
        # Ensure unique slug
        base_slug = slug
        counter = 1
        while Organization.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
            
        org = Organization.objects.create(
            name=business_name,
            slug=slug,
            contact_email=email,
            business_name=business_name,
            address=address or ""
        )
        
        # Create Membership as Owner
        OrganizationMember.objects.create(
            user=user,
            organization=org,
            role='OWNER'
        )
        
        # Generate JWT token
        from graphql_jwt.shortcuts import get_token
        token = get_token(user)
        
        return RegisterOwner(user=user, organization=org, token=token)


class InviteMember(graphene.Mutation):
    """Owner invites a new member to their organization"""
    class Arguments:
        email = graphene.String(required=True)
        organization_id = graphene.Int(required=True)

    success = graphene.Boolean()
    invite_token = graphene.String()

    def mutate(self, info, email, organization_id):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Not authenticated")
        
        # Check if user is owner of this org
        membership = OrganizationMember.objects.filter(
            user=user, 
            organization_id=organization_id, 
            role='OWNER'
        ).first()
        
        if not membership:
            raise Exception("Only owners can invite members")
        
        # Create invitation
        token = secrets.token_urlsafe(32)
        Invitation.objects.create(
            email=email,
            organization_id=organization_id,
            invited_by=user,
            token=token
        )
        
        return InviteMember(success=True, invite_token=token)


class AcceptInvite(graphene.Mutation):
    """Accept an invitation and create account"""
    class Arguments:
        token = graphene.String(required=True)
        password = graphene.String(required=True)
        first_name = graphene.String(required=True)
        last_name = graphene.String(required=True)

    user = graphene.Field(UserType)
    auth_token = graphene.String()

    def mutate(self, info, token, password, first_name, last_name):
        try:
            invite = Invitation.objects.get(token=token, accepted=False)
        except Invitation.DoesNotExist:
            raise Exception("Invalid or expired invitation")
        
        # Create User
        user = User.objects.create_user(
            username=invite.email,
            email=invite.email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Create Membership as Member
        OrganizationMember.objects.create(
            user=user,
            organization=invite.organization,
            role='MEMBER'
        )
        
        # Mark invite as accepted
        invite.accepted = True
        invite.save()
        
        # Generate JWT token
        from graphql_jwt.shortcuts import get_token
        auth_token = get_token(user)
        
        return AcceptInvite(user=user, auth_token=auth_token)


class Mutation(graphene.ObjectType):
    # JWT mutations
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()
    
    # Custom mutations
    register_owner = RegisterOwner.Field()
    invite_member = InviteMember.Field()
    accept_invite = AcceptInvite.Field()
