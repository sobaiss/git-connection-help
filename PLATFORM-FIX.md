# Fix for "Image Manifest does not contain descriptor matching platform 'linux/amd64'"

## Problem

When deploying to AWS ECS/Fargate, you get this error:

```
CannotPullContainerError: pull image manifest has been retried 7 time(s):
image Manifest does not contain descriptor matching platform 'linux/amd64'
```

## Root Cause

- **AWS Fargate only supports `linux/amd64` architecture**
- If you built the Docker image on **Apple Silicon (M1/M2/M3)** Mac, it's built for `linux/arm64` by default
- ECS tries to pull an `amd64` image but finds only `arm64` in the manifest

## Solution: Build for the Correct Platform

### Option 1: Using Docker Buildx (Recommended) ⭐

Docker buildx enables cross-platform builds efficiently.

#### Step 1: Setup buildx (one-time)

```bash
./docker-buildx-deploy.sh setup
```

This creates a builder that can build for different platforms.

#### Step 2: Build and Deploy

```bash
# Build for linux/amd64 and push to ECR in one step
./docker-buildx-deploy.sh deploy
```

Or step by step:

```bash
# Build for linux/amd64
./docker-buildx-deploy.sh build

# Push to ECR
./docker-buildx-deploy.sh push
```

#### Verify Platform

```bash
# Check platform of your local image
./docker-buildx-deploy.sh verify

# Should output: linux/amd64
```

### Option 2: Using Standard Docker Build

Update the original deploy script to specify platform:

```bash
# Build for linux/amd64 explicitly
PLATFORM=linux/amd64 ./docker-deploy.sh build

# Push to ECR
./docker-deploy.sh push
```

Or manually:

```bash
# Build for the correct platform
docker build --platform linux/amd64 -t slt-web:latest .

# Tag for ECR
docker tag slt-web:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/slt-web:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/slt-web:latest
```

### Option 3: Build Directly on EC2 (Alternative)

If cross-platform builds are slow, you can build on an EC2 instance:

```bash
# Launch an EC2 instance (t3.medium or larger)
# SSH into it
ssh ec2-user@<instance-ip>

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Clone your repo and build
git clone <your-repo>
cd <your-repo>
docker build -t slt-web:latest .

# Login to ECR and push
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag slt-web:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/slt-web:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/slt-web:latest
```

## Quick Start - Recommended Workflow

### If you're on Apple Silicon Mac:

```bash
# 1. Setup buildx (one-time only)
./docker-buildx-deploy.sh setup

# 2. Deploy (builds for linux/amd64 and pushes to ECR)
export AWS_ACCOUNT_ID=your-account-id
export AWS_REGION=us-east-1
./docker-buildx-deploy.sh deploy

# 3. Update ECS service
aws ecs update-service \
  --cluster your-cluster \
  --service slt-web \
  --force-new-deployment
```

### If you're on Intel/AMD Mac or Linux:

```bash
# Use the standard script (already builds linux/amd64)
./docker-deploy.sh deploy
```

## Verify Your Image Platform

### Before Pushing to ECR:

```bash
# Check local image
docker image inspect slt-web:latest --format '{{.Os}}/{{.Architecture}}'

# Should output: linux/amd64
```

### After Pushing to ECR:

```bash
# Get image manifest from ECR
aws ecr batch-get-image \
  --repository-name slt-web \
  --image-ids imageTag=latest \
  --accepted-media-types "application/vnd.docker.distribution.manifest.v2+json" \
  --region us-east-1 \
  --query 'images[0].imageManifest' | jq -r . | jq .

# Or use AWS Console:
# ECR → Repositories → slt-web → Images → Click on image → Check "Architecture"
```

## Understanding Platform Architecture

| Platform       | Description                 | Use Case                          |
| -------------- | --------------------------- | --------------------------------- |
| `linux/amd64`  | 64-bit Intel/AMD processors | AWS Fargate, most cloud services  |
| `linux/arm64`  | 64-bit ARM processors       | Apple Silicon, Graviton instances |
| `linux/arm/v7` | 32-bit ARM                  | Raspberry Pi, older ARM devices   |

**AWS Fargate supports ONLY `linux/amd64`** (as of 2025)

## Troubleshooting

### Issue 1: "Multiple platforms feature is currently not supported"

**Solution**: Enable Docker buildx:

```bash
docker buildx version
# If not available, update Docker Desktop to latest version
```

### Issue 2: Cross-platform build is very slow

**Cause**: QEMU emulation for different architecture  
**Solutions**:

1. Use `docker-buildx-deploy.sh deploy` which builds and pushes in one step (most efficient)
2. Build on an EC2 instance with matching architecture
3. Use AWS CodeBuild to build images

### Issue 3: "exec format error" when running locally

**Cause**: Trying to run an `amd64` image on Apple Silicon  
**Solution**: Build a local version for testing:

```bash
# For local testing on Apple Silicon
docker build -t slt-web:local .

# For AWS deployment
docker buildx build --platform linux/amd64 -t slt-web:aws .
```

### Issue 4: Image still shows wrong platform in ECR

**Solution**: Delete old images and rebuild:

```bash
# Delete image from ECR
aws ecr batch-delete-image \
  --repository-name slt-web \
  --image-ids imageTag=latest

# Rebuild and push
./docker-buildx-deploy.sh deploy
```

## Performance Considerations

### Build Speed Comparison (on Apple Silicon):

| Method           | Build Time | Notes                                         |
| ---------------- | ---------- | --------------------------------------------- |
| Native (`arm64`) | ~2-3 min   | Fast, but won't work on Fargate               |
| Buildx (`amd64`) | ~5-8 min   | Slower due to emulation, but works on Fargate |
| EC2 (`amd64`)    | ~2-3 min   | Fast, requires EC2 instance                   |

### Optimization Tips:

1. **Use multi-stage builds** (already in Dockerfile) ✅
2. **Cache layers**: Buildx caches between builds
3. **Use `.dockerignore`**: Reduces build context size ✅
4. **Build on push**: Use GitHub Actions or AWS CodeBuild

## Using GitHub Actions for Automated Builds

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy to ECR

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest # Native linux/amd64

    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: slt-web
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster your-cluster \
            --service slt-web \
            --force-new-deployment
```

## Files Updated

- ✅ `docker-deploy.sh` - Added `PLATFORM` variable, builds for `linux/amd64`
- ✅ `docker-buildx-deploy.sh` - New script for efficient multi-platform builds
- ✅ `PLATFORM-FIX.md` - This documentation

## Quick Reference

### Check what platform you're on:

```bash
uname -m
# x86_64 = Intel/AMD
# arm64  = Apple Silicon
```

### Check image platform:

```bash
docker image inspect <image> --format '{{.Os}}/{{.Architecture}}'
```

### Build for specific platform:

```bash
docker build --platform linux/amd64 -t myimage .
```

### Use buildx for better performance:

```bash
docker buildx build --platform linux/amd64 -t myimage --push .
```

## Summary

✅ **Root Cause**: Image built for wrong architecture (arm64 instead of amd64)  
✅ **Solution**: Use `docker-buildx-deploy.sh deploy` to build for linux/amd64  
✅ **Verification**: Check platform before pushing to ECR  
✅ **Best Practice**: Use buildx or CI/CD for cross-platform builds

Your Docker images will now work perfectly with AWS Fargate! 🚀
