# Service Layer Architecture Diagram

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND APPLICATION                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    COMPONENTS LAYER                     │    │
│  │                                                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │  HR My Jobs  │  │ Admin Users  │  │ Create Test  │ │    │
│  │  │     Page     │  │     Page     │  │     Page     │ │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │    │
│  │         │                  │                  │         │    │
│  │         └──────────────────┼──────────────────┘         │    │
│  │                            │                            │    │
│  └────────────────────────────┼────────────────────────────┘    │
│                               │                                 │
│  ┌────────────────────────────▼────────────────────────────┐    │
│  │                    SERVICE LAYER                        │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  Environment Check:                              │  │    │
│  │  │  NEXT_PUBLIC_USE_MOCK_DATA = true/false         │  │    │
│  │  └──────────────────┬───────────────────────────────┘  │    │
│  │                     │                                   │    │
│  │         ┌───────────┴───────────┐                      │    │
│  │         │                       │                      │    │
│  │         ▼                       ▼                      │    │
│  │  ┌─────────────┐         ┌─────────────┐             │    │
│  │  │ Mock Data   │         │  Real API   │             │    │
│  │  │  Provider   │         │   Client    │             │    │
│  │  └─────────────┘         └─────────────┘             │    │
│  │         │                       │                      │    │
│  └─────────┼───────────────────────┼──────────────────────┘    │
│            │                       │                           │
└────────────┼───────────────────────┼───────────────────────────┘
             │                       │
             ▼                       ▼
    ┌────────────────┐      ┌────────────────┐
    │  Mock Data     │      │    Backend     │
    │  (In Memory)   │      │   PostgreSQL   │
    └────────────────┘      └────────────────┘
```

---

## 🔄 Data Flow Diagram

### Mock Mode Flow (NEXT_PUBLIC_USE_MOCK_DATA=true)

```
User Action
    │
    ▼
┌─────────────────┐
│   Component     │  "Load my jobs"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ jobsService     │  Check: USE_MOCK_DATA = true
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ mockJobsService │  Return 3 sample jobs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Component     │  Display jobs in UI
└─────────────────┘

Console: 🎭 JobsService: getMyJobs using MOCK data
```

### Real Mode Flow (NEXT_PUBLIC_USE_MOCK_DATA=false)

```
User Action
    │
    ▼
┌─────────────────┐
│   Component     │  "Load my jobs"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ jobsService     │  Check: USE_MOCK_DATA = false
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   jobsApi       │  GET /api/jobs/my
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API   │  Query PostgreSQL
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Component     │  Display jobs in UI
└─────────────────┘

Console: 🔗 JobsService: getMyJobs using REAL data
```

---

## 📁 File Structure

```
placement-portal/
│
├── frontend/
│   ├── .env.local                          ← Toggle control
│   │   └── NEXT_PUBLIC_USE_MOCK_DATA=true
│   │
│   ├── lib/
│   │   ├── api.ts                          ← Real API client
│   │   │
│   │   └── services/                       ← Service Layer
│   │       ├── index.ts                    ← Exports & utilities
│   │       ├── jobsService.ts              ← Jobs routing
│   │       ├── usersService.ts             ← Users routing
│   │       ├── testsService.ts             ← Tests routing
│   │       ├── applicationsService.ts      ← Applications routing
│   │       │
│   │       ├── mock/                       ← Mock Data
│   │       │   ├── mockJobs.ts            ← 5 sample jobs
│   │       │   ├── mockUsers.ts           ← 10 sample users
│   │       │   └── mockTests.ts           ← 3 sample tests
│   │       │
│   │       └── README.md                   ← Documentation
│   │
│   └── app/dashboard/
│       ├── hr/
│       │   └── my-jobs/
│       │       └── page.tsx                ← Updated ✅
│       │
│       └── admin/
│           ├── users/
│           │   └── page.tsx                ← Updated ✅
│           │
│           └── create-test/
│               └── page.tsx                ← Updated ✅
│
├── backend/
│   ├── src/
│   │   ├── controllers/                    ← Real API endpoints
│   │   └── config/
│   │       └── db.ts                       ← PostgreSQL connection
│   │
│   └── database/
│       └── schema.sql                      ← Database schema
│
└── Documentation/
    ├── QUICK_START_GUIDE.md               ← Start here
    ├── SERVICE_LAYER_IMPLEMENTATION.md    ← Details
    ├── IMPLEMENTATION_SUMMARY.md          ← Overview
    └── ARCHITECTURE_DIAGRAM.md            ← This file
```

---

## 🎯 Service Layer Components

```
┌─────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  jobsService                                   │    │
│  │  ├─ getAll()      → Mock OR Real              │    │
│  │  ├─ getById()     → Mock OR Real              │    │
│  │  ├─ create()      → Mock OR Real              │    │
│  │  ├─ getMyJobs()   → Mock OR Real              │    │
│  │  ├─ update()      → Mock only                 │    │
│  │  └─ delete()      → Mock only                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  usersService                                  │    │
│  │  ├─ getAll()      → Mock only                 │    │
│  │  ├─ getById()     → Mock only                 │    │
│  │  ├─ update()      → Mock only                 │    │
│  │  ├─ delete()      → Mock only                 │    │
│  │  ├─ getByRole()   → Mock only                 │    │
│  │  └─ search()      → Mock only                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  testsService                                  │    │
│  │  ├─ getAll()      → Mock OR Real              │    │
│  │  ├─ getById()     → Mock OR Real              │    │
│  │  ├─ create()      → Mock only                 │    │
│  │  ├─ update()      → Mock only                 │    │
│  │  ├─ delete()      → Mock only                 │    │
│  │  ├─ startAttempt()→ Real (with fallback)      │    │
│  │  └─ submitAttempt()→ Real (with fallback)     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  applicationsService                           │    │
│  │  ├─ apply()       → Mock OR Real              │    │
│  │  ├─ getMy()       → Mock OR Real              │    │
│  │  ├─ getForJob()   → Mock only                 │    │
│  │  └─ updateStatus()→ Mock only                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔀 Decision Flow

```
                    Component calls service
                            │
                            ▼
                ┌───────────────────────┐
                │  Check Environment    │
                │  USE_MOCK_DATA?       │
                └───────────┬───────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │   TRUE       │        │   FALSE      │
        │  (Mock Mode) │        │ (Real Mode)  │
        └──────┬───────┘        └──────┬───────┘
               │                       │
               ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ mockJobsService  │    │    jobsApi       │
    │ .getMyJobs()     │    │ .getMyJobs(token)│
    └──────┬───────────┘    └──────┬───────────┘
           │                       │
           ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ Return mock data │    │ Fetch from API   │
    │ (instant)        │    │ (network call)   │
    └──────┬───────────┘    └──────┬───────────┘
           │                       │
           └───────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Return to Component │
            │  (same structure)    │
            └──────────────────────┘
```

---

## 🎭 Mock Data Structure

```
┌─────────────────────────────────────────────────────────┐
│                    MOCK DATA LAYER                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  mockJobs.ts                                            │
│  ├─ mockJobsData[]                                      │
│  │  ├─ Job 1: Frontend Developer (Web)                 │
│  │  ├─ Job 2: Backend Developer (Web)                  │
│  │  ├─ Job 3: Data Scientist (ML)                      │
│  │  ├─ Job 4: Cloud Engineer (Cloud)                   │
│  │  └─ Job 5: Full Stack Developer (Web)               │
│  │                                                       │
│  └─ mockJobsService                                     │
│     ├─ getAll()      → Returns all active jobs         │
│     ├─ getMyJobs()   → Returns first 3 jobs            │
│     ├─ getById()     → Find by ID                      │
│     ├─ create()      → Add to array                    │
│     ├─ update()      → Modify in array                 │
│     └─ delete()      → Remove from array               │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  mockUsers.ts                                           │
│  ├─ mockUsersData[]                                     │
│  │  ├─ User 1: John Doe (Student, Web, 850)           │
│  │  ├─ User 2: Jane Smith (Student, ML, 920)          │
│  │  ├─ User 3: Tech Corp HR (HR)                      │
│  │  ├─ User 4: Alice Johnson (Student, DSA, 780)      │
│  │  ├─ User 5: StartUp Inc HR (HR)                    │
│  │  └─ ... 5 more users                                │
│  │                                                       │
│  └─ mockUsersService                                    │
│     ├─ getAll()      → Returns all users               │
│     ├─ getById()     → Find by ID                      │
│     ├─ update()      → Modify in array                 │
│     ├─ delete()      → Mark inactive                   │
│     ├─ getByRole()   → Filter by role                  │
│     └─ search()      → Search by name/email            │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  mockTests.ts                                           │
│  ├─ mockTestsData[]                                     │
│  │  ├─ Test 1: Web Development (3 questions)          │
│  │  ├─ Test 2: Machine Learning (2 questions)         │
│  │  └─ Test 3: DSA (2 questions)                      │
│  │                                                       │
│  └─ mockTestsService                                    │
│     ├─ getAll()      → Returns all tests               │
│     ├─ getById()     → Find by ID                      │
│     ├─ create()      → Add to array                    │
│     ├─ update()      → Modify in array                 │
│     ├─ delete()      → Mark inactive                   │
│     └─ getByDomain() → Filter by domain                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔗 Real API Structure

```
┌─────────────────────────────────────────────────────────┐
│                    REAL API LAYER                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Backend API (Express + PostgreSQL)                     │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Jobs Endpoints                                │    │
│  │  ├─ GET    /api/jobs              ✅ Working  │    │
│  │  ├─ GET    /api/jobs/:id          ✅ Working  │    │
│  │  ├─ POST   /api/jobs              ✅ Working  │    │
│  │  ├─ GET    /api/jobs/my           ✅ Working  │    │
│  │  ├─ PATCH  /api/jobs/:id          ⏳ TODO     │    │
│  │  └─ DELETE /api/jobs/:id          ⏳ TODO     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Users Endpoints                               │    │
│  │  ├─ GET    /api/users             ⏳ TODO     │    │
│  │  ├─ GET    /api/users/:id         ⏳ TODO     │    │
│  │  ├─ PATCH  /api/users/:id         ⏳ TODO     │    │
│  │  └─ DELETE /api/users/:id         ⏳ TODO     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Tests Endpoints                               │    │
│  │  ├─ GET    /api/tests             ✅ Working  │    │
│  │  ├─ GET    /api/tests/:id         ✅ Working  │    │
│  │  ├─ POST   /api/tests             ⏳ TODO     │    │
│  │  ├─ PATCH  /api/tests/:id         ⏳ TODO     │    │
│  │  └─ DELETE /api/tests/:id         ⏳ TODO     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Applications Endpoints                        │    │
│  │  ├─ POST   /api/applications      ✅ Working  │    │
│  │  ├─ GET    /api/applications/my   ✅ Working  │    │
│  │  ├─ GET    /api/applications/job/:id ⏳ TODO  │    │
│  │  └─ PATCH  /api/applications/:id/status ⏳TODO│    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Integration

```
┌─────────────────────────────────────────────────────────┐
│              COMPONENT INTEGRATION PATTERN              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Import Service                                      │
│     import { jobsService } from '@/lib/services';       │
│                                                          │
│  2. Get Auth Token                                      │
│     const { accessToken } = useAuth();                  │
│                                                          │
│  3. Load Data on Mount                                  │
│     useEffect(() => {                                   │
│       const loadData = async () => {                    │
│         const response = await jobsService.getMyJobs(); │
│         setJobs(response.data);                         │
│       };                                                 │
│       loadData();                                       │
│     }, [accessToken]);                                  │
│                                                          │
│  4. Handle Loading & Errors                             │
│     - Show loading spinner                              │
│     - Display error messages                            │
│     - Handle empty states                               │
│                                                          │
│  5. Display Data Mode (Development)                     │
│     const dataMode = getDataModeInfo();                 │
│     {dataMode.emoji} {dataMode.mode}                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Toggle Mechanism

```
┌─────────────────────────────────────────────────────────┐
│                  TOGGLE MECHANISM                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Environment Variable (.env.local)                      │
│  ┌────────────────────────────────────────────────┐    │
│  │  NEXT_PUBLIC_USE_MOCK_DATA=true                │    │
│  └────────────────────┬───────────────────────────┘    │
│                       │                                 │
│                       ▼                                 │
│  Service Layer (index.ts)                               │
│  ┌────────────────────────────────────────────────┐    │
│  │  export const USE_MOCK_DATA =                  │    │
│  │    process.env.NEXT_PUBLIC_USE_MOCK_DATA       │    │
│  │    === 'true';                                 │    │
│  └────────────────────┬───────────────────────────┘    │
│                       │                                 │
│                       ▼                                 │
│  Individual Services                                    │
│  ┌────────────────────────────────────────────────┐    │
│  │  if (USE_MOCK_DATA) {                          │    │
│  │    return mockService.method();                │    │
│  │  } else {                                      │    │
│  │    return realApi.method();                    │    │
│  │  }                                             │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Timeline

```
Mock Mode (Fast - ~500ms)
─────────────────────────────────────────────────────────
0ms     Component mounts
50ms    useEffect triggers
100ms   Service layer checks USE_MOCK_DATA
150ms   Mock service called
200ms   Simulated delay starts
700ms   Mock data returned
750ms   Component updates
800ms   UI renders

Real Mode (Slower - ~1000-2000ms)
─────────────────────────────────────────────────────────
0ms     Component mounts
50ms    useEffect triggers
100ms   Service layer checks USE_MOCK_DATA
150ms   Real API called
200ms   HTTP request sent
500ms   Backend processes request
800ms   Database query executed
1200ms  Response sent back
1500ms  Frontend receives data
1550ms  Component updates
1600ms  UI renders
```

---

## 🎉 Summary

This architecture provides:

✅ **Flexibility** - Easy toggle between mock and real data
✅ **Scalability** - Add new services easily
✅ **Maintainability** - Single point of control
✅ **Testability** - Predictable mock data
✅ **Professional** - Industry-standard pattern

**Current Status:** Fully Implemented ✅
**Mode:** Mock Data (Development) 🎭
**Ready For:** Production (when backend ready) 🚀
