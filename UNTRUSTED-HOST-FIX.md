# Fix for "UntrustedHost: Host must be trusted" Error

## Problem

When running the Next.js app in a Docker container, you may encounter this error:

```
UntrustedHost: Host must be trusted. URL was: https://api.dev.seloger-tchad.com/api/auth/session
```

This error occurs because NextAuth v5 (Auth.js) requires explicit trust configuration for security reasons.

## Solution

### 1. Updated `auth.ts` Configuration

Added `trustHost: true` to the NextAuth configuration:

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // ← This line was added
  providers: [
    // ... your providers
  ],
  // ... rest of config
});
```

### 2. Updated `Dockerfile`

Added the `AUTH_TRUST_HOST` environment variable:

```dockerfile
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV AUTH_TRUST_HOST=true  # ← This line was added
```

### 3. Created Environment Configuration Files

- **`.env.example`** - Production environment variables template
- **`.env.local.example`** - Local development/Docker testing template
- **`docker-compose.yml`** - Easy local Docker testing

## How to Use

### For Local Docker Testing

#### Option 1: Docker Compose (Easiest)

1. Copy the environment file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your values:

   ```env
   NEXTAUTH_URL=http://localhost:3000
   AUTH_SECRET=your-local-secret
   NEXT_PUBLIC_API_URL=https://api.dev.seloger-tchad.com
   AUTH_TRUST_HOST=true
   ```

3. Start the container:

   ```bash
   docker-compose up
   ```

4. Access the app at `http://localhost:3000`

#### Option 2: Manual Docker Run

```bash
# Build
docker build -t slt-web:latest .

# Run with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e AUTH_TRUST_HOST=true \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e AUTH_SECRET=your-secret \
  -e NEXT_PUBLIC_API_URL=https://api.dev.seloger-tchad.com \
  -e NEXT_PUBLIC_IMAGES_DOMAIN=https://images.dev.seloger-tchad.com \
  slt-web:latest
```

#### Option 3: Using Deploy Script

```bash
./docker-deploy.sh test
```

### For AWS ECS/Fargate Deployment

In your ECS Task Definition, ensure these environment variables are set:

```json
{
  "environment": [
    {
      "name": "NODE_ENV",
      "value": "production"
    },
    {
      "name": "HOSTNAME",
      "value": "0.0.0.0"
    },
    {
      "name": "AUTH_TRUST_HOST",
      "value": "true"
    },
    {
      "name": "NEXTAUTH_URL",
      "value": "https://www.seloger-tchad.com"
    },
    {
      "name": "NEXT_PUBLIC_API_URL",
      "value": "https://api.seloger-tchad.com"
    },
    {
      "name": "NEXT_PUBLIC_IMAGES_DOMAIN",
      "value": "https://images.seloger-tchad.com"
    }
  ],
  "secrets": [
    {
      "name": "AUTH_SECRET",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:xxxxx:secret:nextauth-secret"
    }
  ]
}
```

## Required Environment Variables

### Core Variables

- `NODE_ENV` - Set to "production" for production builds
- `PORT` - Port the app listens on (default: 3000)
- `HOSTNAME` - Must be "0.0.0.0" for Docker/ECS

### NextAuth Variables

- `AUTH_TRUST_HOST` - **MUST be "true"** to fix the UntrustedHost error
- `NEXTAUTH_URL` - Full URL of your application
- `AUTH_SECRET` - Secret key for session encryption (use Secrets Manager in production)

### API Variables

- `NEXT_PUBLIC_API_URL` - Your backend API URL
- `NEXT_PUBLIC_IMAGES_DOMAIN` - CDN/domain for images

## Why This Fix Works

1. **`trustHost: true` in auth.ts**: Tells NextAuth to trust the host from the request headers
2. **`AUTH_TRUST_HOST=true` environment variable**: Alternative way to enable trust
3. **`HOSTNAME="0.0.0.0"`**: Ensures the container accepts connections from all network interfaces

Without these settings, NextAuth blocks requests because it can't verify the host is legitimate, which is a security feature to prevent certain types of attacks.

## Security Considerations

- In production, always use HTTPS
- Store `AUTH_SECRET` in AWS Secrets Manager, not as plain text
- Use proper CORS and CSP headers
- Ensure your security groups restrict access appropriately

## Troubleshooting

### Still seeing UntrustedHost error?

1. **Check environment variables are set**:

   ```bash
   docker exec <container_id> env | grep AUTH
   ```

2. **Verify NEXTAUTH_URL matches**:
   - Should be the full URL users access your app from
   - Include protocol (http:// or https://)
   - No trailing slash

3. **Check logs**:

   ```bash
   docker logs <container_id>
   # Or in ECS
   aws logs tail /ecs/slt-web --follow
   ```

4. **Verify auth.ts has trustHost: true**:
   ```typescript
   NextAuth({
     trustHost: true, // ← Must be present
     // ...
   });
   ```

### Container exits immediately?

- Check all required environment variables are set
- Review CloudWatch logs in ECS
- Test locally first with `docker-compose up`

### Health check failing?

- Ensure `/api/health/route.ts` exists
- Increase `startPeriod` in ECS task definition
- Verify security groups allow traffic on port 3000

## Files Modified

- ✅ `auth.ts` - Added `trustHost: true`
- ✅ `Dockerfile` - Added `AUTH_TRUST_HOST=true`
- ✅ `.env.example` - Production env template
- ✅ `.env.local.example` - Local testing env template
- ✅ `docker-compose.yml` - Easy local testing
- ✅ `docker-deploy.sh` - Added AUTH_TRUST_HOST to test command
- ✅ `DOCKER-DEPLOYMENT.md` - Updated documentation

## Quick Start Commands

```bash
# Local testing with Docker Compose
cp .env.local.example .env.local
# Edit .env.local with your values
docker-compose up

# Build and test
./docker-deploy.sh test

# Deploy to AWS
./docker-deploy.sh deploy
aws ecs update-service --cluster your-cluster --service slt-web --force-new-deployment
```

## Additional Resources

- [NextAuth.js v5 Documentation](https://authjs.dev/getting-started/deployment)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [AWS ECS Task Definitions](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)
