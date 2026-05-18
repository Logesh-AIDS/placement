# Admin Users Dashboard Fix

## Problem
The admin users dashboard was not showing registered accounts from the database. It was only showing mock data.

## Root Cause
The `usersService` in the frontend was not implemented to call the real API. It was throwing an error saying "Real users API not implemented yet."

## Solution

### 1. Added Users API Endpoints (`frontend/lib/api.ts`)

Added the missing `usersApi` object with all CRUD operations:

```typescript
export const usersApi = {
  getAll: (token: string, filters?: { role?: string; domain?: string; status?: string; page?: number; limit?: number }) =>
    request<UsersResponse>(`/users?${new URLSearchParams(filters as any).toString()}`, { token }),

  getById: (token: string, id: number) =>
    request<{ success: boolean; data: User }>(`/users/${id}`, { token }),

  update: (token: string, id: number, payload: Partial<UpdateUserPayload>) =>
    request<{ success: boolean; data: User }>(`/users/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    }),

  delete: (token: string, id: number) =>
    request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
      token,
    }),
};
```

### 2. Added TypeScript Types

Added proper types for User and related interfaces:

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  domain: DomainType | null;
  score: number;
  status: string;
  created_at: string;
}

export interface UpdateUserPayload {
  name?: string;
  role?: UserRole;
  domain?: DomainType | null;
  status?: string;
}

interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}
```

### 3. Updated Users Service (`frontend/lib/services/usersService.ts`)

Changed from throwing errors to calling the real API:

```typescript
export const usersService = {
  async getAll(token: string, filters?: { ... }) {
    logDataSource('UsersService', 'getAll');
    
    if (USE_MOCK_DATA) {
      return mockUsersService.getAll();
    } else {
      return usersApi.getAll(token, filters); // ✅ Now calls real API
    }
  },
  // ... other methods updated similarly
};
```

### 4. Fixed Backend SQL Query Bug (`backend/src/controllers/users.controller.ts`)

The original query had incorrect placeholder syntax:

**Before (BROKEN)**:
```typescript
let idx = 1;
if (role) { conditions.push(`role = ${idx++}`); params.push(role); }
// This creates: "role = 1" instead of "role = $1"

query(`... LIMIT ${idx} OFFSET ${idx + 1}`, [...params, limit, offset])
// This creates: "LIMIT 2 OFFSET 3" instead of "LIMIT $2 OFFSET $3"
```

**After (FIXED)**:
```typescript
let paramIndex = 1;
if (role) { conditions.push(`role = $${paramIndex++}`); params.push(role); }
// This creates: "role = $1" ✅

query(`... LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limit, offset])
// This creates: "LIMIT $2 OFFSET $3" ✅
```

## How to Verify the Fix

### 1. Check Environment Variables

Make sure `frontend/.env.local` has:
```
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### 2. Restart Frontend

```bash
cd frontend
npm run dev
```

### 3. Test the Admin Dashboard

1. Login as admin
2. Navigate to `/dashboard/admin/users`
3. You should now see all registered users from the database

### 4. Test API Directly (Optional)

```bash
# Get your admin JWT token from browser DevTools (Application > Local Storage)
TOKEN="your_jwt_token_here"

# Test the API
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/users
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "domain": null,
      "score": 0,
      "status": "not_qualified",
      "created_at": "2024-01-15T10:00:00Z"
    },
    // ... more users
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

## What Changed

### Files Modified:
1. ✅ `frontend/lib/api.ts` - Added `usersApi` endpoints
2. ✅ `frontend/lib/services/usersService.ts` - Implemented real API calls
3. ✅ `backend/src/controllers/users.controller.ts` - Fixed SQL query bug

### Files NOT Changed:
- `frontend/app/dashboard/admin/users/page.tsx` - Already correct
- `backend/src/routes/users.routes.ts` - Already correct
- `backend/src/app.ts` - Already registered routes

## Testing Checklist

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Frontend server is running (`npm run dev` in frontend folder)
- [ ] `NEXT_PUBLIC_USE_MOCK_DATA=false` in `frontend/.env.local`
- [ ] Can login as admin
- [ ] Admin users page shows real database users
- [ ] Can filter users by role
- [ ] Can search users by name/email
- [ ] User count statistics are correct

## Troubleshooting

### Issue: Still seeing mock data
**Solution**: 
1. Check `frontend/.env.local` has `NEXT_PUBLIC_USE_MOCK_DATA=false`
2. Restart frontend server (Ctrl+C and `npm run dev`)
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: "Network error" or "Cannot reach server"
**Solution**:
1. Check backend is running: `curl http://localhost:5000/health`
2. Check backend logs for errors
3. Verify `NEXT_PUBLIC_API_URL=http://localhost:5000/api` in `.env.local`

### Issue: "Unauthorized" or "Access denied"
**Solution**:
1. Make sure you're logged in as admin
2. Check JWT token is valid (not expired)
3. Try logging out and logging back in

### Issue: Empty user list but no errors
**Solution**:
1. Check database has users: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"`
2. Check backend logs for SQL errors
3. Verify admin role has permission to access `/api/users`

## Summary

The admin users dashboard now correctly displays all registered users from the PostgreSQL database instead of mock data. The fix involved:

1. **Adding missing API endpoints** in the frontend API client
2. **Implementing real API calls** in the users service
3. **Fixing a SQL query bug** in the backend controller

All changes maintain backward compatibility with mock mode (for development/testing).
