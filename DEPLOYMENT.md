# FluxPay Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Supabase project created
- [ ] Database schema deployed (`supabase-schema.sql`)
- [ ] Environment variables configured in `.env.local`
- [ ] Alchemy RPC URL obtained
- [ ] Test tokens received from faucet

### 2. Local Testing
- [ ] Application runs locally (`npm run dev`)
- [ ] Manager can create workspace
- [ ] Manager can open payment channel
- [ ] Manager can add employees
- [ ] Manager can create tasks
- [ ] Employee can view tasks
- [ ] Employee can mark tasks complete
- [ ] Manager can approve and pay
- [ ] Balance updates correctly
- [ ] Channel closes successfully

### 3. Code Quality
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] All imports resolved
- [ ] Environment variables not committed
- [ ] `.env.local` in `.gitignore`

## 🚀 Deployment Steps

### Option 1: Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Connect to Vercel**
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Configure project settings

3. **Set Environment Variables**
In Vercel dashboard, add:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
ALCHEMY_RPC_URL=your_rpc_url
```

4. **Deploy**
- Click "Deploy"
- Wait for build to complete
- Visit your deployed URL

### Option 2: Deploy to Netlify

1. **Build the application**
```bash
npm run build
```

2. **Connect to Netlify**
- Go to [netlify.com](https://netlify.com)
- Drag and drop `.next` folder
- Or connect GitHub repository

3. **Configure Environment Variables**
Add same variables as Vercel

4. **Deploy**
- Netlify will build and deploy automatically

## 🔒 Security Hardening

### Supabase RLS Policies

Replace the permissive policies with these:

```sql
-- Workspaces: Only manager can modify their own
DROP POLICY IF EXISTS "Allow all on workspaces" ON workspaces;

CREATE POLICY "Managers can view their workspaces"
ON workspaces FOR SELECT
USING (auth.uid()::text = manager_address);

CREATE POLICY "Managers can create workspaces"
ON workspaces FOR INSERT
WITH CHECK (auth.uid()::text = manager_address);

CREATE POLICY "Managers can update their workspaces"
ON workspaces FOR UPDATE
USING (auth.uid()::text = manager_address);

-- Employees: Manager can add, employees can view
DROP POLICY IF EXISTS "Allow all on employees" ON employees;

CREATE POLICY "Anyone can view employees in their workspace"
ON employees FOR SELECT
USING (
  workspace_id IN (
    SELECT id FROM workspaces 
    WHERE manager_address = auth.uid()::text
  )
  OR wallet_address = auth.uid()::text
);

CREATE POLICY "Managers can add employees"
ON employees FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT id FROM workspaces 
    WHERE manager_address = auth.uid()::text
  )
);

-- Tasks: Manager creates, employee views their own
DROP POLICY IF EXISTS "Allow all on tasks" ON tasks;

CREATE POLICY "Users can view relevant tasks"
ON tasks FOR SELECT
USING (
  workspace_id IN (
    SELECT id FROM workspaces 
    WHERE manager_address = auth.uid()::text
  )
  OR employee_address = auth.uid()::text
);

CREATE POLICY "Managers can create tasks"
ON tasks FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT id FROM workspaces 
    WHERE manager_address = auth.uid()::text
  )
);

CREATE POLICY "Managers and employees can update tasks"
ON tasks FOR UPDATE
USING (
  workspace_id IN (
    SELECT id FROM workspaces 
    WHERE manager_address = auth.uid()::text
  )
  OR employee_address = auth.uid()::text
);
```

### Additional Security

- [ ] Enable Supabase Auth (optional)
- [ ] Add rate limiting
- [ ] Implement CORS policies
- [ ] Add input validation
- [ ] Sanitize user inputs
- [ ] Add error logging (Sentry)
- [ ] Enable HTTPS only
- [ ] Add CSP headers

## 📊 Monitoring Setup

### 1. Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

Configure in `sentry.client.config.js`:
```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### 2. Analytics (Optional)

- [ ] Google Analytics
- [ ] Mixpanel
- [ ] PostHog

### 3. Uptime Monitoring

- [ ] UptimeRobot
- [ ] Pingdom
- [ ] Better Uptime

## 🧪 Post-Deployment Testing

### Smoke Tests

- [ ] Homepage loads
- [ ] Can connect wallet
- [ ] Manager dashboard accessible
- [ ] Employee dashboard accessible
- [ ] Database queries work
- [ ] Yellow Network connection works
- [ ] Transactions can be signed

### Integration Tests

- [ ] Complete manager flow
- [ ] Complete employee flow
- [ ] Payment flow works
- [ ] Settlement works

## 📈 Performance Optimization

### Frontend

- [ ] Enable Next.js image optimization
- [ ] Implement code splitting
- [ ] Add loading states
- [ ] Optimize bundle size
- [ ] Enable caching

### Database

- [ ] Verify indexes are created
- [ ] Optimize queries
- [ ] Enable connection pooling
- [ ] Set up backups

### Network

- [ ] Use CDN for static assets
- [ ] Enable compression
- [ ] Optimize API calls
- [ ] Implement request caching

## 🔄 Maintenance Plan

### Daily
- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Review user feedback

### Weekly
- [ ] Review analytics
- [ ] Check database performance
- [ ] Update dependencies

### Monthly
- [ ] Security audit
- [ ] Performance review
- [ ] Feature planning

## 📝 Documentation Updates

- [ ] Update README with production URL
- [ ] Add troubleshooting guide
- [ ] Document API endpoints
- [ ] Create user guide
- [ ] Add video tutorials

## 🎯 Launch Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Security hardening complete
- [ ] Monitoring set up
- [ ] Documentation updated
- [ ] Backup strategy in place

### Launch
- [ ] Deploy to production
- [ ] Verify deployment
- [ ] Test critical flows
- [ ] Monitor for errors
- [ ] Announce launch

### Post-Launch
- [ ] Monitor user activity
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Plan next features

## 🆘 Rollback Plan

If something goes wrong:

1. **Immediate Actions**
   - [ ] Revert to previous deployment
   - [ ] Check error logs
   - [ ] Notify users if needed

2. **Investigation**
   - [ ] Identify root cause
   - [ ] Test fix locally
   - [ ] Deploy fix

3. **Prevention**
   - [ ] Add tests for bug
   - [ ] Update documentation
   - [ ] Review deployment process

## 📞 Support Channels

Set up:
- [ ] GitHub Issues for bug reports
- [ ] Discord/Telegram for community
- [ ] Email for support
- [ ] Status page for incidents

## 🎉 You're Ready to Deploy!

Once all checkboxes are complete, your FluxPay application is ready for production deployment!

---

**Remember:**
- Always test in staging first
- Keep backups of database
- Monitor closely after deployment
- Have a rollback plan ready
- Communicate with users

Good luck with your deployment! 🚀
