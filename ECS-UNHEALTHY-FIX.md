# ECS Task Unhealthy - Troubleshooting Guide

## Problem

Your ECS task shows "Unhealthy" status, meaning the health check is failing.

## Quick Diagnosis Steps

### 1. Check CloudWatch Logs

```bash
# View recent logs
aws logs tail /ecs/slt-web --follow --region us-east-1

# Check for specific errors
aws logs filter-pattern /ecs/slt-web --filter-pattern "ERROR" --region us-east-1
```

Look for:

- ❌ **Port binding errors**: "EADDRINUSE" or "port already in use"
- ❌ **Module errors**: "Cannot find module" or "MODULE_NOT_FOUND"
- ❌ **Environment errors**: "NEXTAUTH_SECRET is not set" or missing env vars
- ❌ **Crash loops**: Container restarting repeatedly

### 2. Check Task Status

```bash
# Get task details
aws ecs describe-tasks \
  --cluster your-cluster-name \
  --tasks task-id \
  --region us-east-1

# Check stopped tasks (if task keeps stopping)
aws ecs describe-tasks \
  --cluster your-cluster-name \
  --tasks task-id \
  --include TAGS \
  --region us-east-1 \
  | jq '.tasks[0].stoppedReason'
```

### 3. Test Health Check Locally

```bash
# Run container locally with all env vars
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e HOSTNAME=0.0.0.0 \
  -e AUTH_TRUST_HOST=true \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXTAUTH_SECRET=test-secret \
  -e NEXT_PUBLIC_API_URL=https://api.dev.seloger-tchad.com \
  slt-web:latest

# In another terminal, wait 30s then test
sleep 30
curl http://localhost:3000/api/health

# Should return: {"status":"ok","timestamp":"...","uptime":...}
```

### 4. Check ECS Service Events

```bash
aws ecs describe-services \
  --cluster your-cluster-name \
  --services slt-web \
  --region us-east-1 \
  | jq '.services[0].events[:10]'
```

## Common Issues & Solutions

### Issue 1: "Health check timeout" or "No response from health check"

**Symptoms:**

- Task status: Unhealthy
- Logs show app is running
- Health check keeps timing out

**Cause:** Next.js takes too long to start (cold start)

**Solution:** Increase `startPeriod` in health check configuration

#### Option A: Update Dockerfile HEALTHCHECK

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1
```

#### Option B: Update ECS Task Definition Health Check

```json
{
  "healthCheck": {
    "command": [
      "CMD-SHELL",
      "node -e \"require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""
    ],
    "interval": 30,
    "timeout": 5,
    "retries": 3,
    "startPeriod": 90
  }
}
```

#### Option C: Update ALB Health Check (if using ALB)

In AWS Console or CloudFormation:

- Path: `/api/health`
- Interval: 30 seconds
- Timeout: 5 seconds
- Healthy threshold: 2
- Unhealthy threshold: 3
- **Grace period: 120 seconds** ← Important!

### Issue 2: "Container keeps restarting" or "Essential container exited"

**Symptoms:**

- Task stops and restarts repeatedly
- Logs show errors then container exits

**Common Causes & Solutions:**

#### A. Missing Required Environment Variables

Check logs for:

```
Error: NEXTAUTH_SECRET must be set
Error: Invalid environment variables
```

**Solution:** Ensure all required env vars are set in task definition:

```json
{
  "environment": [
    { "name": "NODE_ENV", "value": "production" },
    { "name": "HOSTNAME", "value": "0.0.0.0" },
    { "name": "PORT", "value": "3000" },
    { "name": "AUTH_TRUST_HOST", "value": "true" },
    { "name": "NEXTAUTH_URL", "value": "https://www.seloger-tchad.com" },
    { "name": "NEXT_PUBLIC_API_URL", "value": "https://api.seloger-tchad.com" }
  ],
  "secrets": [
    {
      "name": "NEXTAUTH_SECRET",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:xxx:secret:nextauth-secret"
    }
  ]
}
```

#### B. Cannot Find Module or Build Artifacts Missing

Check logs for:

```
Error: Cannot find module '/app/server.js'
Error: Cannot find module 'next/dist/...'
```

**Solution:** Verify standalone build is working:

```bash
# Test locally
docker build -t slt-web:test .
docker run -it slt-web:test ls -la /app/
docker run -it slt-web:test ls -la /app/.next/

# Should see:
# - server.js in /app/
# - standalone directory structure
# - .next/static/ folder
```

#### C. Port Binding Issues

Check logs for:

```
Error: listen EADDRINUSE: address already in use :::3000
Error: bind: address already in use
```

**Solution:** Ensure HOSTNAME is set correctly:

```dockerfile
ENV HOSTNAME="0.0.0.0"
```

### Issue 3: "Health check passes but app doesn't work"

**Symptoms:**

- Task shows Healthy
- Health endpoint responds
- But actual app pages return errors

**Causes & Solutions:**

#### A. Missing Static Assets

**Solution:** Ensure `.next/static` is copied:

```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
```

#### B. Missing Public Folder

**Solution:** Ensure public folder is copied:

```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
```

#### C. Environment Variables Not Available at Runtime

**Solution:** For client-side env vars, they must be:

1. Prefixed with `NEXT_PUBLIC_`
2. Set at BUILD time (not just runtime)

Update Dockerfile:

```dockerfile
# In builder stage
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build
```

Build with args:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.seloger-tchad.com \
  -t slt-web:latest .
```

### Issue 4: "Task stops after running for a while"

**Symptoms:**

- Task starts healthy
- Runs for minutes/hours
- Then stops unexpectedly

**Causes & Solutions:**

#### A. Out of Memory (OOM)

Check task stopped reason:

```
"stoppedReason": "OutOfMemory"
```

**Solution:** Increase memory allocation in task definition:

- Minimum: 1 GB
- Recommended: 2 GB
- For heavy load: 4 GB

#### B. Application Crash

Check logs for unhandled errors:

```
UnhandledPromiseRejectionWarning
FATAL ERROR
```

**Solution:** Add error handling in your app and ensure graceful shutdown.

### Issue 5: "Connection refused" or "Connection timeout"

**Symptoms:**

- ALB can't reach container
- Health check fails from ALB but works in container

**Causes & Solutions:**

#### A. Security Group Not Allowing Traffic

**Solution:** Update security group:

- Allow inbound on port 3000 from ALB security group
- Allow outbound to internet (for API calls)

```bash
# Check security groups
aws ec2 describe-security-groups \
  --group-ids sg-xxx \
  --region us-east-1
```

#### B. Container Not Binding to Correct Interface

**Solution:** Ensure app binds to `0.0.0.0`, not `localhost`:

```dockerfile
ENV HOSTNAME="0.0.0.0"
```

## Recommended Health Check Configuration

### For ECS Task Definition:

```json
{
  "containerDefinitions": [
    {
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "node -e \"require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 90
      }
    }
  ]
}
```

### For Application Load Balancer Target Group:

```json
{
  "HealthCheckEnabled": true,
  "HealthCheckPath": "/api/health",
  "HealthCheckProtocol": "HTTP",
  "HealthCheckIntervalSeconds": 30,
  "HealthCheckTimeoutSeconds": 5,
  "HealthyThresholdCount": 2,
  "UnhealthyThresholdCount": 3,
  "Matcher": {
    "HttpCode": "200"
  }
}
```

### For ECS Service:

```json
{
  "healthCheckGracePeriodSeconds": 120
}
```

## Debugging Commands

### View Live Logs:

```bash
aws logs tail /ecs/slt-web --follow
```

### Check Task Health:

```bash
aws ecs describe-tasks \
  --cluster your-cluster \
  --tasks task-id \
  | jq '.tasks[0].healthStatus'
```

### Test Health Endpoint from ECS Task:

```bash
# Get task's ENI
aws ecs describe-tasks \
  --cluster your-cluster \
  --tasks task-id \
  | jq -r '.tasks[0].attachments[0].details[] | select(.name=="privateIPv4Address") | .value'

# Test from another EC2 in same VPC
curl http://<task-ip>:3000/api/health
```

### Execute Command in Running Task (ECS Exec):

```bash
# Enable ECS Exec first in task definition
# Then connect
aws ecs execute-command \
  --cluster your-cluster \
  --task task-id \
  --container slt-web \
  --interactive \
  --command "/bin/sh"

# Inside container
wget -O- http://localhost:3000/api/health
ps aux
env | grep NEXT
```

## Step-by-Step Fix Process

1. **Check CloudWatch Logs** for errors

   ```bash
   aws logs tail /ecs/slt-web --follow
   ```

2. **Verify Environment Variables** in task definition
   - All required vars present?
   - Values correct?
   - Secrets accessible?

3. **Test Docker Image Locally**

   ```bash
   docker run -p 3000:3000 \
     -e NODE_ENV=production \
     -e HOSTNAME=0.0.0.0 \
     -e AUTH_TRUST_HOST=true \
     -e NEXTAUTH_URL=http://localhost:3000 \
     -e NEXTAUTH_SECRET=test \
     -e NEXT_PUBLIC_API_URL=https://api.dev.seloger-tchad.com \
     your-ecr-url/slt-web:latest

   curl http://localhost:3000/api/health
   ```

4. **Increase Health Check Grace Periods**
   - Task definition: `startPeriod: 90s`
   - ECS Service: `healthCheckGracePeriodSeconds: 120`
   - ALB: Grace period 120s

5. **Check Resource Allocation**
   - Memory: >= 2 GB
   - CPU: >= 0.5 vCPU (512)

6. **Verify Security Groups**
   - Inbound: ALB → Container (port 3000)
   - Outbound: Container → Internet (for API calls)

7. **Check Network Configuration**
   - Subnets have route to NAT Gateway (if private)
   - DNS resolution enabled

## Still Not Working?

### Enable ECS Exec for Debugging:

1. Update task definition to enable ECS Exec
2. Update ECS service:

   ```bash
   aws ecs update-service \
     --cluster your-cluster \
     --service slt-web \
     --enable-execute-command \
     --force-new-deployment
   ```

3. Connect to running task:

   ```bash
   aws ecs execute-command \
     --cluster your-cluster \
     --task task-id \
     --container slt-web \
     --interactive \
     --command "/bin/sh"
   ```

4. Debug inside container:

   ```sh
   # Check if app is running
   ps aux | grep node

   # Test health endpoint
   wget -O- http://localhost:3000/api/health

   # Check environment
   env | sort

   # Check files
   ls -la /app/
   ls -la /app/.next/
   ```

## Quick Fix Checklist

- [ ] CloudWatch logs checked - no errors?
- [ ] All environment variables set in task definition?
- [ ] HOSTNAME=0.0.0.0 set?
- [ ] AUTH_TRUST_HOST=true set?
- [ ] NEXTAUTH_SECRET set (via Secrets Manager)?
- [ ] Health check startPeriod >= 90 seconds?
- [ ] ECS service grace period >= 120 seconds?
- [ ] Memory allocation >= 2 GB?
- [ ] Security group allows port 3000 from ALB?
- [ ] Image built for linux/amd64 platform?
- [ ] Docker image tested locally successfully?

If all checked and still failing, share your CloudWatch logs for specific diagnosis.
