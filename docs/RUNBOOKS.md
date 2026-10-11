# Operations & Deployment Runbooks

## Runbook 1: Bumping Minimum App Version (Force Update)

### When to Use
When a breaking backend migration or security update requires all active counter terminals or riders to update immediately.

### Procedure
1. Verify the new client release has reached 100% rollout in the Google Play Console / Apple App Store.
2. Connect to the production database via Supabase or admin console.
3. Update `app_config`:
   ```sql
   UPDATE app_config 
   SET min_supported_version = '1.1.0',
       latest_version = '1.1.0',
       force_update_title = 'Critical Counter Terminal Update Required',
       force_update_message = 'Please update Medcure to continue receiving dispatch orders.',
       updated_at = NOW()
   WHERE app_id = 'com.medcure.shop';
   ```
4. Verify by calling `GET /api/v1/config/app?appId=com.medcure.shop&version=1.0.0`:
   - Response must return `updateRequired: true`.

---

## Runbook 2: Database Migration Execution

### When to Use
Applying ordered SQL migrations from `backend/migrations/`.

### Procedure
1. Run migrations in alphanumeric order:
   ```bash
   for file in backend/migrations/*.sql; do
     echo "Applying $file..."
     psql "$DATABASE_URL" -f "$file"
   done
   ```
2. Verify table permissions and RLS policies are active:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```

---

## Runbook 3: Emergency Break-Glass Prescription Access

### When to Use
If customer support or platform administrators need emergency access to an unassigned prescription during an urgent incident.

### Procedure
1. Navigate to Admin HQ -> Operational Audits -> Break-Glass Protocol.
2. System requires Two-Person Authorization:
   - Requestor submits reason and order ID.
   - Second administrator reviews and grants time-limited (15-minute) break-glass token.
3. Access is immutably recorded in `admin_audit_logs` and flagged in the daily compliance report.
