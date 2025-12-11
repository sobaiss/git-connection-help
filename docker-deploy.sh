#!/bin/bash

# Docker Build and Deploy Script for AWS ECS
# Usage: ./docker-deploy.sh [test|build|push|deploy]

set -e

# Configuration
IMAGE_NAME="slt-web"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
ECR_REPOSITORY="${ECR_REPOSITORY:-slt-web}"
PLATFORM="${PLATFORM:-linux/amd64}"  # AWS Fargate requires linux/amd64

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS credentials are configured
check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure'"
        exit 1
    fi
    
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        log_info "AWS Account ID: $AWS_ACCOUNT_ID"
    fi
}

# Test Docker build locally
test_build() {
    log_info "Testing Docker build locally (native platform)..."
    
    docker build -t $IMAGE_NAME:test .
    
    log_info "Build successful! Testing container..."
    
    # Run container in background
    CONTAINER_ID=$(docker run -d -p 3000:3000 \
        -e NODE_ENV=production \
        -e AUTH_TRUST_HOST=true \
        -e NEXT_PUBLIC_API_URL=http://localhost:8000 \
        $IMAGE_NAME:test)
    
    log_info "Container started: $CONTAINER_ID"
    log_info "Waiting for container to be ready..."
    
    # Wait for health check
    sleep 10
    
    # Check health endpoint
    if curl -f http://localhost:3000/api/health; then
        log_info "Health check passed!"
    else
        log_error "Health check failed!"
        docker logs $CONTAINER_ID
        docker stop $CONTAINER_ID
        docker rm $CONTAINER_ID
        exit 1
    fi
    
    log_info "Test successful! Cleaning up..."
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
    
    log_info "You can now build and push to ECR"
}

# Build Docker image
build_image() {
    log_info "Building Docker image for platform: $PLATFORM"
    log_warn "This may take longer for cross-platform builds (e.g., building linux/amd64 on Apple Silicon)"
    
    docker build --platform $PLATFORM -t $IMAGE_NAME:latest .
    
    log_info "Build completed successfully!"
}

# Push to ECR
push_to_ecr() {
    check_aws_credentials
    
    log_info "Logging in to Amazon ECR..."
    aws ecr get-login-password --region $AWS_REGION | \
        docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    log_info "Tagging image..."
    docker tag $IMAGE_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
    docker tag $IMAGE_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$(date +%Y%m%d-%H%M%S)
    
    log_info "Pushing image to ECR..."
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$(date +%Y%m%d-%H%M%S)
    
    log_info "Image pushed successfully!"
}

# Full deployment
deploy() {
    log_info "Starting full deployment..."
    
    build_image
    push_to_ecr
    
    log_info "Deployment completed!"
    log_warn "Remember to update your ECS service to use the new image"
    log_info "You can force a new deployment with:"
    log_info "  aws ecs update-service --cluster <cluster-name> --service <service-name> --force-new-deployment"
}

# Main script
case "$1" in
    test)
        test_build
        ;;
    build)
        build_image
        ;;
    push)
        push_to_ecr
        ;;
    deploy)
        deploy
        ;;
    *)
        echo "Usage: $0 {test|build|push|deploy}"
        echo ""
        echo "Commands:"
        echo "  test   - Build and test Docker image locally"
        echo "  build  - Build Docker image"
        echo "  push   - Push image to Amazon ECR"
        echo "  deploy - Build and push to ECR"
        echo ""
        echo "Environment Variables:"
        echo "  AWS_REGION      - AWS region (default: us-east-1)"
        echo "  AWS_ACCOUNT_ID  - AWS account ID (auto-detected if not set)"
        echo "  ECR_REPOSITORY  - ECR repository name (default: slt-web)"
        echo "  PLATFORM        - Target platform (default: linux/amd64)"
        echo ""
        echo "Note: AWS Fargate requires linux/amd64 platform"
        exit 1
        ;;
esac
