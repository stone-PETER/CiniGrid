# Project Creation - Quick Reference Guide

## 📍 Where to Find It

### Location: **Top Navigation Bar (Yellow Bar) - Left Side**

```
┌─────────────────────────────────────────────────────┐
│                    CiniGrid                         │ ← Black bar
├─────────────────────────────────────────────────────┤
│ [Project ▼]  Board  Scenes  Tasks  Locations        │ ← Yellow bar
│   ↑                                                  │
│   HERE!                                             │
└─────────────────────────────────────────────────────┘
```

## 🎯 How to Create a Project

### Method 1: First Time (No Projects)

1. **Login** to the app
2. See **"+ Create Project"** button in yellow navigation bar
3. **Click it** → Modal opens
4. Fill in details → **Create**

### Method 2: When You Have Projects

1. **Click** the project dropdown (left side of yellow bar)
2. **Scroll down** to bottom of dropdown
3. Click **"Create New Project"**
4. Fill in details → **Create**

## ✍️ Project Form Fields

### Required

- **Project Name** (3-100 characters)
  - Example: "Summer Blockbuster 2025"

### Optional

- **Description** (up to 500 characters)
  - Example: "Urban action film set in NYC"

## ✨ What Happens After Creation

1. ✅ Project is created in database
2. ✅ You become the **owner** automatically
3. ✅ Project is **auto-selected** as current
4. ✅ Modal closes
5. ✅ You can start using the project immediately

## 🎨 Visual States

### No Projects

```
┌───────────────────┐
│ + Create Project  │ ← Click here
└───────────────────┘
```

### With Projects (Collapsed)

```
┌────────────────────────┐
│ My Summer Film      ▼  │ ← Click to open
│ owner, producer        │
└────────────────────────┘
```

### With Projects (Expanded)

```
┌────────────────────────────────┐
│ ✓ My Summer Film               │ ← Current project
│   Summer blockbuster           │
│   [owner] [producer]           │
├────────────────────────────────┤
│   Documentary 2025             │ ← Other project
│   [scout]                      │
├────────────────────────────────┤
│ + Create New Project           │ ← Click here to create
└────────────────────────────────┘
```

## 🔄 Project Management Features

### Switch Projects

- Click dropdown → Select different project
- Current project highlighted with ✓

### Invitations

- See pending invitation count in dropdown
- Example: "! 2 Pending invitations"

### Roles

- Your roles shown under project name
- Examples: owner, producer, director, scout, crew

## 🚀 Quick Start Workflow

```
1. Login
   ↓
2. Click "Create Project" (left side of yellow bar)
   ↓
3. Enter name: "My Film Project"
   ↓
4. Enter description (optional)
   ↓
5. Click "Create Project" button
   ↓
6. Done! Project is now active
   ↓
7. Go to Locations tab
   ↓
8. Use AI search with project-scoped results
```

## ✅ Integration Complete

- ✅ **ProjectSelector** added to Layout header
- ✅ **CreateProjectModal** integrated
- ✅ Available on **all pages**
- ✅ Backend API connection working
- ✅ Project-scoped AI search functional
- ✅ Project-scoped locations working

## 🧪 Test It

1. **Start backend**: `cd backend && npm run dev`
2. **Start frontend**: `cd web && npm run dev`
3. **Login** with test account
4. **Look at yellow nav bar** on the left
5. **Click** the project selector
6. **Create** your first project!

---

**Status:** ✅ Fully functional and integrated  
**Location:** Top navigation bar → Left side  
**Updated:** October 5, 2025
