# Quick Start Guide - Service Layer Toggle System

## 🚀 Getting Started in 3 Steps

### Step 1: Choose Your Mode

Edit `frontend/.env.local`:

**For Development/Demo (Mock Data):**
```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

**For Production (Real API):**
```env
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### Step 2: Start the Application

```bash
# Start backend (if using real mode)
cd backend
npm run dev

# Start frontend (in new terminal)
cd frontend
npm run dev
```

### Step 3: Test the Pages

Visit these pages to see the service layer in action:

1. **HR My Jobs:** http://localhost:3000/dashboard/hr/my-jobs
2. **Admin Users:** http://localhost:3000/dashboard/admin/users
3. **Admin Create Test:** http://localhost:3000/dashboard/admin/create-test

---

## 🎭 Mock Mode (Current Default)

### What You'll See:
- 🎭 Banner: "Mock Data - Using mock data for development/demo"
- Console: "🎭 JobsService: getMyJobs using MOCK data"
- Sample data loads instantly

### Sample Data Available:
- **Jobs:** 5 realistic job listings
- **Users:** 10 sample users (students, HR, admin)
- **Tests:** 3 sample tests with questions

### Perfect For:
- ✅ UI/UX development
- ✅ Frontend testing
- ✅ Demos and presentations
- ✅ Working without backend

---

## 🔗 Real API Mode

### What You'll See:
- 🔗 Banner: "Real API - Connected to live backend API"
- Console: "🔗 JobsService: getMyJobs using REAL data"
- Data loads from PostgreSQL database

### Requirements:
- ✅ Backend server running
- ✅ Database connected
- ✅ Valid authentication token

### Perfect For:
- ✅ Integration testing
- ✅ Production deployment
- ✅ End-to-end testing
- ✅ Real data validation

---

## 🔄 Switching Modes

### Important: Always Restart After Changing!

```bash
# 1. Stop the dev server
Ctrl + C

# 2. Change .env.local
NEXT_PUBLIC_USE_MOCK_DATA=true  # or false

# 3. Restart dev server
npm run dev
```

---

## 🎯 Quick Test Scenarios

### Scenario 1: Demo the Application
```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```
- Start frontend only
- Show consistent mock data
- No backend needed

### Scenario 2: Test Real Integration
```env
NEXT_PUBLIC_USE_MOCK_DATA=false
```
- Start both backend and frontend
- Test with real database
- Verify API integration

### Scenario 3: Develop New Feature
```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```
- Work on UI without backend
- Fast iteration
- Predictable data

---

## 📊 What Works in Each Mode

| Feature | Mock Mode | Real Mode |
|---------|-----------|-----------|
| HR My Jobs | ✅ 3 sample jobs | ✅ Database jobs |
| Admin Users | ✅ 10 sample users | ⚠️ Needs backend endpoint |
| Admin Create Test | ✅ Mock save | ⚠️ Needs backend endpoint |
| Student Jobs | ✅ 5 sample jobs | ✅ Database jobs |
| Student Applications | ✅ Mock data | ✅ Database applications |
| Student Tests | ✅ 3 sample tests | ✅ Database tests |
| Profile Management | ✅ Mock data | ✅ Database + file uploads |

---

## 🐛 Troubleshooting

### Toggle Not Working?
1. ✅ Restart dev server
2. ✅ Check `.env.local` file location (must be in `frontend/` folder)
3. ✅ Verify variable name: `NEXT_PUBLIC_USE_MOCK_DATA`
4. ✅ Clear browser cache

### "Real API not implemented" Error?
- **Solution:** Switch to mock mode or implement backend endpoint
- **File:** Check `frontend/lib/services/README.md` for details

### No Data Loading?
- **Mock Mode:** Check console for errors
- **Real Mode:** Verify backend is running and database is connected

---

## 📚 Learn More

### Complete Documentation:
- **Service Layer:** `frontend/lib/services/README.md`
- **Implementation Details:** `SERVICE_LAYER_IMPLEMENTATION.md`

### Key Files:
- **Environment:** `frontend/.env.local`
- **Services:** `frontend/lib/services/`
- **Mock Data:** `frontend/lib/services/mock/`

---

## ✅ Success Checklist

Before deploying to production:

- [ ] Test all pages in mock mode
- [ ] Test all pages in real mode
- [ ] Verify console logs show correct mode
- [ ] Check error handling works
- [ ] Confirm data persists in real mode
- [ ] Set `NEXT_PUBLIC_USE_MOCK_DATA=false` for production

---

## 🎉 You're Ready!

The service layer is fully implemented and ready to use. Start with mock mode for development, then switch to real mode when your backend is ready.

**Current Setup:** Mock Mode (Development) 🎭
**Next Step:** Test the pages and enjoy the flexibility!

---

## 💡 Pro Tips

1. **Keep mock mode for demos** - Always works, no setup needed
2. **Use real mode for testing** - Catch integration issues early
3. **Check console logs** - Know which mode you're in
4. **Read the docs** - `frontend/lib/services/README.md` has everything

Happy coding! 🚀
