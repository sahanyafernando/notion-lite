# NotionLite - Common Errors & Troubleshooting Guide

## Setup & Installation Errors

### 1. Database Connection Failed

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Causes:**
- PostgreSQL not running locally
- Incorrect DATABASE_URL in .env
- Database host/port mismatch
- Firewall blocking connection

**Solutions:**
```bash
# For local Postgres
# Start PostgreSQL (Windows - if using service)
net start PostgreSQL-x64-15  # Adjust version number

# Or start PostgreSQL manually
# macOS with Homebrew
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Test connection
psql -U postgres -h localhost
```

Update `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/notion_lite?schema=public"
```

For cloud database (Neon), ensure connection string includes `?sslmode=require`:
```env
DATABASE_URL="postgresql://user:pass@ep-xxxx.us-east-1.aws.neon.tech/db?sslmode=require"
```

---

### 2. Prisma Migration Failed

**Error Message:**
```
Error: P3001 - The database schema is not in sync
```

**Causes:**
- Schema mismatch between code and database
- Stale migration history
- Interrupted migration

**Solutions:**
```bash
# Option 1: Reset database (development only!)
npx prisma migrate reset

# Option 2: Push schema changes
npx prisma db push

# Option 3: Create new migration
npx prisma migrate dev --name <migration_name>

# View migration status
npx prisma migrate status
```

**Warning:** `prisma migrate reset` drops all data!

---

### 3. Missing Prisma Generated Types

**Error Message:**
```
Cannot find module '@prisma/client'
Cannot find namespace 'PrismaClient'
```

**Causes:**
- Prisma client not generated
- node_modules corrupted
- TypeScript cache stale

**Solutions:**
```bash
# Generate Prisma client
npx prisma generate

# Or during build
npm run db:generate

# Clean and reinstall
rm -rf node_modules .next
npm install

# Clear TypeScript cache
rm -rf .next/cache
```

---

### 4. Clerk Authentication Failed

**Error Message:**
```
[Error: Missing Publishable Key. Set the NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable]
```

**Causes:**
- `.env` missing Clerk keys
- Incorrect key format
- Clerk CLI not initialized

**Solutions:**
```bash
# Initialize Clerk
clerk auth login
clerk init --framework next --pm npm

# Manual setup - get keys from Clerk dashboard:
# 1. Go to https://dashboard.clerk.com
# 2. Copy Publishable Key → NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# 3. Copy Secret Key → CLERK_SECRET_KEY

# Verify setup
clerk doctor
```

Update `.env`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

### 5. OpenAI API Key Invalid

**Error Message:**
```
Error: 401 Unauthorized - Invalid authentication credentials
```

**Causes:**
- Missing `OPENAI_API_KEY` in `.env`
- Invalid/expired API key
- Insufficient API quota

**Solutions:**
```bash
# Get API key from https://platform.openai.com/api-keys
# Add to .env
OPENAI_API_KEY=sk-proj-...

# Verify key works
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

Check OpenAI account:
- API key active
- Billing set up
- Usage quota available

---

## Runtime Errors

### 6. "useAuth is not defined" or Clerk Hook Errors

**Error Message:**
```
ReferenceError: useAuth is not defined
Clerk: useAuth can only be used within a Clerk <ClerkProvider>
```

**Causes:**
- Component not wrapped in ClerkProvider
- Middleware not configured
- Clerk context lost in Server Component

**Solutions:**

For Client Components:
```typescript
'use client'; // Add at top of file

import { useAuth } from '@clerk/nextjs';

export function MyComponent() {
  const { userId, isSignedIn } = useAuth();
  // ...
}
```

For Server Components:
```typescript
import { auth } from '@clerk/nextjs/server';

export async function MyServerComponent() {
  const { userId } = await auth();
  // ...
}
```

---

### 7. "Cannot read property 'id' of null" - User Not Found

**Error Message:**
```
TypeError: Cannot read property 'id' of null
Cannot read property 'clerkId' of undefined
```

**Causes:**
- User session exists in Clerk but not in database
- Race condition during signup
- Database query failed

**Solutions:**

Ensure user syncing in signup flow:
```typescript
// In your signup handler
const clerkUser = auth().userId;

// Wait for user to exist in database
const dbUser = await db.user.findUnique({
  where: { clerkId: clerkUser }
});

if (!dbUser) {
  // Create user if missing
  await db.user.create({
    data: {
      clerkId: clerkUser,
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName} ${user.lastName}`
    }
  });
}
```

---

### 8. "Access Denied" - Permission Check Failed

**Error Message:**
```
Error: Access Denied
Insufficient permissions to perform this action
```

**Causes:**
- User role doesn't match required role
- Share permission not granted
- Workspace membership missing

**Solutions:**

Verify permission logic in [src/lib/permissions.ts](src/lib/permissions.ts):
```typescript
// Check workspace membership
const member = await db.workspaceMember.findUnique({
  where: {
    workspaceId_userId: { workspaceId, userId }
  }
});

if (!member) throw new Error('Not a member');
if (member.role === 'VIEWER' && action === 'EDIT') {
  throw new Error('Insufficient role');
}
```

---

### 9. TipTap Editor Not Rendering

**Error Message:**
```
Error: useEditor must be used within useEditor context
TipTap: Cannot read property 'commands' of null
```

**Causes:**
- Editor not initialized
- Component mounted before TipTap ready
- Missing editor configuration

**Solutions:**

```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function PageEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {
          languageClassPrefix: 'language-'
        }
      })
    ],
    content: pageContent,
    onUpdate: ({ editor }) => {
      handleAutoSave(editor.getJSON());
    }
  });

  if (!editor) return <div>Loading editor...</div>;

  return <EditorContent editor={editor} />;
}
```

---

### 10. Search Not Working / Empty Results

**Error Message:**
```
No results found
Search returns undefined
```

**Causes:**
- Incorrect search query parsing
- Database indices missing
- Text search not case-insensitive

**Solutions:**

Search implementation in [src/components/search/search-bar.tsx](src/components/search/search-bar.tsx):
```typescript
// Ensure case-insensitive search
const pages = await db.page.findMany({
  where: {
    AND: [
      { workspaceId },
      {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { tags: { some: { tag: { name: { contains: query, mode: 'insensitive' } } } } }
        ]
      }
    ]
  }
});
```

Create database index for performance:
```prisma
model Page {
  // ... fields
  @@index([title])
  @@index([workspaceId])
}
```

---

### 11. Auto-Save Not Working

**Error Message:**
```
Changes not being saved
Page content lost on refresh
Summary showing error
```

**Causes:**
- Server Action not called
- Debounce delay too long
- Network request failed
- Permission denied

**Solutions:**

Check auto-save implementation:
```typescript
// Add debugging
const handleAutoSave = async (content: Json) => {
  console.log('Auto-saving...', content);
  try {
    const result = await updatePageContent(pageId, content);
    console.log('Save successful:', result);
  } catch (error) {
    console.error('Auto-save failed:', error);
    showErrorNotification('Failed to save');
  }
};

// Debounce to prevent too many requests
const debouncedSave = debounce(handleAutoSave, 1000);
```

---

### 12. Summarize Endpoint Returns 500 Error

**Error Message:**
```
Error: Internal Server Error at /api/pages/[id]/summarize
OpenAI API error
```

**Causes:**
- OpenAI API key invalid
- Page content too long
- OpenAI account out of credits
- Network timeout

**Solutions:**

Check [src/app/api/pages/[id]/summarize/route.ts](src/app/api/pages/[id]/summarize/route.ts):
```typescript
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate OpenAI key
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get page and check permissions
    const page = await db.page.findUnique({ where: { id } });
    if (!page) return Response.json({ error: 'Page not found' }, { status: 404 });

    // Limit content length
    const contentPreview = page.content ? JSON.stringify(page.content).slice(0, 8000) : '';

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Summarize this page content:\n\n${contentPreview}`
      }]
    });

    const summary = response.choices[0].message.content;
    
    // Save summary
    await db.page.update({
      where: { id },
      data: { summary }
    });

    return Response.json({ summary });
  } catch (error) {
    console.error('Summarize error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

---

## Testing & Build Errors

### 13. Tests Failing

**Error Message:**
```
FAIL: tests failing
TypeError: Cannot find module
ReferenceError: window is not defined
```

**Causes:**
- Missing test setup
- Environment variables not loaded
- Component using browser APIs in test

**Solutions:**

Check [test/setupTests.ts](test/setupTests.ts):
```typescript
import '@testing-library/jest-dom';

// Setup environment variables for tests
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock';

// Mock Clerk if needed
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ userId: 'test-user-id', isSignedIn: true })
}));
```

Run tests correctly:
```bash
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:all           # All tests with lint & type check
```

---

### 14. Build Fails - TypeScript Errors

**Error Message:**
```
error TS2531: Object is possibly 'undefined'
error TS2554: Expected 2 arguments, got 1
```

**Causes:**
- Strict null checks
- Missing type definitions
- Type mismatch

**Solutions:**

Enable strict mode in [tsconfig.json](tsconfig.json):
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

Fix errors with proper typing:
```typescript
// ❌ Wrong
const result = data.user.profile.name;

// ✅ Correct
const result = data?.user?.profile?.name ?? 'Unknown';
```

---

### 15. ESLint Errors

**Error Message:**
```
error: Unexpected var, use let or const instead
error: Unused variable 'x'
```

**Causes:**
- Code style violations
- Unused imports/variables
- Incorrect syntax

**Solutions:**

```bash
# Check linting
npm run lint

# Fix auto-fixable issues
npx eslint --fix .

# Remove unused imports
npx eslint --fix . --rule "no-unused-vars: error"
```

---

## Performance Issues

### 16. Slow Page Load

**Symptoms:**
- Page takes >3s to load
- Editor is laggy
- Search is slow

**Solutions:**

Enable performance profiling:
```typescript
import { performance } from 'perf_hooks';

const start = performance.now();
// ... operation
const end = performance.now();
console.log(`Operation took ${end - start}ms`);
```

Optimize database queries:
```typescript
// ❌ N+1 query problem
for (const page of pages) {
  const tags = await db.pageTag.findMany({ where: { pageId: page.id } });
}

// ✅ Efficient
const pages = await db.page.findMany({
  include: { tags: true } // Join in single query
});
```

---

### 17. High Memory Usage

**Symptoms:**
- Node process using >500MB RAM
- Editor crashes with large pages
- Server crashes during concurrent requests

**Solutions:**

- Limit page content size
- Paginate large lists
- Use database connections pool
- Monitor with `node --inspect`

---

## Deployment Errors

### 18. Vercel Deployment Failed

**Error Message:**
```
Build failed: Command failed with exit code 1
```

**Common causes:**
- Missing environment variables
- Database migration failed
- Build script error

**Solutions:**

```bash
# 1. Set all environment variables in Vercel dashboard
#    - DATABASE_URL
#    - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
#    - CLERK_SECRET_KEY
#    - OPENAI_API_KEY

# 2. Test build locally
npm run build

# 3. Check Vercel logs
vercel logs --tail
```

---

### 19. Database Connection Issues in Production

**Error Message:**
```
ECONNREFUSED in production
Connection pool exhausted
```

**Solutions:**

For Neon:
- Ensure SSL mode is enabled
- Update connection string with `?sslmode=require`
- Check connection limits

For Prisma:
```env
# Increase connection pool
DATABASE_URL="postgresql://...?schema=public&pool_size=5"
```

---

## Security Issues

### 20. Unauthorized Access to Protected Routes

**Error Message:**
```
401 Unauthorized
User not authenticated
```

**Solutions:**

Verify middleware in [src/middleware.ts](src/middleware.ts):
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const protectedRoutes = createRouteMatcher([
  '/dashboard(.*)',
  '/workspace(.*)',
  '/page/(.*)(/.*)?',
  '/api/pages/(.*)',
  '/api/workspaces/(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (protectedRoutes(req)) {
    await auth.protect();
  }
});
```

---

## Database Issues

### 21. Unique Constraint Violation

**Error Message:**
```
Error: Unique constraint failed on the fields: (workspaceId, userId)
```

**Causes:**
- Duplicate insert attempt
- Race condition

**Solutions:**

Use `upsert` for idempotent operations:
```typescript
await db.workspaceMember.upsert({
  where: { workspaceId_userId: { workspaceId, userId } },
  update: { role: newRole },
  create: { workspaceId, userId, role: newRole }
});
```

---

### 22. Cascade Delete Issues

**Error Message:**
```
Error: Cannot delete parent record while children exist
```

**Causes:**
- Cascade delete not properly configured
- Orphaned records

**Solutions:**

Ensure schema has cascade deletes:
```prisma
model Workspace {
  // ...
  pages Page[] @relation(onDelete: Cascade)
  tags Tag[] @relation(onDelete: Cascade)
}
```

---

## Getting Help

1. **Check this document first** - Most common issues are documented
2. **Read error messages carefully** - They often contain the solution
3. **Check console logs** - Both browser and server logs
4. **Review relevant source files** - Links provided in solutions
5. **Use Prisma Studio** - Debug database: `npm run db:studio`
6. **Run type check** - `npm run test:typecheck`
7. **Check GitHub Issues** - For Next.js, Prisma, Clerk, TipTap repos

---

## Error Reporting Template

If you encounter an undocumented error:

```markdown
## Error Title

**Error Message:**
(Exact error text from console)

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Environment:**
- OS: Windows/macOS/Linux
- Node version: 18/20/22
- npm version: 9/10

**Console Output:**
(Full error stack trace)

**Expected Behavior:**
(What should happen)

**Actual Behavior:**
(What actually happens)
```

---

## Version Information

Track which versions of key dependencies this guide applies to:

- **Next.js:** 16.2.9
- **React:** 19.2.4
- **TypeScript:** 5.x
- **Prisma:** 7.8.0
- **Clerk:** 7.5.3
- **TipTap:** 3.27.0
- **Node.js:** 18+ recommended
- **PostgreSQL:** 12+

---

**Last Updated:** 2026-06-20
**Guide Version:** 1.0
