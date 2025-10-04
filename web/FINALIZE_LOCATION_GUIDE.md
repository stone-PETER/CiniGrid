# Location Finalization Feature

## How to Test the Finalize Location Feature

### Prerequisites
1. **User Role**: You need to be logged in as a `manager`, `director`, or `producer` to see the finalize button
2. **Approvals**: The location needs at least one approval before it can be finalized

### Steps to Test:

#### 1. **Login with Appropriate Role**
- Login as a user with role: `manager`, `director`, or `producer`
- Scouts cannot finalize locations (they can only add and manage potential locations)

#### 2. **Navigate to a Potential Location**
- Go to the Scout Dashboard
- Click on any potential location from the list
- The location detail panel will open

#### 3. **Add an Approval (if needed)**
- In the location detail panel, scroll to the "Approvals" section
- Add an approval with status "approved"
- This is required before finalization can happen

#### 4. **Finalize the Location**
- Once the location has at least one approval, you'll see a green "✓ Finalize Location" button in the header
- Click the button
- Confirm the action in the modal that appears
- The location will be moved from "Potential" to "Finalized" status

#### 5. **Verify Finalization**
- A success toast notification will appear
- The location will disappear from the potential locations list
- Check the "Finalized Locations" page to see it there

### UI Indicators:

#### **Finalize Button States:**
- **🟢 Active**: Green "✓ Finalize Location" button (when user can finalize and location has approval)
- **🔒 Disabled**: Gray "Finalize Location" button with "(Needs approval)" text
- **👤 No Permission**: "Only managers+ can finalize" text for scouts/crew

#### **Success Feedback:**
- ✅ Toast notification: "Location '[Name]' has been finalized successfully!"
- 🔄 Automatic refresh of potential locations list
- 🎯 Location moved to finalized locations

### API Endpoint Used:
```
POST /api/locations/potential/{id}/finalize
```

### Backend Requirements:
- User must have role: `manager`, `director`, or `producer`
- Location must have at least one approval with status "approved"
- Location must be in "potential" status (not already finalized)

### Error Handling:
- ❌ Network errors show error toast
- 🚫 Permission errors handled gracefully
- 📝 Missing approvals prevent finalization with helpful UI hints