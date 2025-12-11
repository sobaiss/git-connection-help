# ECS Fargate Deployment Guide for beti-heroui

This guide will walk you through deploying your Next.js application to AWS ECS Fargate with a custom domain.

## Prerequisites

- AWS CLI installed and configured with appropriate credentials
- Docker installed locally
- AWS Account ID: 932320093907
- ECR Repository: beti (already exists)
- SSL Certificate ARN for dev.selegor-tchad.com
- VPC with at least 2 public subnets in different availability zones

## Deployment Architecture

```
Internet → Route 53 (dev.selegor-tchad.com)
         → Application Load Balancer (HTTPS)
         → ECS Fargate Tasks (Next.js)
         → Supabase Database
```

## Step-by-Step Deployment

### Phase 1: Initial Setup (One-time)

#### 1.1 Create IAM Roles

You need two IAM roles for ECS:

**Create Task Execution Role:**
```bash
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

**Create Task Role:**
```bash
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'
```

#### 1.2 Create Security Groups

**ALB Security Group:**
```bash
aws ec2 create-security-group \
  --group-name beti-alb-sg \
  --description "Security group for Beti ALB" \
  --vpc-id <YOUR_VPC_ID>

# Note the security group ID from the output

aws ec2 authorize-security-group-ingress \
  --group-id <ALB_SG_ID> \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id <ALB_SG_ID> \
  --protocol tcp --port 443 --cidr 0.0.0.0/0
```

**ECS Tasks Security Group:**
```bash
aws ec2 create-security-group \
  --group-name beti-ecs-sg \
  --description "Security group for Beti ECS tasks" \
  --vpc-id <YOUR_VPC_ID>

# Note the security group ID

aws ec2 authorize-security-group-ingress \
  --group-id <ECS_SG_ID> \
  --protocol tcp --port 3000 \
  --source-group <ALB_SG_ID>
```

#### 1.3 Create Application Load Balancer

**Create ALB:**
```bash
aws elbv2 create-load-balancer \
  --name beti-alb \
  --subnets <SUBNET_ID_1> <SUBNET_ID_2> \
  --security-groups <ALB_SG_ID> \
  --scheme internet-facing \
  --type application
```

Note the ALB ARN and DNS name from the output.

**Create Target Group:**
```bash
aws elbv2 create-target-group \
  --name beti-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id <YOUR_VPC_ID> \
  --target-type ip \
  --health-check-enabled \
  --health-check-path / \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3
```

Note the Target Group ARN.

**Create HTTPS Listener:**
```bash
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<YOUR_CERTIFICATE_ARN> \
  --default-actions Type=forward,TargetGroupArn=<TARGET_GROUP_ARN>
```

**Create HTTP to HTTPS Redirect:**
```bash
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}"
```

#### 1.4 Configure Route 53

```bash
# Get your hosted zone ID
aws route53 list-hosted-zones-by-name --dns-name selegor-tchad.com

# Create A record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id <HOSTED_ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "dev.selegor-tchad.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "<ALB_HOSTED_ZONE_ID>",
          "DNSName": "<ALB_DNS_NAME>",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

#### 1.5 Initialize Infrastructure

```bash
# Run the infrastructure setup script
./aws/setup-infrastructure.sh
```

This will:
- Create CloudWatch log group
- Create ECS cluster
- Register the task definition

#### 1.6 Create ECS Service

```bash
# Replace with your actual values
./aws/create-service.sh \
  <VPC_ID> \
  <SUBNET_ID_1>,<SUBNET_ID_2> \
  <ECS_SG_ID> \
  <TARGET_GROUP_ARN>
```

### Phase 2: Build and Deploy

#### 2.1 Build and Push Docker Image

```bash
# Build and push with default tag (latest)
./aws/build-and-push.sh

# Or with a specific tag
./aws/build-and-push.sh v1.0.0
```

This script will:
1. Authenticate with ECR
2. Build the Docker image
3. Tag the image
4. Push to ECR

#### 2.2 Deploy to ECS

After the initial service is created, use the deploy script for updates:

```bash
# Full deployment (build + update service)
./aws/deploy.sh

# Or with specific tag
./aws/deploy.sh v1.0.0
```

This will:
1. Build and push the Docker image
2. Update the ECS service with the new image
3. Force a new deployment

### Phase 3: Verification

#### 3.1 Check Service Status

```bash
aws ecs describe-services \
  --cluster beti-cluster \
  --services beti-service \
  --region eu-west-1
```

#### 3.2 Check Running Tasks

```bash
aws ecs list-tasks \
  --cluster beti-cluster \
  --service-name beti-service \
  --region eu-west-1
```

#### 3.3 View Logs

```bash
aws logs tail /ecs/beti-task --follow --region eu-west-1
```

#### 3.4 Test Application

```bash
# Test ALB health
curl -I https://dev.selegor-tchad.com

# Should return 200 OK
```

## Ongoing Deployments

For subsequent deployments after initial setup:

```bash
# Option 1: Full deployment pipeline
./aws/deploy.sh

# Option 2: Just update the service (if image already pushed)
./aws/update-service.sh
```

## Monitoring and Troubleshooting

### View CloudWatch Logs

```bash
aws logs tail /ecs/beti-task --follow --region eu-west-1
```

### Check Task Status

```bash
aws ecs describe-tasks \
  --cluster beti-cluster \
  --tasks <TASK_ID> \
  --region eu-west-1
```

### Common Issues

1. **Task fails to start:**
   - Check CloudWatch logs for errors
   - Verify IAM roles have correct permissions
   - Ensure security groups allow traffic

2. **Health checks failing:**
   - Verify the application is listening on port 3000
   - Check health check path is accessible
   - Review CloudWatch logs for application errors

3. **502 Bad Gateway:**
   - Check if tasks are running
   - Verify target group health checks
   - Ensure security group allows ALB → ECS traffic

4. **Cannot pull image:**
   - Verify ECR permissions in task execution role
   - Check if image exists in ECR
   - Ensure correct image URI in task definition

## Scaling

### Manual Scaling

```bash
aws ecs update-service \
  --cluster beti-cluster \
  --service beti-service \
  --desired-count 3 \
  --region eu-west-1
```

### Auto Scaling (Optional)

Configure auto-scaling based on CPU or memory:

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/beti-cluster/beti-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 5

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/beti-cluster/beti-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## Cost Optimization

Current configuration:
- **Fargate Task:** 0.25 vCPU, 0.5 GB RAM
- **Estimated Cost:** ~$10-15/month for 1 task running 24/7

To optimize costs:
1. Use Fargate Spot for non-production
2. Implement task scheduling for dev environments
3. Review CloudWatch logs retention

## Security Checklist

- [x] Environment variables in task definition (not hardcoded)
- [x] HTTPS enforced via ALB
- [x] Security groups follow least privilege
- [x] IAM roles have minimal required permissions
- [x] Container runs as non-root user
- [ ] Enable AWS WAF on ALB (optional)
- [ ] Enable VPC Flow Logs (optional)
- [ ] Set up AWS Config for compliance (optional)

## Backup and Disaster Recovery

Your application is stateless, with data in Supabase:
1. Supabase handles database backups automatically
2. Docker images are versioned in ECR
3. Infrastructure is code-based for quick recovery

## Support

For issues or questions:
1. Check CloudWatch logs first
2. Review AWS ECS service events
3. Verify ALB target health

## Quick Reference

| Resource | Value |
|----------|-------|
| Cluster | beti-cluster |
| Service | beti-service |
| Task Definition | beti-task |
| ECR Repository | 932320093907.dkr.ecr.eu-west-1.amazonaws.com/beti |
| Domain | dev.selegor-tchad.com |
| Container Port | 3000 |
| Task Size | 0.25 vCPU, 0.5 GB RAM |
| Region | eu-west-1 |
