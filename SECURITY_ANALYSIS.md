# Gym Onboarding Flow - Security Analysis

## Current Flow

1. **Signed-out user clicks "List your gym"** → Redirects to `/auth/signup?intent=owner`
2. **User enters email, name, password** → Form submission
3. **Backend creates account:**
   - `supabase.auth.signUp()` creates auth user
   - Database trigger automatically creates profile with `role='fighter'`
   - Code then upserts profile to change `role='owner'`
   - User is automatically signed in (Supabase default behavior)
4. **Redirect to `/manage/onboarding`** → User can immediately create gym

## Security Assessment

### ✅ What's Safe

1. **Authentication**: User is properly authenticated via Supabase Auth
2. **Authorization**: RLS policies protect database access
3. **Role Assignment**: Profile is correctly set to 'owner' role
4. **Session Management**: User session is properly managed
5. **Gym Creation Protection**: Onboarding page checks for authentication

### ⚠️ Security Concerns

1. **Race Condition**: 
   - Database trigger creates profile with `role='fighter'`
   - Code immediately upserts to `role='owner'`
   - Potential timing issue, though `upsert` should handle it

2. **No Email Verification Check**:
   - Supabase may require email verification (depends on project settings)
   - Code doesn't verify email before allowing gym creation
   - Unverified users could potentially create gyms

3. **No Owner Verification**:
   - Anyone can become an owner by clicking the link
   - No verification that user is actually a gym owner
   - No business license or documentation required

4. **Immediate Access**:
   - User can create gym immediately after signup
   - No waiting period or admin approval for owner status

## Recommendations for Production

### Critical (Must Fix)

1. **Add Email Verification Check**:
   ```typescript
   // In onboarding page, check email verification
   const { data: { user } } = await supabase.auth.getUser()
   if (user && !user.email_confirmed_at) {
     // Redirect to email verification page
   }
   ```

2. **Fix Race Condition**:
   ```sql
   -- Use INSERT ... ON CONFLICT DO UPDATE in trigger
   -- Or use upsert with proper conflict handling
   ```

### Important (Should Fix)

3. **Add Owner Verification Step**:
   - Require business documentation
   - Add admin approval for owner accounts
   - Or at least add a confirmation step

4. **Add Rate Limiting**:
   - Prevent spam account creation
   - Limit gym creation per account

### Nice to Have

5. **Add Welcome Email**:
   - Send confirmation email with next steps
   - Include owner onboarding guide

6. **Add Terms Acceptance**:
   - Require acceptance of partner terms
   - Store acceptance timestamp

## Current Implementation Status

✅ **Flow is functional** - Users can sign up and create gyms
⚠️ **Needs email verification check** - Should verify email before allowing gym creation
⚠️ **Race condition exists** - Should be fixed but likely not critical
✅ **RLS policies protect data** - Database is secure
⚠️ **No owner verification** - Consider adding for production

## Conclusion

The flow is **mostly safe** for production but needs:
1. Email verification check before gym creation
2. Better handling of profile creation race condition
3. Consider adding owner verification/approval process

The current implementation will work, but adding email verification check is recommended for production.
