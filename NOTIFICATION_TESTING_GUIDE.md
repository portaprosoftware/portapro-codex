# PortaPro Notification System Testing Guide

This guide will help you test the complete notification system end-to-end.

## 📋 Overview

PortaPro has a comprehensive notification system with:
- **12 notification trigger types** (job assignment, route changes, maintenance, etc.)
- **2 delivery channels** (Email via Resend, Push via Service Worker)
- **2 scheduled cron jobs** (invoice reminders, maintenance alerts)
- **User preference management** (per-notification-type toggles)

---

## 🔧 Prerequisites

### 1. Email Setup (Required for Email Notifications)

**IMPORTANT:** Email notifications require a Resend API key.

1. Go to [https://resend.com](https://resend.com) and sign up
2. Verify your domain at [https://resend.com/domains](https://resend.com/domains)
3. Create an API key at [https://resend.com/api-keys](https://resend.com/api-keys)
4. Add the `RESEND_API_KEY` secret to your Supabase project:
   - Go to: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/settings/functions
   - Add secret: `RESEND_API_KEY` with your Resend API key value

### 2. Push Notification Setup (Required for Push Notifications)

Push notifications require:
- A modern browser (Chrome, Firefox, Edge)
- Service worker registration (already configured)
- User permission grant (done via UI)

---

## 🧪 Testing Checklist

### Phase 1: Test Infrastructure (15 minutes)

#### ✅ 1.1 Test Push Subscription
1. Navigate to **Settings → Notifications**
2. Locate the **"Push Notifications"** card at the top
3. Verify:
   - [ ] Browser Support shows "Supported" with green checkmark
   - [ ] Permission Status shows current state
4. Click **"Enable Push Notifications"**
5. Grant permission when browser prompts
6. Verify:
   - [ ] Subscription Status changes to "Active"
   - [ ] Device Information appears with browser name
   - [ ] Green checkmarks show on all 3 status boxes

**If push fails:**
- Check browser console for errors
- Verify service worker is registered: DevTools → Application → Service Workers
- Try in incognito mode to reset permissions

#### ✅ 1.2 Test Notification Testing UI
1. Scroll down to the **"Test Notifications"** card
2. You should see all 12 notification types:
   - 🔔 Job Assignment
   - 📍 Route Schedule Change
   - 🔧 Maintenance Alert
   - 💼 Quote Update
   - 💳 Invoice Reminder
   - ✅ Payment Confirmation
   - 📦 Low Stock Alert
   - 🚚 Asset Movement
   - 🚛 Vehicle Status Change
   - 👤 Driver Check-In
   - 👥 New Team Member
   - 💬 Comment Mention

3. **Test Email Delivery:**
   - Click the "Email" button on "Job Assignment"
   - Wait 2-5 seconds
   - Check your email inbox (configured in notification preferences)
   - Verify you received an email with subject: "🔔 Test: New Job Assignment"
   - [ ] Email received successfully

4. **Test Push Delivery:**
   - Click the "Push" button on "Job Assignment"
   - Wait 1-2 seconds
   - A browser notification should appear in the top-right corner
   - [ ] Push notification received successfully

5. **Test All 12 Types:**
   - Systematically test email and push for each notification type
   - Green checkmarks (✓) will appear next to successful tests
   - Record any failures for debugging

**Common Issues:**
- **No email received**: Check Resend dashboard for delivery logs
- **No push received**: Verify subscription is active and permissions granted
- **Test button disabled**: Wait for previous test to complete (buttons disable during requests)

---

### Phase 2: Test Scheduled Cron Jobs (30 minutes)

#### ✅ 2.1 Enable Cron Jobs in Supabase

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/sql/new
2. Run this SQL to enable extensions and create cron jobs:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule invoice reminders (runs daily at 9:00 AM)
SELECT cron.schedule(
  'check-invoice-reminders-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://kbqxyotasszslacozcey.supabase.co/functions/v1/check-invoice-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticXh5b3Rhc3N6c2xhY296Y2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Mjg1MzYsImV4cCI6MjA3NjIwNDUzNn0.rqn9o7C66aOqfDOg2QXdz5o2PKiVXERPQm9ufGMLSY4"}'::jsonb,
    body := '{"time": "' || now() || '"}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule maintenance alerts (runs daily at 8:00 AM)
SELECT cron.schedule(
  'check-maintenance-due-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://kbqxyotasszslacozcey.supabase.co/functions/v1/check-maintenance-due',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticXh5b3Rhc3N6c2xhY296Y2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Mjg1MzYsImV4cCI6MjA3NjIwNDUzNn0.rqn9o7C66aOqfDOg2QXdz5o2PKiVXERPQm9ufGMLSY4"}'::jsonb,
    body := '{"time": "' || now() || '"}'::jsonb
  ) AS request_id;
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;
```

3. Verify cron jobs were created:
   - [ ] Query returns 2 rows (invoice reminders + maintenance alerts)
   - [ ] Schedule shows '0 9 * * *' for invoices
   - [ ] Schedule shows '0 8 * * *' for maintenance

#### ✅ 2.2 Test Cron Jobs Manually

Since cron jobs run on schedule, test them manually first:

**Test Invoice Reminders:**
```sql
-- Manually trigger invoice reminder check
SELECT net.http_post(
  url := 'https://kbqxyotasszslacozcey.supabase.co/functions/v1/check-invoice-reminders',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticXh5b3Rhc3N6c2xhY296Y2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Mjg1MzYsImV4cCI6MjA3NjIwNDUzNn0.rqn9o7C66aOqfDOg2QXdz5o2PKiVXERPQm9ufGMLSY4"}'::jsonb,
  body := '{"time": "' || now() || '"}'::jsonb
);
```

Check logs: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/check-invoice-reminders/logs

**Test Maintenance Alerts:**
```sql
-- Manually trigger maintenance check
SELECT net.http_post(
  url := 'https://kbqxyotasszslacozcey.supabase.co/functions/v1/check-maintenance-due',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticXh5b3Rhc3N6c2xhY296Y2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Mjg1MzYsImV4cCI6MjA3NjIwNDUzNn0.rqn9o7C66aOqfDOg2QXdz5o2PKiVXERPQm9ufGMLSY4"}'::jsonb,
  body := '{"time": "' || now() || '"}'::jsonb
);
```

Check logs: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/check-maintenance-due/logs

#### ✅ 2.3 Create Test Data for Cron Jobs

**Create test invoice due in 3 days:**
```sql
-- Insert test customer
INSERT INTO customers (name, email, phone) 
VALUES ('Test Customer', 'test@example.com', '555-0100')
RETURNING id;

-- Insert test invoice (replace <customer_id> with ID from above)
INSERT INTO invoices (
  customer_id, 
  invoice_number, 
  total_amount, 
  status, 
  due_date
) VALUES (
  '<customer_id>', 
  'TEST-INV-001', 
  850.00, 
  'pending',
  CURRENT_DATE + INTERVAL '3 days'
);
```

**Create test maintenance due in 5 days:**
```sql
-- Insert test vehicle (if you don't have one)
INSERT INTO vehicles (license_plate, make, model, vehicle_type, status)
VALUES ('TEST-123', 'Test', 'Truck', 'pumper_truck', 'active')
RETURNING id;

-- Insert test maintenance (replace <vehicle_id> with ID from above)
INSERT INTO maintenance_records (
  vehicle_id,
  maintenance_type,
  scheduled_date,
  status,
  description
) VALUES (
  '<vehicle_id>',
  'oil_change',
  CURRENT_DATE + INTERVAL '5 days',
  'scheduled',
  'Test scheduled maintenance'
);
```

**Re-run manual cron tests:**
- Invoices due in 3 days should trigger notifications
- Maintenance within 7 days should trigger notifications
- Check logs to verify they were processed

---

### Phase 3: Test Real Application Triggers (60 minutes)

Test all 12 notification triggers by performing actual application actions:

#### ✅ 3.1 Job Assignment (trigger-job-assignment)
1. Go to **Jobs → New Job**
2. Create a new job and assign it to a driver
3. Verify notification is sent via logs: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/trigger-job-assignment/logs
4. [ ] Notification triggered successfully

#### ✅ 3.2 Route Schedule Change (trigger-route-schedule-change)
1. Integrated in `useScheduling` hook
2. Modify a job's scheduled time or route
3. Check logs: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/trigger-route-schedule-change/logs
4. [ ] Notification triggered successfully

#### ✅ 3.3 Maintenance Alert (trigger-maintenance-alert)
1. Go to **Fleet → Maintenance**
2. Create a new maintenance record with a near-future date
3. Check logs: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/trigger-maintenance-alert/logs
4. [ ] Notification triggered successfully

#### ✅ 3.4 Quote Update (trigger-quote-update)
1. Go to **Quotes**
2. Change a quote status (draft → sent, or accept/decline)
3. Check logs: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/trigger-quote-update/logs
4. [ ] Notification triggered successfully

#### ✅ 3.5 Invoice Reminder (trigger-invoice-reminder)
1. Automatically triggered by cron job (tested in Phase 2)
2. Or manually create invoice with near due date
3. Check logs: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/trigger-invoice-reminder/logs
4. [ ] Notification triggered successfully

#### ✅ 3.6 Payment Confirmation (trigger-payment-confirmation)
1. Go to **Invoices** and process a payment using the payment modal
2. Payment completion triggers notification
3. Check logs: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/trigger-payment-confirmation/logs
4. [ ] Notification triggered successfully

#### ✅ 3.7 Low Stock Alert (trigger-low-stock-alert)
1. Go to **Inventory → Bulk Receiving**
2. Update stock that drops below minimum threshold
3. Check logs: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/trigger-low-stock-alert/logs
4. [ ] Notification triggered successfully

#### ✅ 3.8 Asset Movement (trigger-asset-movement)
1. Complete a service report (driver workflow)
2. Service completion triggers asset movement notification
3. Check logs: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/trigger-asset-movement/logs
4. [ ] Notification triggered successfully

#### ✅ 3.9 Vehicle Status Change (trigger-vehicle-status-change)
1. Go to **Fleet → Vehicles**
2. Open a vehicle detail drawer and change status
3. Check logs: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/trigger-vehicle-status-change/logs
4. [ ] Notification triggered successfully

#### ✅ 3.10 Driver Check-In (trigger-driver-checkin)
1. Complete a service report (triggers check-in on job departure)
2. Check logs: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/trigger-driver-checkin/logs
3. [ ] Notification triggered successfully

#### ✅ 3.11 New Team Member (trigger-new-team-member)
1. Go to **Settings → Team**
2. Invite a new user
3. Check logs: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/trigger-new-team-member/logs
4. [ ] Notification triggered successfully

#### ✅ 3.12 Comment Mention (trigger-comment-mention)
1. Add a note to a customer, vehicle, or job with an @mention
2. Mention parser detects @username patterns
3. Check logs: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/trigger-comment-mention/logs
4. [ ] Currently logs mentions (full implementation requires user lookup)

---

## 🐛 Debugging & Troubleshooting

### Check Edge Function Logs

All edge functions have dedicated log viewers:
- Invoice Reminders: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/check-invoice-reminders/logs
- Maintenance Alerts: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/check-maintenance-due/logs
- Test Notifications: https://supabase.com/dashboard/project/kbqxyotasszslacozcey/functions/send-test-notification/logs

### Common Issues

**Email not sending:**
1. Verify `RESEND_API_KEY` is set in Supabase secrets
2. Check Resend dashboard for delivery status
3. Verify email domain is validated
4. Check `send-notification-email` logs for errors

**Push notification not appearing:**
1. Verify permission is granted in browser
2. Check subscription is active in push_subscriptions table
3. Verify service worker is running (DevTools → Application)
4. Check `send-push-notification` logs for errors

**Trigger not firing:**
1. Verify integration exists in source code
2. Check browser console for errors
3. Review trigger function logs
4. Ensure `notifyUserIds` array is populated

**Cron job not running:**
1. Verify cron jobs are created: `SELECT * FROM cron.job;`
2. Check job execution history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
3. Manually trigger job to test
4. Verify extensions are enabled: `SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');`

---

## ✅ Testing Summary

When all tests pass, you should have:
- [ ] Push subscription working with browser notifications
- [ ] Email delivery working via Resend
- [ ] All 12 test notifications working (email + push)
- [ ] 2 cron jobs scheduled and running
- [ ] All 12 application triggers integrated and firing
- [ ] Notification preferences controlling delivery
- [ ] No errors in edge function logs

---

## 📊 Next Steps

After testing is complete, you can:
1. Create a notification history page to view past notifications
2. Add advanced filtering and search to notification logs
3. Implement email templates for better branding
4. Add SMS delivery channel via Twilio
5. Create notification analytics dashboard
6. Add notification batching and digest emails
7. Implement quiet hours and do-not-disturb settings

---

## 📝 Notes

- Test notifications do not create database records
- Real notifications log to `notification_logs` table
- Cron jobs run in UTC timezone
- Push subscriptions expire after 90 days of inactivity
- Email bounces and complaints are tracked in Resend
