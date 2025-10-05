# 🎯 Project-Based System Implementation - PHASE 1 COMPLETE

**Date:** October 5, 2025  
**Status:** ✅ Phase 1 Complete - Backend & Frontend Foundation Ready

---

## 📋 Overview

Successfully migrated from **global user roles** to a **project-based role system** where users can have different roles in different projects.

### Key Changes:

- ✅ Removed role requirement from authentication (login/register)
- ✅ Created Project, ProjectMember, and Invitation models
- ✅ Implemented project-based authorization middleware
- ✅ Added project and invitation management endpoints
- ✅ Updated frontend to remove role from auth flow
- ✅ Added projectId field to all feature models (locations, notes, etc.)

---

## 🏗️ New Database Models

### 1. **Project** Model

```javascript
{
  name: String (required),
  description: String,
  ownerId: ObjectId (ref: User),
  status: 'active' | 'archived' | 'completed',
  settings: Map,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **ProjectMember** Model

```javascript
{
  projectId: ObjectId (ref: Project),
  userId: ObjectId (ref: User),
  roles: [String] // ['owner', 'producer', 'director', 'manager', 'scout', 'crew']
  joinedAt: Date,
  invitedBy: ObjectId (ref: User),
  status: 'active' | 'inactive'
}
```

**Features:**

- Multiple roles per user per project
- Helper methods: `hasRole()`, `hasAnyRole()`, `isAdmin()`
- Unique constraint: one membership per user per project

### 3. **Invitation** Model

```javascript
{
  projectId: ObjectId (ref: Project),
  inviterId: ObjectId (ref: User),
  inviteeId: ObjectId (ref: User),
  roles: [String],
  status: 'pending' | 'accepted' | 'declined' | 'cancelled',
  message: String,
  expiresAt: Date (default: 7 days),
  respondedAt: Date
}
```

**Features:**

- Auto-expiration after 7 days
- Prevents duplicate pending invitations
- Helper methods: `isExpired()`, `canBeAccepted()`

---

## 🔐 Authentication Changes

### Before:

```javascript
// Register
POST /api/auth/register
{
  "username": "john",
  "password": "pass123",
  "role": "scout"  // ❌ REQUIRED
}

// Response
{
  "user": {
    "id": "...",
    "username": "john",
    "role": "scout"  // ❌ Global role
  }
}
```

### After:

```javascript
// Register
POST /api/auth/register
{
  "username": "john",
  "password": "pass123"
  // ✅ No role required
}

// Response
{
  "user": {
    "id": "...",
    "username": "john"
    // ✅ No global role - roles are project-specific
  }
}
```

---

## 🛣️ New API Endpoints

### **Project Management**

#### Create Project

```http
POST /api/projects
Authorization: Bearer <token>

{
  "name": "Summer Film Project",
  "description": "Outdoor scenes for feature film",
  "members": [
    {
      "username": "alice",
      "roles": ["scout", "manager"]
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "project123",
      "name": "Summer Film Project",
      "ownerId": "user123",
      "status": "active"
    },
    "members": [
      {
        "userId": { "username": "john" },
        "roles": ["owner"]
      },
      {
        "userId": { "username": "alice" },
        "roles": ["scout", "manager"]
      }
    ]
  }
}
```

#### List My Projects

```http
GET /api/projects
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "_id": "project123",
        "name": "Summer Film Project",
        "description": "...",
        "userRoles": ["owner"] // Current user's roles in this project
      }
    ],
    "count": 1
  }
}
```

#### Get Project Details

```http
GET /api/projects/:projectId
Authorization: Bearer <token>
```

#### Update Project

```http
PUT /api/projects/:projectId
Authorization: Bearer <token>
Requires: Admin role (owner/producer/director)

{
  "name": "Updated Name",
  "description": "Updated description",
  "status": "archived"
}
```

#### Delete Project

```http
DELETE /api/projects/:projectId
Authorization: Bearer <token>
Requires: Owner only
```

---

### **Member Management**

#### Get Project Members

```http
GET /api/projects/:projectId/members
Authorization: Bearer <token>
Requires: Project member
```

#### Update Member Roles

```http
PUT /api/projects/:projectId/members/:userId
Authorization: Bearer <token>
Requires: Admin role

{
  "roles": ["director", "scout"]
}
```

#### Remove Member

```http
DELETE /api/projects/:projectId/members/:userId
Authorization: Bearer <token>
Requires: Admin role
```

---

### **Invitations**

#### Invite User to Project

```http
POST /api/projects/:projectId/invitations
Authorization: Bearer <token>
Requires: Admin role

{
  "username": "bob",
  "roles": ["scout"],
  "message": "We'd love you to scout locations for us!"
}
```

#### Get My Invitations

```http
GET /api/invitations?status=pending
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "invitations": [
      {
        "_id": "inv123",
        "projectId": {
          "name": "Summer Film Project",
          "description": "..."
        },
        "inviterId": {
          "username": "john"
        },
        "roles": ["scout"],
        "message": "We'd love you to scout locations!",
        "status": "pending",
        "expiresAt": "2025-10-12T..."
      }
    ],
    "count": 1
  }
}
```

#### Accept Invitation

```http
POST /api/invitations/:invitationId/accept
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "You have joined Summer Film Project!",
  "data": {
    "invitation": { "status": "accepted", ... },
    "member": {
      "projectId": "project123",
      "userId": "user456",
      "roles": ["scout"]
    }
  }
}
```

#### Decline Invitation

```http
POST /api/invitations/:invitationId/decline
Authorization: Bearer <token>
```

#### Cancel Invitation

```http
DELETE /api/invitations/:invitationId
Authorization: Bearer <token>
Requires: Inviter or admin
```

---

## 🔒 Authorization Middleware

### New Middleware Functions:

#### 1. `requireProjectMember`

Checks if user is a member of the project.

```javascript
// Adds to request:
req.project; // Project object
req.projectMember; // ProjectMember object
```

#### 2. `requireProjectRole(allowedRoles)`

Checks if user has specific role(s) in the project.

```javascript
router.put(
  "/:projectId",
  requireProjectMember,
  requireProjectRole(["owner", "director", "producer"]),
  updateProject
);
```

#### 3. `requireProjectAdmin`

Checks if user is admin (owner/producer/director).

```javascript
router.post(
  "/:projectId/invitations",
  requireProjectMember,
  requireProjectAdmin,
  inviteUser
);
```

#### 4. `requireProjectOwner`

Checks if user is the project owner.

```javascript
router.delete(
  "/:projectId",
  requireProjectMember,
  requireProjectOwner,
  deleteProject
);
```

---

## 🎭 Role System

### Available Roles:

- **owner** - Project creator, full permissions
- **producer** - Admin-level, can manage project
- **director** - Admin-level, creative control
- **manager** - Coordination and organization
- **scout** - Location scouting
- **crew** - General project member

### Role Privileges:

- **Admin roles** (`owner`, `producer`, `director`):
  - Manage project settings
  - Invite/remove members
  - Update member roles
  - View all project data
- **Non-admin roles** (`manager`, `scout`, `crew`):
  - View project data
  - Contribute to their assigned tasks
  - Cannot manage members or settings

### Multiple Roles:

Users can have **multiple roles** in a single project:

```javascript
{
  "roles": ["director", "scout"]  // Can direct AND scout
}
```

---

## 📦 Updated Feature Models

All feature models now include `projectId`:

```javascript
// PotentialLocation, FinalizedLocation, LocationSuggestion, AIRecommendation
{
  projectId: ObjectId (ref: Project),  // ✅ NEW - Optional for backward compatibility
  // ... existing fields
}
```

**Note:** Existing data without `projectId` will be "orphaned" - handle in Phase 2.

---

## 🎨 Frontend Changes

### Auth Flow:

- ✅ Removed role dropdown from login/register
- ✅ Updated `User` type to remove role field
- ✅ Updated `AuthContext` to remove role parameter
- ✅ Updated types: `LoginRequest`, `RegisterRequest`

### New Types Added:

```typescript
export type ProjectRole = "owner" | "producer" | "director" | "manager" | "scout" | "crew";

export interface Project {
  _id: string;
  name: string;
  description: string;
  ownerId: string;
  status: "active" | "archived" | "completed";
  userRoles?: ProjectRole[];
}

export interface ProjectMember { ... }
export interface Invitation { ... }
```

---

## ✅ Testing Checklist

### Phase 1 - Backend Tests:

1. **Authentication:**

   ```bash
   # Register without role
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"pass123"}'

   # Login
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"pass123"}'
   ```

2. **Project Creation:**

   ```bash
   # Create project (use token from login)
   curl -X POST http://localhost:5000/api/projects \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Project","description":"Testing"}'
   ```

3. **Invitations:**
   ```bash
   # Invite user
   curl -X POST http://localhost:5000/api/projects/<projectId>/invitations \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"username":"otheruser","roles":["scout"]}'
   ```

---

## 🚀 Phase 2 - TODO (Future Sessions)

### Frontend UI:

- [ ] Project selection/switching UI
- [ ] Project creation modal
- [ ] Invitation inbox/notifications
- [ ] Project dashboard
- [ ] Member management UI

### Backend:

- [ ] Make AI search project-scoped
- [ ] Make locations project-scoped
- [ ] Add project-based permissions to all features
- [ ] Data migration tool for orphaned records

### Features:

- [ ] Project settings page
- [ ] Project archive/completion workflow
- [ ] Activity feed per project
- [ ] Search users to invite
- [ ] Invitation email notifications (if email configured)

---

## 🔧 Migration Notes

### For Existing Users:

- Old users with global `role` field in database: **Ignored** (field still exists but unused)
- No breaking changes for existing users
- Can login/register normally

### For Existing Data:

- Locations, notes, suggestions without `projectId`: **Orphaned**
- Will appear in Phase 2 data migration tool
- Can be assigned to projects later

---

## 📝 Example Workflow

### 1. Create Project:

```javascript
// POST /api/projects
{
  "name": "Ocean Documentary",
  "description": "Filming coastal locations",
  "members": [
    { "username": "alice", "roles": ["director"] },
    { "username": "bob", "roles": ["scout", "crew"] }
  ]
}
```

### 2. Invite Additional Member:

```javascript
// POST /api/projects/{projectId}/invitations
{
  "username": "charlie",
  "roles": ["manager"],
  "message": "We need your expertise!"
}
```

### 3. Charlie Accepts:

```javascript
// POST /api/invitations/{invitationId}/accept
// Charlie is now a project member with 'manager' role
```

### 4. Update Member Roles:

```javascript
// PUT /api/projects/{projectId}/members/{bobId}
{
  "roles": ["scout", "crew", "manager"]  // Add manager role to Bob
}
```

---

## 🎉 Summary

**Phase 1 Status: ✅ COMPLETE**

### What Works:

- ✅ Role-free authentication
- ✅ Project creation with members
- ✅ Project-based authorization
- ✅ Invitation system (send/accept/decline)
- ✅ Member management
- ✅ Multiple roles per user per project
- ✅ Admin-level privileges for owner/producer/director

### What's Next (Phase 2):

- Frontend UI for project management
- Project-scoped features (locations, AI search)
- Data migration tools
- Enhanced project workflows

---

**Backend Running:** ✅ `http://localhost:5000`  
**Ready for Frontend Integration:** ✅ All APIs functional  
**Documentation:** ✅ Complete

🎯 **You can now test the system with the API endpoints above!**
