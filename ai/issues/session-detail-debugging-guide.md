# Session Detail Page - Debugging Guide

## Issue: Empty Page When Clicking on a Session

### Fixes Applied

1. **History field null/undefined protection**

   - Added `|| []` fallback in both frontend and backend
   - Location: `useSessionDetail.ts` and `sessions.service.ts`

2. **Notes field null/undefined protection**

   - Added `|| ''` fallback in both frontend and backend
   - Location: `useSessionDetail.ts` and `sessions.service.ts`

3. **TypeScript compilation errors fixed**

   - Fixed SessionStatus enum usage (changed to string literals)
   - Fixed type mismatch in sets transformation
   - Fixed NodeJS.Timeout type issue
   - Removed unused imports

4. **Added comprehensive debug logging**
   - Logs in `useSessionDetail` hook
   - Logs in `SessionDetailPage` component
   - Logs for each exercise rendering

### How to Debug

1. **Open Browser DevTools Console**

   - Open Chrome/Firefox DevTools (F12 or Cmd+Option+I)
   - Go to Console tab
   - Clear any existing logs

2. **Navigate to a Session**

   - Click on any session in the sessions list
   - Watch the console for debug output

3. **Check Console Logs**

Look for these log messages in order:

```
useSessionDetail: Fetching session <session-id>
useSessionDetail: API response {...}
useSessionDetail: Transformed session {...}
useSessionDetail: Form state {...}
SessionDetailPage: Rendering with session {...}
SessionDetailPage: Form state {...}
Rendering exercise <exercise-id> {...}
Form exercise for <exercise-id> {...}
```

### Common Issues to Check

#### Issue 1: No API Response

**Symptoms:**

- Console shows: `useSessionDetail: Fetching session <id>`
- But no "API response" log appears
- OR shows: `useSessionDetail: Fetch error`

**Causes:**

- Backend not running
- Database connection issue
- Session doesn't exist
- API endpoint error

**How to fix:**

```bash
# Check backend is running
curl http://localhost:3000/api/sessions/<session-id>

# Check backend logs
cd backend
npm run start:dev
```

#### Issue 2: Empty Exercises Array

**Symptoms:**

- Console shows: `Transformed session { ..., exercises: [] }`
- Message appears: "No exercises in this session"

**Causes:**

- Session was created from a plan with no exercises
- Session exercises failed to create
- Database relation issue

**How to fix:**

```bash
# Check database
psql -d myapp_dev -U postgres

# Query session exercises
SELECT * FROM session_exercises WHERE session_id = '<session-id>';

# Check if plan had exercises
SELECT pe.* FROM plan_exercises pe
JOIN workout_sessions ws ON ws.plan_id = pe.plan_id
WHERE ws.id = '<session-id>';
```

#### Issue 3: Missing Form State

**Symptoms:**

- Console shows: `Rendering exercise <id> {...}`
- Then shows: `Missing form exercise for <id>`
- Exercise accordion doesn't render (returns null)

**Causes:**

- Form state initialization failed
- Exercise ID mismatch
- Race condition in state updates

**How to check:**
Compare the exercise IDs from session vs formState:

```javascript
// In console, check the log output
// session.exercises[0].id should match formState.exercises[<that-id>]
```

#### Issue 4: API Returns null/undefined Fields

**Symptoms:**

- Console shows error before our logs
- Blank page appears
- No logs after "API response"

**Causes:**

- Backend returns null history
- Backend returns null notes
- Missing required fields

**Already fixed by:**

- Added `|| []` for history
- Added `|| ''` for notes
- But check if other fields might be null

### Network Request Analysis

1. **Open Network Tab**

   - DevTools → Network tab
   - Filter by "Fetch/XHR"
   - Click on session
   - Look for request to `/api/sessions/<id>`

2. **Check Response**

   - Status should be 200
   - Response should have:
     ```json
     {
       "id": "...",
       "status": "in_progress",
       "started_at": "...",
       "completed_at": null,
       "exercises": [...]
     }
     ```

3. **Check Exercises Structure**
   Each exercise should have:
   ```json
   {
     "id": "...",
     "exercise_id": "...",
     "exercise_name": "Bench Press",
     "display_order": 1,
     "warmup_sets": 2,
     "working_sets": 3,
     "target_reps": 10,
     "rpe_early": 7,
     "rpe_last": 9,
     "rest_time": 120,
     "intensity_technique": "N/A",
     "notes": "",
     "history": [],
     "sets": []
   }
   ```

### React DevTools Analysis

1. **Install React DevTools** (if not installed)

   - Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

2. **Inspect Component Tree**

   - Open React DevTools
   - Navigate to session detail page
   - Find `SessionDetailPage` component
   - Check props and state:
     - `session` should be an object
     - `formState` should have exercises
     - `loading` should be false
     - `error` should be null

3. **Check Individual Exercise Components**
   - Expand `SessionDetailPage`
   - Look for `ExerciseAccordion` components
   - If no `ExerciseAccordion` components exist, exercises aren't rendering

### Backend Debugging

If the issue is in the backend:

```bash
# Enable detailed logging
cd backend

# Check sessions controller
grep -n "findOne" src/sessions/sessions.controller.ts

# Check sessions service
grep -n "async findOne" src/sessions/sessions.service.ts

# Test endpoint directly
curl -X GET http://localhost:3000/api/sessions/<session-id> \
  -H "Content-Type: application/json" | jq

# Check database
psql -d myapp_dev -U postgres
\dt
SELECT * FROM workout_sessions;
SELECT * FROM session_exercises;
SELECT * FROM exercise_sets;
```

### Quick Test Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] Database accessible
- [ ] Session exists in database
- [ ] Session has exercises in database
- [ ] Browser console shows no errors before our logs
- [ ] Network request returns 200 status
- [ ] API response includes exercises array
- [ ] Console logs show "Fetching session"
- [ ] Console logs show "API response"
- [ ] Console logs show "Transformed session"
- [ ] Console logs show "Form state"
- [ ] Console logs show "Rendering with session"
- [ ] session.exercises.length > 0
- [ ] No "Missing form exercise" warnings

### Next Steps

1. **Follow the console logs** - They will tell you exactly where the process breaks
2. **Check the API response** - Ensure it has the correct structure
3. **Verify database data** - Make sure sessions have exercises
4. **Look for JavaScript errors** - Any uncaught errors will prevent rendering

Once you identify which step is failing, you'll know exactly what to fix!
