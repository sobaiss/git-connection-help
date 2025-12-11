#!/bin/bash

# Docker Buildx Multi-Platform Build and Deploy Script for AWS ECS
# Usage: ./docker-buildx-deploy.sh [setup|build|push|deploy]

set -e

# Configuration
IMAGE_NAME="slt-web"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
ECR_REPOSITORY="${ECR_REPOSITORY:-slt-web}"
PLATFORM="linux/amd64"  # AWS Fargate requires linux/amd64
BUILDER_NAME="slt-web-builder"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
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

# Setup Docker buildx
setup_buildx() {
    log_step "Setting up Docker buildx for multi-platform builds..."
    
    # Check if buildx is available
    if ! docker buildx version &> /dev/null; then
        log_error "Docker buildx is not available. Please upgrade to Docker 19.03 or later"
        exit 1
    fi
    
    # Check if builder already exists
    if docker buildx inspect $BUILDER_NAME &> /dev/null; then
        log_info "Builder '$BUILDER_NAME' already exists"
    else
        log_info "Creating new builder '$BUILDER_NAME'..."
        docker buildx create --name $BUILDER_NAME --driver docker-container --bootstrap
    fi
    
    # Use the builder
    docker buildx use $BUILDER_NAME
    
    # Inspect builder
    docker buildx inspect --bootstrap
    
    log_info "Buildx setup completed!"
    log_info "You can now build images for $PLATFORM"
}

# Build Docker image using buildx
build_image() {
    log_step "Building Docker image for platform: $PLATFORM"
    
    # Ensure builder is set up
    if ! docker buildx inspect $BUILDER_NAME &> /dev/null; then
        log_warn "Builder not found. Setting up buildx first..."
        setup_buildx
    fi
    
    # Use the builder
    docker buildx use $BUILDER_NAME
    
    log_info "Building multi-platform image..."
    log_warn "Note: Building for $PLATFORM on a different architecture may take longer"
    
    # Build and load the image locally
    docker buildx build \
        --platform $PLATFORM \
        --tag $IMAGE_NAME:latest \
        --load \
        .
    
    log_info "Build completed successfully!"
    log_info "Image: $IMAGE_NAME:latest"
    log_info "Platform: $PLATFORM"
}

# Build and push directly to ECR (most efficient)
build_and_push() {
    check_aws_credentials
    
    log_step "Building and pushing to ECR in one step..."
    
    # Ensure builder is set up
    if ! docker buildx inspect $BUILDER_NAME &> /dev/null; then
        log_warn "Builder not found. Setting up buildx first..."
        setup_buildx
    fi
    
    # Use the builder
    docker buildx use $BUILDER_NAME
    
    log_info "Logging in to Amazon ECR..."
    aws ecr get-login-password --region $AWS_REGION | \
        docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Generate timestamp for versioning
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    ECR_IMAGE_LATEST="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest"
    ECR_IMAGE_VERSIONED="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$TIMESTAMP"
    
    log_info "Building and pushing image for $PLATFORM..."
    log_info "Tags: latest, $TIMESTAMP"
    
    # Build and push directly (most efficient for cross-platform)
    docker buildx build \
        --platform $PLATFORM \
        --tag $ECR_IMAGE_LATEST \
        --tag $ECR_IMAGE_VERSIONED \
        --push \
        .
    
    log_info "Image pushed successfully!"
    log_info "Latest: $ECR_IMAGE_LATEST"
    log_info "Version: $ECR_IMAGE_VERSIONED"
}

# Push existing local image to ECR
push_to_ecr() {
    check_aws_credentials
    
    log_step "Pushing existing image to Amazon ECR..."
    
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
    log_step "Starting full deployment to AWS ECS..."
    
    # Use build_and_push for most efficient cross-platform deployment
    build_and_push
    
    log_info "Deployment completed!"
    log_warn "Remember to update your ECS service to use the new image"
    log_info "You can force a new deployment with:"
    echo ""
    echo "  aws ecs update-service \\"
    echo "    --cluster <cluster-name> \\"
    echo "    --service <service-name> \\"
    echo "    --force-new-deployment"
    echo ""
}

# Verify platform of existing image
verify_platform() {
    log_step "Verifying platform of image: $IMAGE_NAME:latest"
    
    if docker image inspect $IMAGE_NAME:latest &> /dev/null; then
        docker image inspect $IMAGE_NAME:latest --format '{{.Os}}/{{.Architecture}}'
    else
        log_error "Image $IMAGE_NAME:latest not found locally"
        exit 1
    fi
}

# Main script
case "$1" in
    setup)
        setup_buildx
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
    verify)
        verify_platform
        ;;
    *)
        echo "Usage: $0 {setup|build|push|deploy|verify}"
        echo ""
        echo "Commands:"
        echo "  setup  - Set up Docker buildx for multi-platform builds"
        echo "  build  - Build Docker image for linux/amd64"
        echo "  push   - Push existing image to Amazon ECR"
        echo "  deploy - Build for linux/amd64 and push to ECR (recommended)"
        echo "  verify - Verify platform of local image"
        echo ""
        echo "Environment Variables:"
        echo "  AWS_REGION      - AWS region (default: us-east-1)"
        echo "  AWS_ACCOUNT_ID  - AWS account ID (auto-detected if not set)"
        echo "  ECR_REPOSITORY  - ECR repository name (default: slt-web)"
        echo ""
        echo "Note: AWS Fargate requires linux/amd64 platform"
        echo "      This script uses Docker buildx for efficient cross-platform builds"
        exit 1
        ;;
esac
