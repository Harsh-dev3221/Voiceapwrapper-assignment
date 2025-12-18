"""
Comprehensive tests for the project management GraphQL API.
Tests cover authentication, authorization, CRUD operations, and data isolation.
"""
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from graphene.test import Client
from api.schema import schema
from organizations.models import Organization, OrganizationMember
from projects.models import Project, Task, TaskComment

User = get_user_model()


class MockContext:
    """Mock request context for GraphQL testing"""
    def __init__(self, user=None):
        self.user = user if user else type('AnonymousUser', (), {'is_anonymous': True})()


class OrganizationIsolationTests(TestCase):
    """Tests for multi-tenancy and data isolation"""
    
    def setUp(self):
        # Create two separate organizations
        self.org1 = Organization.objects.create(name='Org 1', slug='org-1', contact_email='org1@test.com')
        self.org2 = Organization.objects.create(name='Org 2', slug='org-2', contact_email='org2@test.com')
        
        # Create users
        self.owner1 = User.objects.create_user('owner1@test.com', 'owner1@test.com', 'pass')
        self.owner2 = User.objects.create_user('owner2@test.com', 'owner2@test.com', 'pass')
        self.member1 = User.objects.create_user('member1@test.com', 'member1@test.com', 'pass')
        
        # Create memberships
        OrganizationMember.objects.create(user=self.owner1, organization=self.org1, role='OWNER')
        OrganizationMember.objects.create(user=self.owner2, organization=self.org2, role='OWNER')
        OrganizationMember.objects.create(user=self.member1, organization=self.org1, role='MEMBER')
        
        # Create projects
        self.project1 = Project.objects.create(name='Project 1', organization=self.org1)
        self.project2 = Project.objects.create(name='Project 2', organization=self.org2)
        
        # Create tasks
        self.task1 = Task.objects.create(title='Task 1', project=self.project1)
        self.task2 = Task.objects.create(title='Task 2', project=self.project2)
        
        self.client = Client(schema)
    
    def test_owner_can_only_see_own_org_projects(self):
        """Owner should only see projects from their organization"""
        query = '''
            query {
                allProjects {
                    id
                    name
                }
            }
        '''
        result = self.client.execute(query, context=MockContext(self.owner1))
        projects = result['data']['allProjects']
        
        self.assertEqual(len(projects), 1)
        self.assertEqual(projects[0]['name'], 'Project 1')
    
    def test_owner_cannot_access_other_org_project(self):
        """Owner should not be able to access another org's project"""
        query = '''
            query {
                project(id: %d) {
                    id
                    name
                }
            }
        ''' % self.project2.id
        result = self.client.execute(query, context=MockContext(self.owner1))
        
        self.assertIsNotNone(result.get('errors'))
    
    def test_unauthenticated_user_sees_no_projects(self):
        """Anonymous users should see no projects"""
        query = '''
            query {
                allProjects {
                    id
                }
            }
        '''
        result = self.client.execute(query, context=MockContext())
        self.assertEqual(len(result['data']['allProjects']), 0)


class OwnerPermissionTests(TestCase):
    """Tests for owner-only operations"""
    
    def setUp(self):
        self.org = Organization.objects.create(name='Test Org', slug='test-org', contact_email='test@test.com')
        self.owner = User.objects.create_user('owner@test.com', 'owner@test.com', 'pass')
        self.member = User.objects.create_user('member@test.com', 'member@test.com', 'pass')
        
        OrganizationMember.objects.create(user=self.owner, organization=self.org, role='OWNER')
        OrganizationMember.objects.create(user=self.member, organization=self.org, role='MEMBER')
        
        self.project = Project.objects.create(name='Test Project', organization=self.org)
        self.client = Client(schema)
    
    def test_owner_can_create_task(self):
        """Owner should be able to create tasks"""
        mutation = '''
            mutation {
                createTask(projectId: %d, title: "New Task") {
                    task {
                        id
                        title
                    }
                }
            }
        ''' % self.project.id
        result = self.client.execute(mutation, context=MockContext(self.owner))
        
        self.assertIsNone(result.get('errors'))
        self.assertEqual(result['data']['createTask']['task']['title'], 'New Task')
    
    def test_member_cannot_create_task(self):
        """Member should NOT be able to create tasks"""
        mutation = '''
            mutation {
                createTask(projectId: %d, title: "New Task") {
                    task {
                        id
                    }
                }
            }
        ''' % self.project.id
        result = self.client.execute(mutation, context=MockContext(self.member))
        
        self.assertIsNotNone(result.get('errors'))
        self.assertIn('Only owners can create tasks', str(result['errors']))


class TaskAssignmentTests(TestCase):
    """Tests for task assignment and visibility"""
    
    def setUp(self):
        self.org = Organization.objects.create(name='Test Org', slug='test-org', contact_email='test@test.com')
        self.owner = User.objects.create_user('owner@test.com', 'owner@test.com', 'pass')
        self.member = User.objects.create_user('member@test.com', 'member@test.com', 'pass')
        
        OrganizationMember.objects.create(user=self.owner, organization=self.org, role='OWNER')
        OrganizationMember.objects.create(user=self.member, organization=self.org, role='MEMBER')
        
        self.project = Project.objects.create(name='Test Project', organization=self.org)
        
        # Task assigned to member
        self.assigned_task = Task.objects.create(title='Assigned Task', project=self.project)
        self.assigned_task.assignees.add(self.member)
        
        # Task not assigned to member
        self.unassigned_task = Task.objects.create(title='Unassigned Task', project=self.project)
        
        self.client = Client(schema)
    
    def test_member_can_access_assigned_task(self):
        """Member should be able to access tasks assigned to them"""
        query = '''
            query {
                task(id: %d) {
                    id
                    title
                }
            }
        ''' % self.assigned_task.id
        result = self.client.execute(query, context=MockContext(self.member))
        
        self.assertIsNone(result.get('errors'))
        self.assertEqual(result['data']['task']['title'], 'Assigned Task')
    
    def test_member_cannot_access_unassigned_task(self):
        """Member should NOT be able to access tasks not assigned to them"""
        query = '''
            query {
                task(id: %d) {
                    id
                    title
                }
            }
        ''' % self.unassigned_task.id
        result = self.client.execute(query, context=MockContext(self.member))
        
        self.assertIsNotNone(result.get('errors'))


class FilteringTests(TestCase):
    """Tests for complex filtering functionality"""
    
    def setUp(self):
        self.org = Organization.objects.create(name='Test Org', slug='test-org', contact_email='test@test.com')
        self.owner = User.objects.create_user('owner@test.com', 'owner@test.com', 'pass')
        self.member = User.objects.create_user('member@test.com', 'member@test.com', 'pass')
        
        OrganizationMember.objects.create(user=self.owner, organization=self.org, role='OWNER')
        
        self.project = Project.objects.create(name='Test Project', organization=self.org)
        
        # Create tasks with different statuses
        Task.objects.create(title='Todo 1', project=self.project, status='TODO')
        Task.objects.create(title='Todo 2', project=self.project, status='TODO')
        Task.objects.create(title='In Progress', project=self.project, status='IN_PROGRESS')
        Task.objects.create(title='Done', project=self.project, status='DONE')
        
        self.client = Client(schema)
    
    def test_filter_by_status(self):
        """Should be able to filter tasks by status"""
        query = '''
            query {
                filteredTasks(projectId: %d, status: "TODO") {
                    title
                }
            }
        ''' % self.project.id
        result = self.client.execute(query, context=MockContext(self.owner))
        
        self.assertEqual(len(result['data']['filteredTasks']), 2)
    
    def test_search_by_title(self):
        """Should be able to search tasks by title"""
        query = '''
            query {
                filteredTasks(projectId: %d, search: "Progress") {
                    title
                }
            }
        ''' % self.project.id
        result = self.client.execute(query, context=MockContext(self.owner))
        
        self.assertEqual(len(result['data']['filteredTasks']), 1)
        self.assertEqual(result['data']['filteredTasks'][0]['title'], 'In Progress')
