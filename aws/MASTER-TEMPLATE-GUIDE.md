# Master CloudFormation Template Deployment Guide

This guide explains how to use the consolidated master CloudFormation template to deploy your entire ECS Fargate infrastructure in a single stack.

## Overview

The `master-template.yaml` consolidates all infrastructure components into one file:

- IAM Roles (Task Execution & Task Role)
- Security Groups (ALB & ECS)
- Application Load Balancer & Target Groups
- Route 53 DNS Records
- ECS Cluster, Task Definition & Service
- CloudWatch Log Groups

## Benefits of Master Template

1. **Single Stack Deployment** - Deploy everything at once
2. **Simplified Management** - One stack to manage instead of four
3. **No Cross-Stack References** - All resources in one template
4. **Easier Updates** - Update entire infrastructure with one command
5. **Consistent State** - All resources created/updated together

## Prerequisites

Before deploying, ensure you have:

1. **AWS CLI** configured with appropriate credentials
2. **Docker** installed for building images
3. **VPC with 2+ public subnets** in different availability zones
4. **SSL/TLS certificate** in ACM for your domain
5. **Route 53 hosted zone** for your domain
6. **ECR repository** created (932320093907.dkr.ecr.eu-west-1.amazonaws.com/beti)

## Configuration

### Update Parameters in master-template.yaml

Edit `aws/cloudformation/master-template.yaml` and update the default values in the Parameters section:

```yaml
Parameters:
  ProjectName:
    Default: beti # Your project name

  VpcId:
    Default: vpc-xxxxxxxxx # Your VPC ID

  PublicSubnet1:
    Default: subnet-xxxxxxxxx # First public subnet

  PublicSubnet2:
    Default: subnet-yyyyyyyyy # Second public subnet (different AZ)

  CertificateArn:
    Default: arn:aws:acm:eu-west-1:932320093907:certificate/xxxxx # Your ACM certificate

  HostedZoneId:
    Default: Z1234567890ABC # Your Route 53 hosted zone ID

  DomainName:
    Default: dev.selegor-tchad.com # Your domain name

  ImageUri:
    Default: 932320093907.dkr.ecr.eu-west-1.amazonaws.com/beti:latest # ECR image

  SupabaseUrl:
    Default: https://0ec90b57d6e95fcbda19832f.supabase.co # Your Supabase URL

  SupabaseAnonKey:
    Default: your-supabase-anon-key # Your Supabase anonymous key
```

### Get Your AWS Resource Values

```bash
# Get VPC ID
aws ec2 describe-vpcs --region eu-west-1 \
  --query 'Vpcs[*].[VpcId,Tags[?Key==`Name`].Value|[0]]' \
  --output table

# Get Subnet IDs (need 2 public subnets in different AZs)
aws ec2 describe-subnets --region eu-west-1 \
  --query 'Subnets[*].[SubnetId,AvailabilityZone,Tags[?Key==`Name`].Value|[0]]' \
  --output table

# Get Certificate ARN
aws acm list-certificates --region eu-west-1 \
  --query 'CertificateSummaryList[*].[CertificateArn,DomainName]' \
  --output table

# Get Hosted Zone ID
aws route53 list-hosted-zones \
  --query 'HostedZones[*].[Id,Name]' \
  --output table
```

## Deployment

### Quick Start

```bash
# 1. Validate the template
make ecs-validate-master

# 2. Deploy the complete infrastructure
make ecs-deploy-master

# 3. Build and push Docker image
make docker-push

# 4. Update the service with new image
make ecs-update-master
```

### Step-by-Step Deployment

#### Step 1: Validate Template

```bash
make ecs-validate-master
```

Or manually:

```bash
aws cloudformation validate-template \
  --template-body file://aws/cloudformation/master-template.yaml \
  --region eu-west-1
```

#### Step 2: Deploy Infrastructure

```bash
make ecs-deploy-master
```

This will:

1. Validate the template
2. Create/update the CloudFormation stack
3. Create all resources (IAM, networking, ALB, ECS)
4. Display stack outputs

The deployment takes approximately 8-12 minutes.

Or deploy manually:

```bash
aws cloudformation deploy \
  --template-file aws/cloudformation/master-template.yaml \
  --stack-name beti-ecs-fargate \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-west-1 \
  --no-fail-on-empty-changeset
```

#### Step 3: Monitor Deployment

Watch the stack creation in real-time:

```bash
# In another terminal
watch -n 5 'aws cloudformation describe-stacks \
  --stack-name beti-ecs-fargate \
  --region eu-west-1 \
  --query "Stacks[0].StackStatus"'
```

Or check events:

```bash
aws cloudformation describe-stack-events \
  --stack-name beti-ecs-fargate \
  --region eu-west-1 \
  --max-items 20 \
  --query 'StackEvents[*].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId]' \
  --output table
```

#### Step 4: Build and Deploy Application

```bash
# Build Docker image and push to ECR
make docker-push

# Force new ECS deployment
aws ecs update-service \
  --cluster beti-cluster \
  --service beti-service \
  --force-new-deployment \
  --region eu-west-1
```

#### Step 5: Verify Deployment

```bash
# Check stack outputs
make ecs-master-outputs

# Check service status
make ecs-service-status

# View logs
make ecs-logs-recent

# Test the application
curl -I https://dev.selegor-tchad.com
```

## Makefile Commands

### Master Template Commands

```bash
# Validation
make ecs-validate-master       # Validate master template

# Deployment
make ecs-deploy-master         # Deploy complete infrastructure
make ecs-update-master         # Build, push image, and update stack

# Monitoring
make ecs-master-outputs        # Show stack outputs
make ecs-master-status         # Show stack status
make ecs-service-status        # Show ECS service details
make ecs-logs                  # Tail logs
make ecs-logs-recent           # Show recent logs

# Cleanup
make ecs-delete-master         # Delete entire stack
```

### Docker Commands

```bash
make docker-build              # Build Docker image
make docker-push               # Build and push to ECR
make docker-login              # Login to ECR
```

## Updating the Application

### Code Changes Only

When you've made code changes without infrastructure updates:

```bash
# Build new image, push to ECR, and force new deployment
make ecs-update-master
```

This will:

1. Build Docker image
2. Push to ECR
3. Update CloudFormation stack (no changes if infrastructure unchanged)
4. Force ECS to deploy new tasks

Or manually:

```bash
# Build and push
make docker-push

# Force new deployment
aws ecs update-service \
  --cluster beti-cluster \
  --service beti-service \
  --force-new-deployment \
  --region eu-west-1
```

### Infrastructure Changes

When you've updated the CloudFormation template:

```bash
make ecs-deploy-master
```

CloudFormation will:

- Detect changes in the template
- Create a change set
- Update only the changed resources
- Preserve unchanged resources

### Update Specific Parameters

Deploy with parameter overrides:

```bash
aws cloudformation deploy \
  --template-file aws/cloudformation/master-template.yaml \
  --stack-name beti-ecs-fargate \
  --parameter-overrides \
    DesiredCount=3 \
    ContainerCpu=512 \
    ContainerMemory=1024 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-west-1
```

### Scale Service

```bash
# Scale to 3 tasks
aws ecs update-service \
  --cluster beti-cluster \
  --service beti-service \
  --desired-count 3 \
  --region eu-west-1
```

Or update the DesiredCount parameter in the template and redeploy.

## Monitoring

### View Stack Outputs

```bash
make ecs-master-outputs
```

Key outputs:

- **ApplicationURL** - Your application URL
- **LoadBalancerDNS** - ALB DNS name
- **ClusterName** - ECS cluster name
- **ServiceName** - ECS service name

### Check Stack Status

```bash
make ecs-master-status
```

### View Application Logs

```bash
# Follow logs
make ecs-logs

# Recent logs
make ecs-logs-recent

# Specific time range
aws logs tail /ecs/beti-task --since 1h --region eu-west-1
```

### Check Service Health

```bash
# Service status
make ecs-service-status

# Target group health
aws elbv2 describe-target-health \
  --target-group-arn $(aws cloudformation describe-stacks \
    --stack-name beti-ecs-fargate \
    --query 'Stacks[0].Outputs[?OutputKey==`TargetGroupArn`].OutputValue' \
    --output text \
    --region eu-west-1)
```

## Troubleshooting

### Stack Creation Fails

View failed resource details:

```bash
aws cloudformation describe-stack-events \
  --stack-name beti-ecs-fargate \
  --region eu-west-1 \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

Common issues:

- **Invalid VPC/Subnet IDs** - Verify they exist and are correct
- **Certificate not found** - Check ACM certificate ARN
- **Hosted zone not found** - Verify Route 53 hosted zone ID
- **IAM permissions** - Ensure you have permission to create IAM roles

### Tasks Not Starting

```bash
# Check service events
aws ecs describe-services \
  --cluster beti-cluster \
  --services beti-service \
  --region eu-west-1 \
  --query 'services[0].events[0:5]'

# Check task logs
make ecs-logs-recent
```

Common issues:

- **Image not found** - Run `make docker-push`
- **Task execution role** - Verify IAM permissions
- **Health check failing** - Check application logs

### Application Not Accessible

```bash
# Check DNS resolution
dig dev.selegor-tchad.com
nslookup dev.selegor-tchad.com

# Test ALB directly
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name beti-ecs-fargate \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --region eu-west-1)
curl -I http://$ALB_DNS

# Check target health
aws elbv2 describe-target-health \
  --target-group-arn $(aws cloudformation describe-stacks \
    --stack-name beti-ecs-fargate \
    --query 'Stacks[0].Outputs[?OutputKey==`TargetGroupArn`].OutputValue' \
    --output text \
    --region eu-west-1)
```

### Update Stack Fails

If a stack update fails, CloudFormation automatically rolls back:

```bash
# Check rollback reason
aws cloudformation describe-stack-events \
  --stack-name beti-ecs-fargate \
  --region eu-west-1 \
  --query 'StackEvents[?contains(ResourceStatus, `ROLLBACK`)]'

# Continue with rollback if stuck
aws cloudformation continue-update-rollback \
  --stack-name beti-ecs-fargate \
  --region eu-west-1
```

## Cleanup

### Delete Everything

```bash
make ecs-delete-master
```

This will:

1. Prompt for confirmation
2. Delete the CloudFormation stack
3. Remove all resources (IAM, networking, ALB, ECS)
4. Wait for deletion to complete

**Note:** This does NOT delete:

- ECR repository and images
- CloudWatch log data (retention: 7 days)
- VPC and subnets (pre-existing)

### Manual Deletion

```bash
aws cloudformation delete-stack \
  --stack-name beti-ecs-fargate \
  --region eu-west-1

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name beti-ecs-fargate \
  --region eu-west-1
```

### Cleanup ECR Images

```bash
# List images
aws ecr list-images \
  --repository-name beti \
  --region eu-west-1

# Delete specific image
aws ecr batch-delete-image \
  --repository-name beti \
  --image-ids imageTag=v1.0.0 \
  --region eu-west-1

# Delete all images
aws ecr batch-delete-image \
  --repository-name beti \
  --image-ids $(aws ecr list-images \
    --repository-name beti \
    --query 'imageIds[*]' \
    --output json \
    --region eu-west-1) \
  --region eu-west-1
```

## Cost Optimization

Current configuration cost (1 task, 0.25 vCPU, 0.5GB):

| Resource        | Monthly Cost |
| --------------- | ------------ |
| Fargate         | $10-15       |
| ALB             | $16-20       |
| CloudWatch Logs | $1-2         |
| Data Transfer   | Variable     |
| **Total**       | **$27-37**   |

### Optimization Tips

1. **Use Fargate Spot** - Save 50-70% on compute
2. **Right-size tasks** - Start with smallest size
3. **Adjust log retention** - Default is 7 days
4. **Use scheduled scaling** - Scale down during off-hours
5. **Review unused resources** - Delete old ECR images

## Comparison: Master Template vs. Modular Templates

| Aspect       | Master Template       | Modular Templates               |
| ------------ | --------------------- | ------------------------------- |
| Deployment   | Single stack          | Four separate stacks            |
| Management   | Simpler               | More granular control           |
| Updates      | Update all at once    | Update components independently |
| Dependencies | Internal references   | Cross-stack exports             |
| Rollback     | All or nothing        | Component-level rollback        |
| Best For     | Small-medium projects | Large/complex projects          |

## When to Use Master Template

✅ **Use Master Template when:**

- Deploying small to medium-sized applications
- You want simple, straightforward deployment
- All components are tightly coupled
- Team prefers single-stack management

❌ **Use Modular Templates when:**

- Deploying large, complex applications
- Different teams manage different components
- You need independent update cycles
- You have shared resources across multiple applications

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1

      - name: Build and push Docker image
        run: make docker-push IMAGE_TAG=${{ github.sha }}

      - name: Update ECS service
        run: make ecs-update-master
```

## Summary

The master template provides a simplified deployment approach:

1. **Edit parameters** in master-template.yaml
2. **Deploy** with `make ecs-deploy-master`
3. **Build and push** with `make docker-push`
4. **Update** with `make ecs-update-master`
5. **Monitor** with `make ecs-service-status` and `make ecs-logs`

For detailed infrastructure information, see the individual template files in `aws/cloudformation/`.
