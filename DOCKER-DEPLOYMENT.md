# Docker Deployment Guide for AWS ECS/Fargate

## ⚠️ Important: Platform Architecture

**AWS Fargate requires `linux/amd64` platform.**

If you're building on **Apple Silicon (M1/M2/M3)**, you MUST build for the correct platform or you'll get:

```
CannotPullContainerError: image Manifest does not contain descriptor matching platform 'linux/amd64'
```

**Solution**: Use the buildx script for cross-platform builds:

```bash
./docker-buildx-deploy.sh setup   # One-time setup
./docker-buildx-deploy.sh deploy  # Build for amd64 and push to ECR
```

See [PLATFORM-FIX.md](./PLATFORM-FIX.md) for complete details.

---

## Issues Fixed in Dockerfile

### 1. **HOSTNAME Environment Variable**

- Added `ENV HOSTNAME="0.0.0.0"` to bind to all network interfaces
- This is critical for ECS/Fargate as containers need to accept connections from the load balancer

### 2. **NextAuth Trust Host**

- Added `ENV AUTH_TRUST_HOST=true` to fix "UntrustedHost" error
- Added `trustHost: true` in `auth.ts` configuration
- Required for NextAuth v5 to work in containerized environments

### 3. **Platform Architecture**

- AWS Fargate ONLY supports `linux/amd64`
- Use `docker-buildx-deploy.sh` for cross-platform builds (Apple Silicon users)
- Standard `docker-deploy.sh` now includes `--platform linux/amd64` flag

### 4. **Public Folder**

- Uncommented and properly copied the `/public` folder
- Next.js needs this for static assets like images, fonts, etc.

### 5. **Health Check**

- Added a HEALTHCHECK instruction for container health monitoring
- ECS uses this to determine if the container is healthy
- Health check endpoint: `http://localhost:3000/api/health`

### 6. **Proper Permissions**

- Changed `RUN chown -R` to inline `--chown` flags during COPY
- More efficient and reliable for multi-stage builds

### 6. **Dependencies Stage**

- Fixed to install ALL dependencies (not just production)
- Then reused in builder stage to avoid reinstalling

## Local Testing with Docker

### Option 1: Using Docker Compose (Recommended)

```bash
# Copy environment file
cp .env.local.example .env.local

# Edit .env.local with your values
# Then start the container
docker-compose up

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 2: Using Docker directly

```bash
# Build the image
docker build -t slt-web:latest .

# Run with all required environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e AUTH_TRUST_HOST=true \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e AUTH_SECRET=your_secret \
  -e NEXT_PUBLIC_API_URL=https://api.dev.seloger-tchad.com \
  -e NEXT_PUBLIC_IMAGES_DOMAIN=https://images.dev.seloger-tchad.com \
  slt-web:latest

# Check health
curl http://localhost:3000/api/health

# View logs
docker logs -f <container_id>
```

### Option 3: Using the deploy script

```bash
# Test build and run locally
./docker-deploy.sh test
```

## Building the Docker Image

```bash
# Build the image
docker build -t slt-web:latest .

# Check health
curl http://localhost:3000/api/health
```

## AWS ECR Push

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag the image
docker tag slt-web:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/slt-web:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/slt-web:latest
```

## ECS Task Definition Configuration

### Important Settings:

1. **Port Mappings**
   - Container Port: `3000`
   - Protocol: `tcp`
   - App Protocol: `http`

2. **Health Check** (Application Load Balancer)
   - Path: `/api/health`
   - Interval: 30 seconds
   - Timeout: 5 seconds
   - Healthy threshold: 2
   - Unhealthy threshold: 3
   - Success codes: 200

3. **Environment Variables** (Required)

   ```json
   [
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
       "name": "NEXT_PUBLIC_API_URL",
       "value": "https://api.seloger-tchad.com"
     },
     {
       "name": "NEXT_PUBLIC_IMAGES_DOMAIN",
       "value": "https://images.seloger-tchad.com"
     },
     {
       "name": "NEXTAUTH_URL",
       "value": "https://www.seloger-tchad.com"
     },
     {
       "name": "AUTH_SECRET",
       "value": "your-secret-here"
     }
   ]
   ```

4. **Secrets** (Use AWS Secrets Manager or Systems Manager Parameter Store)
   - Store sensitive values like API keys, database credentials
   - Reference them in task definition using `secrets` instead of `environment`

5. **Resources**
   - Minimum: 0.5 vCPU, 1 GB RAM
   - Recommended: 1 vCPU, 2 GB RAM

6. **Networking**
   - Security Group: Allow inbound on port 3000 from ALB
   - Subnets: Use private subnets
   - Auto-assign public IP: Disabled (use NAT gateway if needed)

## Sample ECS Task Definition (JSON)

```json
{
  "family": "slt-web",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "slt-web",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/slt-web:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "HOSTNAME",
          "value": "0.0.0.0"
        }
      ],
      "secrets": [
        {
          "name": "NEXT_PUBLIC_API_URL",
          "valueFrom": "arn:aws:ssm:us-east-1:<account-id>:parameter/slt-web/api-url"
        },
        {
          "name": "AUTH_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:slt-web/nextauth-secret"
        }
      ],
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "node -e \"require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/slt-web",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Common Issues & Solutions

### 1. Container exits immediately

- **Solution**: Check CloudWatch logs for errors
- Verify all required environment variables are set
- Test the Docker image locally first

### 2. Health check failing

- **Solution**: Increase `startPeriod` to 60-90 seconds for Next.js to fully start
- Verify the `/api/health` endpoint is accessible
- Check security groups allow traffic on port 3000

### 3. "Cannot find module" errors

- **Solution**: Ensure standalone build includes all dependencies
- Verify `output: 'standalone'` is in `next.config.js`

### 4. Static assets not loading

- **Solution**: Ensure public folder is copied in Dockerfile
- Check that `.next/static` is properly copied

### 5. Environment variables not available

- **Solution**: Use ECS task definition to pass environment variables
- For runtime variables, ensure they're prefixed with `NEXT_PUBLIC_`

## Monitoring

1. **CloudWatch Logs**
   - Configure log group: `/ecs/slt-web`
   - Enable log streaming in task definition

2. **CloudWatch Metrics**
   - Monitor CPU and memory utilization
   - Set alarms for high resource usage

3. **Application Load Balancer**
   - Monitor target health status
   - Check request count and latency

## Scaling

Configure auto-scaling based on:

- CPU utilization (target: 70%)
- Memory utilization (target: 80%)
- ALB request count per target

```bash
# Example auto-scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/your-cluster/slt-web \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```
