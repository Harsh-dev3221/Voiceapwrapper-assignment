# API Documentation

This document provides a complete reference for the GraphQL API.

## Base URL

- **Development**: `http://localhost:8000/graphql`
- **GraphQL Playground**: `http://localhost:8000/graphql` (with graphiql=True)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: JWT <your-token>
```

---

## GraphQL Schema

### Types

#### UserType
```graphql
type UserType {
  id: ID!
  email: String!
  username: String!
  firstName: String
  lastName: String
}
```

#### OrganizationType
```graphql
type OrganizationType {
  id: ID!
  name: String!
  slug: String!
  contactEmail: String!
  businessName: String
  address: String
  createdAt: DateTime!
}
```

#### OrganizationMemberType
```graphql
type OrganizationMemberType {
  id: ID!
  user: UserType!
  organization: OrganizationType!
  role: String!  # "OWNER" or "MEMBER"
  joinedAt: DateTime!
}
```

#### ProjectType
```graphql
type ProjectType {
  id: ID!
  name: String!
  description: String
  status: String!      # "ACTIVE", "COMPLETED", "ON_HOLD"
  dueDate: Date
  createdAt: DateTime!
  
  # Computed fields
  taskCount: Int!
  completedCount: Int!
  inProgressCount: Int!
  todoCount: Int!
  completionRate: Float!
}
```

#### TaskType
```graphql
type TaskType {
  id: ID!
  title: String!
  description: String
  status: String!      # "TODO", "IN_PROGRESS", "DONE"
  dueDate: DateTime
  createdAt: DateTime!
  assignees: [UserType!]!
  project: ProjectType!
}
```

#### TaskCommentType
```graphql
type TaskCommentType {
  id: ID!
  content: String!
  author: UserType
  timestamp: DateTime!
  task: TaskType!
}
```

#### ActivityType
```graphql
type ActivityType {
  id: ID!
  action: String!      # "TASK_CREATED", "TASK_UPDATED", "TASK_MOVED", etc.
  description: String!
  createdAt: DateTime!
  task: TaskType
  userName: String!
}
```

---

## Queries

### Authentication Queries

#### me
Get the currently authenticated user.

```graphql
query {
  me {
    id
    email
    firstName
    lastName
  }
}
```

### Organization Queries

#### myOrganizations
Get all organizations the current user belongs to.

```graphql
query {
  myOrganizations {
    id
    name
    slug
    businessName
  }
}
```

#### organization
Get a specific organization by ID or slug (must be a member).

```graphql
query {
  organization(id: 1) {
    id
    name
    contactEmail
    businessName
    address
  }
}
```

#### organizationMembers
Get all members of an organization.

```graphql
query {
  organizationMembers(organizationId: 1) {
    id
    user {
      id
      email
      firstName
      lastName
    }
    role
    joinedAt
  }
}
```

#### myMembership
Get current user's membership in a specific organization.

```graphql
query {
  myMembership(organizationId: 1) {
    id
    role
    joinedAt
  }
}
```

### Project Queries

#### allProjects
Get all projects from organizations the user belongs to.

```graphql
query {
  allProjects {
    id
    name
    status
    taskCount
    completedCount
    completionRate
  }
}
```

#### organizationProjects
Get all projects for a specific organization.

```graphql
query {
  organizationProjects(organizationId: 1) {
    id
    name
    description
    status
    dueDate
  }
}
```

#### project
Get a specific project by ID.

```graphql
query {
  project(id: 1) {
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
```

### Task Queries

#### task
Get a specific task by ID.

```graphql
query {
  task(id: 1) {
    id
    title
    description
    status
    dueDate
    assignees {
      id
      email
      firstName
      lastName
    }
  }
}
```

#### myAssignedTasks
Get tasks assigned to the current user in a project.

```graphql
query {
  myAssignedTasks(projectId: 1) {
    id
    title
    status
    dueDate
  }
}
```

#### filteredTasks
Get tasks with optional filters.

```graphql
query {
  filteredTasks(
    projectId: 1
    status: "TODO"
    assigneeId: 2
    search: "bug"
  ) {
    id
    title
    status
    assignees {
      id
      email
    }
  }
}
```

### Activity Queries

#### projectActivity
Get recent activity for a project.

```graphql
query {
  projectActivity(projectId: 1, limit: 10) {
    id
    action
    description
    createdAt
    userName
    task {
      id
      title
    }
  }
}
```

---

## Mutations

### Authentication Mutations

#### tokenAuth
Login and get JWT token.

```graphql
mutation {
  tokenAuth(username: "user@example.com", password: "password123") {
    token
    payload
    refreshExpiresIn
  }
}
```

#### verifyToken
Verify a JWT token is valid.

```graphql
mutation {
  verifyToken(token: "your-jwt-token") {
    payload
  }
}
```

#### refreshToken
Refresh an existing JWT token.

```graphql
mutation {
  refreshToken(token: "your-jwt-token") {
    token
    payload
    refreshExpiresIn
  }
}
```

### Registration Mutations

#### registerOwner
Register a new owner with their organization.

```graphql
mutation {
  registerOwner(
    email: "owner@company.com"
    password: "securePassword123"
    firstName: "John"
    lastName: "Doe"
    businessName: "Acme Corp"
    address: "123 Main St"
  ) {
    user {
      id
      email
    }
    organization {
      id
      name
      slug
    }
    token
  }
}
```

#### inviteMember
Invite a new member to an organization (Owner only).

```graphql
mutation {
  inviteMember(email: "member@example.com", organizationId: 1) {
    success
    inviteToken
  }
}
```

#### acceptInvite
Accept an invitation and create account.

```graphql
mutation {
  acceptInvite(
    token: "invite-token-here"
    password: "newPassword123"
    firstName: "Jane"
    lastName: "Smith"
  ) {
    user {
      id
      email
    }
    authToken
  }
}
```

### Project Mutations

#### createProject
Create a new project in an organization (Owner only).

```graphql
mutation {
  createProject(
    organizationId: 1
    name: "New Project"
    description: "Project description"
    status: "ACTIVE"
    dueDate: "2024-12-31"
  ) {
    project {
      id
      name
      status
    }
  }
}
```

### Task Mutations

#### createTask
Create a new task in a project (Owner only).

```graphql
mutation {
  createTask(
    projectId: 1
    title: "Fix login bug"
    description: "Users cannot login with email"
    assigneeIds: [2, 3]
  ) {
    task {
      id
      title
      status
      assignees {
        id
        email
      }
    }
  }
}
```

#### updateTask
Update an existing task (Owner only).

```graphql
mutation {
  updateTask(
    id: 1
    title: "Updated title"
    status: "IN_PROGRESS"
    assigneeIds: [2]
  ) {
    task {
      id
      title
      status
    }
  }
}
```

#### deleteTask
Delete a task (Owner only).

```graphql
mutation {
  deleteTask(id: 1) {
    success
  }
}
```

### Comment Mutations

#### createComment
Add a comment to a task.

```graphql
mutation {
  createComment(taskId: 1, content: "This is my comment") {
    comment {
      id
      content
      timestamp
      author {
        email
      }
    }
  }
}
```

---

## Error Handling

The API returns errors in the standard GraphQL format:

```json
{
  "errors": [
    {
      "message": "Not authenticated",
      "locations": [{"line": 2, "column": 3}],
      "path": ["me"]
    }
  ],
  "data": {
    "me": null
  }
}
```

### Common Error Messages

| Error | Cause |
|-------|-------|
| `Not authenticated` | Missing or invalid JWT token |
| `Only owners can create projects` | Member trying to create a project |
| `Only owners can create tasks` | Member trying to create a task |
| `You don't have access to this organization` | Trying to access org you're not a member of |
| `You don't have access to this task` | Member trying to access unassigned task |
| `Invalid or expired invitation` | Using wrong or already-used invite token |

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding Django REST throttling.

---

## Example Workflows

### 1. Owner Registration Flow

```graphql
# Step 1: Register owner
mutation {
  registerOwner(
    email: "owner@startup.com"
    password: "password123"
    firstName: "Alice"
    lastName: "Johnson"
    businessName: "Startup Inc"
  ) {
    token
    organization { id slug }
  }
}
# Save the token for subsequent requests
```

### 2. Invite and Onboard Member

```graphql
# Step 1: Owner invites member
mutation {
  inviteMember(email: "dev@startup.com", organizationId: 1) {
    inviteToken
  }
}

# Step 2: Member accepts invite
mutation {
  acceptInvite(
    token: "invite-token-from-step-1"
    password: "memberPass123"
    firstName: "Bob"
    lastName: "Dev"
  ) {
    authToken
    user { id email }
  }
}
```

### 3. Complete Project Workflow

```graphql
# Create project
mutation { createProject(organizationId: 1, name: "Q1 Sprint") { project { id } } }

# Create tasks
mutation { createTask(projectId: 1, title: "Setup CI/CD", assigneeIds: [2]) { task { id } } }

# Update task status (drag-drop on Kanban)
mutation { updateTask(id: 1, status: "IN_PROGRESS") { task { status } } }

# Get activity feed
query { projectActivity(projectId: 1) { description userName createdAt } }
```
