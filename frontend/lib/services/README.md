# Service Layer Documentation

## Overview

The service layer provides a **toggle system** between **mock data** and **real API calls**. This allows for flexible development, testing, and gradual migration to production.

## Architecture

```
Component → Service Layer → Data Source (Mock OR Real API)
```

### Benefits

- ✅ **Single toggle** to switch entire app between mock and real data
- ✅ **Consistent interface** - components don't need to know the data source
- ✅ **Easy testing** - predictable mock data for development
- ✅ **Gradual migration** - enable real data page by page
- ✅ **Demo ready** - always works with mock data for presentations

## How to Use

### 1. Toggle Data Source

Edit `frontend/.env.local`:

```env
# Mock Mode (Development/Demo)
NEXT_PUBLIC_USE_MOCK_DATA=true

# Real Mode (Production)
NEXT_PUBLIC_USE_MOCK_DATA=false
```

**Important:** Restart your Next.js dev server after changing this variable!

### 2. Import Services in Components

```typescript
import { jobsService, usersService, testsService } from '@/lib/services';
```

### 3. Use Services Instead of Direct API Calls

**Before (Direct API):**
```typescript
const response = await jobsApi.getMyJobs(token);
```

**After (Service Layer):**
```typescript
const response = await jobsService.getMyJobs(token);
```

The service layer automatically routes to mock or real data based on the environment variable.

## Available Services

### Jobs Service
```typescript
import { jobsService } from '@/lib/services';

// Get all jobs
await jobsService.getAll(token, domain?, page?);

// Get single job
await jobsService.getById(token, id);

// Create job (HR only)
await jobsService.create(token, jobData);

// Get my jobs (HR only)
await jobsService.getMyJobs(token);

// Update job (mock only)
await jobsService.update(token, id, jobData);

// Delete job (mock only)
await jobsService.delete(token, id);
```

### Users Service
```typescript
import { usersService } from '@/lib/services';

// Get all users (admin only)
await usersService.getAll(token);

// Get user by ID
await usersService.getById(token, id);

// Update user
await usersService.update(token, id, userData);

// Delete/deactivate user
await usersService.delete(token, id);

// Get users by role
await usersService.getByRole(token, 'student' | 'hr' | 'admin');

// Search users
await usersService.search(token, query);
```

### Tests Service
```typescript
import { testsService } from '@/lib/services';

// Get all tests
await testsService.getAll(token, domain?);

// Get test by ID
await testsService.getById(token, id);

// Create test (admin only)
await testsService.create(token, testData);

// Update test
await testsService.update(token, id, testData);

// Delete test
await testsService.delete(token, id);

// Start test attempt
await testsService.startAttempt(token, testId);

// Submit test attempt
await testsService.submitAttempt(token, attemptId, answers);

// Get my attempts
await testsService.getMyAttempts(token);
```

### Applications Service
```typescript
import { applicationsService } from '@/lib/services';

// Apply for a job
await applicationsService.apply(token, jobId, coverLetter?);

// Get my applications
await applicationsService.getMy(token);

// Get applications for a job (HR only)
await applicationsService.getForJob(token, jobId);

// Update application status (HR only)
await applicationsService.updateStatus(token, applicationId, status);
```

## Data Mode Indicator

In development mode, pages show a visual indicator of which data source is being used:

```typescript
import { getDataModeInfo } from '@/lib/services';

const dataMode = getDataModeInfo();
// Returns:
// {
//   isMockMode: boolean,
//   mode: 'Mock Data' | 'Real API',
//   emoji: '🎭' | '🔗',
//   description: string
// }
```

## Console Logging

The service layer automatically logs which data source is being used:

**Mock Mode:**
```
🎭 JobsService: getMyJobs using MOCK data
```

**Real Mode:**
```
🔗 JobsService: getMyJobs using REAL data
```

## Mock Data

Mock data is stored in `frontend/lib/services/mock/`:

- `mockJobs.ts` - Job listings with realistic data
- `mockUsers.ts` - User accounts (students, HR, admin)
- `mockTests.ts` - Assessment tests with questions

### Mock Data Features

- ✅ Simulates API delays (500-1000ms)
- ✅ Returns same structure as real API
- ✅ Supports CRUD operations
- ✅ Includes realistic sample data
- ✅ Maintains state during session

## Migration Path

### Phase 1: Development (Current)
```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```
- Develop UI with mock data
- Test user flows without backend
- Create demos and presentations

### Phase 2: Integration Testing
```env
NEXT_PUBLIC_USE_MOCK_DATA=false
```
- Test with real backend API
- Verify data transformations
- Fix integration issues

### Phase 3: Production
```env
NEXT_PUBLIC_USE_MOCK_DATA=false
```
- Deploy with real API only
- Remove mock data files (optional)
- Simplify service layer (optional)

## Best Practices

### 1. Always Use Services in Components
❌ **Don't:**
```typescript
import { jobsApi } from '@/lib/api';
const jobs = await jobsApi.getMyJobs(token);
```

✅ **Do:**
```typescript
import { jobsService } from '@/lib/services';
const jobs = await jobsService.getMyJobs(token);
```

### 2. Handle Both Mock and Real Responses
Services return the same structure, but always handle errors:

```typescript
try {
  const response = await jobsService.getMyJobs(token);
  if (response.success) {
    setJobs(response.data);
  }
} catch (error) {
  console.error('Failed to load jobs:', error);
  toast({ title: 'Error', description: error.message });
}
```

### 3. Show Data Mode in Development
Help developers know which mode they're in:

```typescript
{process.env.NODE_ENV === 'development' && (
  <Alert>
    <AlertDescription>
      {dataMode.emoji} <strong>{dataMode.mode}</strong>
    </AlertDescription>
  </Alert>
)}
```

### 4. Test Both Modes
Before deploying, test your component in both modes:

1. Set `NEXT_PUBLIC_USE_MOCK_DATA=true` - verify UI works
2. Set `NEXT_PUBLIC_USE_MOCK_DATA=false` - verify API integration
3. Check console logs for data source confirmation

## Troubleshooting

### Service returns error in real mode
**Problem:** `Real users API not implemented yet`

**Solution:** Either:
1. Switch to mock mode: `NEXT_PUBLIC_USE_MOCK_DATA=true`
2. Implement the real API endpoint in backend
3. Add the endpoint to `frontend/lib/api.ts`
4. Update the service to call the real API

### Environment variable not working
**Problem:** Toggle doesn't switch data sources

**Solution:**
1. Restart Next.js dev server (`npm run dev`)
2. Clear browser cache
3. Check `.env.local` file exists in `frontend/` directory
4. Verify variable name: `NEXT_PUBLIC_USE_MOCK_DATA`

### Mock data not updating
**Problem:** Changes to mock data don't appear

**Solution:**
1. Restart dev server
2. Check you're editing the right file in `lib/services/mock/`
3. Clear browser cache

## File Structure

```
frontend/lib/services/
├── index.ts                    # Main exports & utilities
├── jobsService.ts              # Jobs routing layer
├── usersService.ts             # Users routing layer
├── testsService.ts             # Tests routing layer
├── applicationsService.ts      # Applications routing layer
├── mock/
│   ├── mockJobs.ts            # Mock job data
│   ├── mockUsers.ts           # Mock user data
│   └── mockTests.ts           # Mock test data
└── README.md                   # This file
```

## Future Enhancements

### Per-Service Toggles
```env
NEXT_PUBLIC_MOCK_JOBS=true
NEXT_PUBLIC_MOCK_USERS=false
NEXT_PUBLIC_MOCK_TESTS=true
```

### Hybrid Mode
```typescript
// Some operations use mock, others use real
export const jobsService = {
  getAll: () => USE_MOCK ? mockData : realApi,
  create: () => realApi.create(), // Always real
};
```

### Feature Flags
```typescript
// A/B testing, gradual rollouts
if (featureFlags.newJobsUI) {
  return newJobsService.getAll();
}
```

## Support

For questions or issues with the service layer:
1. Check this README
2. Review console logs for data source
3. Verify environment variable is set correctly
4. Test in both mock and real modes
