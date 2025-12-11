# CloudFormation Templates for ECS Fargate Deployment

This directory contains modular CloudFormation templates for deploying the beti application on AWS ECS Fargate.

## Templates Overview

The deployment is split into 4 separate stacks for modularity and better management:

1. **01-iam-roles.yaml** - IAM roles for ECS task execution and task permissions
2. **02-networking.yaml** - Security groups for ALB and ECS tasks
3. **03-alb.yaml** - Application Load Balancer, target groups, and Route 53 DNS
4. **04-ecs.yaml** - ECS cluster, task definition, and service

## Prerequisites

Before deploying, ensure you have:

1. **AWS CLI** installed and configured
2. **Docker** installed for building images
3. **VPC with public subnets** (at least 2 in different AZs)
4. **SSL/TLS certificate** in ACM for dev.selegor-tchad.com
5. **Route 53 hosted zone** for selegor-tchad.com
6. **ECR repository** created (932320093907.dkr.ecr.eu-west-1.amazonaws.com/beti)

## Configuration

Edit `parameters.json` with your values:

```json
{
  "VpcId": "vpc-xxxxxxxxx",
  "PublicSubnet1": "subnet-xxxxxxxxx",
  "PublicSubnet2": "subnet-yyyyyyyyy",
  "CertificateArn": "arn:aws:acm:eu-west-1:932320093907:certificate/...",
  "HostedZoneId": "Z1234567890ABC",
  ...
}
```

## Deployment Steps

### Quick Start (Using Makefile)

```bash
# 1. Update parameters.json with your values
vi aws/cloudformation/parameters.json

# 2. Validate all templates
make ecs-validate-all

# 3. Deploy all stacks
make ecs-deploy-all

# 4. Build and push Docker image
make docker-push

# 5. Update ECS service with new image
make ecs-update
```

### Manual Step-by-Step Deployment

#### Step 1: Validate Templates

```bash
make ecs-validate-all
```

#### Step 2: Deploy IAM Roles

```bash
make ecs-deploy-iam
```

This creates:

- Task Execution Role (for ECR and CloudWatch)
- Task Role (for application permissions)

#### Step 3: Deploy Networking

```bash
make ecs-deploy-networking
```

This creates:

- ALB Security Group (allows 80, 443 from internet)
- ECS Security Group (allows 3000 from ALB only)

#### Step 4: Deploy Application Load Balancer

```bash
make ecs-deploy-alb
```

This creates:

- Application Load Balancer
- Target Group (port 3000)
- HTTPS Listener (port 443)
- HTTP→HTTPS Redirect (port 80)
- Route 53 DNS record

#### Step 5: Deploy ECS Cluster and Service

```bash
make ecs-deploy-ecs
```

This creates:

- ECS Cluster
- Task Definition
- ECS Service
- CloudWatch Log Group

## Building and Deploying Application

### Build Docker Image

```bash
make docker-build
```

### Push to ECR

```bash
make docker-push
```

Or combine both:

```bash
make docker-push
```

### Update ECS Service

After pushing a new image:

```bash
make ecs-update
```

Or do everything at once:

```bash
make ecs-full-deploy
```

## Monitoring and Management

### Check Stack Status

```bash
make ecs-status
```

### View Stack Outputs

```bash
make ecs-outputs
```

### Check ECS Service Status

```bash
make ecs-service-status
```

### View Logs

```bash
# Tail logs (follow)
make ecs-logs

# Recent logs (last 10 minutes)
make ecs-logs-recent
```

## Updating the Application

### Update Code and Redeploy

```bash
# Build new image, push to ECR, and update service
make ecs-update
```

### Update with Specific Image Tag

```bash
make docker-push IMAGE_TAG=v1.2.3
# Update parameters.json with new ImageUri
make ecs-deploy-ecs
```

### Update Task Definition Only

```bash
# Edit aws/cloudformation/04-ecs.yaml
make ecs-deploy-ecs
```

## Deletion

### Delete Individual Stacks

```bash
make ecs-delete-ecs      # Delete ECS service first
make ecs-delete-alb      # Then ALB
make ecs-delete-networking
make ecs-delete-iam
```

### Delete All Stacks

```bash
make ecs-delete-all
```

**Note:** Stacks must be deleted in order (ECS → ALB → Networking → IAM) due to dependencies.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Internet                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│              Route 53 DNS                            │
│         dev.selegor-tchad.com                        │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│     Application Load Balancer (ALB)                  │
│          SSL/TLS Termination                         │
│        HTTP → HTTPS Redirect                         │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│           Target Group (Port 3000)                   │
│          Health Checks: GET /                        │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│        ECS Fargate Service                           │
│        - CPU: 0.25 vCPU                              │
│        - Memory: 0.5 GB                              │
│        - Desired Count: 1                            │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│         Next.js Container (Port 3000)                │
│              ↓                                       │
│         Supabase Database                            │
└──────────────────────────────────────────────────────┘
```

## Makefile Commands Reference

### Validation

- `ecs-validate-all` - Validate all CloudFormation templates

### Deployment

- `ecs-deploy-iam` - Deploy IAM roles
- `ecs-deploy-networking` - Deploy security groups
- `ecs-deploy-alb` - Deploy load balancer
- `ecs-deploy-ecs` - Deploy ECS cluster and service
- `ecs-deploy-all` - Deploy all stacks in order

### Docker Operations

- `docker-build` - Build Docker image
- `docker-login` - Login to ECR
- `docker-push` - Build, tag, and push image to ECR

### Updates

- `ecs-update` - Build, push, and update ECS service
- `ecs-full-deploy` - Complete deployment pipeline

### Monitoring

- `ecs-status` - Show all stack statuses
- `ecs-outputs` - Show all stack outputs
- `ecs-service-status` - Show ECS service status
- `ecs-logs` - Tail ECS logs
- `ecs-logs-recent` - Show recent logs

### Cleanup

- `ecs-delete-ecs` - Delete ECS stack
- `ecs-delete-alb` - Delete ALB stack
- `ecs-delete-networking` - Delete networking stack
- `ecs-delete-iam` - Delete IAM stack
- `ecs-delete-all` - Delete all stacks

## Troubleshooting

### Stack Deployment Fails

Check the stack events:

```bash
aws cloudformation describe-stack-events \
  --stack-name beti-ecs \
  --region eu-west-1 \
  --max-items 10
```

### Tasks Not Starting

Check ECS service events:

```bash
aws ecs describe-services \
  --cluster beti-cluster \
  --services beti-service \
  --region eu-west-1
```

### Health Checks Failing

View task logs:

```bash
make ecs-logs-recent
```

### Cannot Pull Image from ECR

Verify image exists:

```bash
aws ecr list-images \
  --repository-name beti \
  --region eu-west-1
```

Check task execution role permissions:

```bash
aws iam get-role-policy \
  --role-name beti-ecsTaskExecutionRole \
  --policy-name ECSTaskExecutionPolicy
```

## Cost Estimate

Monthly costs with current configuration (1 task, 0.25 vCPU, 0.5GB):

- **ECS Fargate:** ~$10-15
- **Application Load Balancer:** ~$16-20
- **Data Transfer:** Variable
- **CloudWatch Logs:** ~$1-2
- **Total:** ~$27-37/month

## Security Best Practices

1. **Secrets Management:** Consider using AWS Secrets Manager for sensitive values
2. **IAM Roles:** Follow principle of least privilege
3. **Security Groups:** Restrict access to only necessary ports
4. **SSL/TLS:** Always use HTTPS with valid certificates
5. **Logging:** Enable and monitor CloudWatch logs
6. **Updates:** Keep container images updated regularly

## Support

For issues or questions:

1. Check CloudWatch logs: `make ecs-logs`
2. Review stack events: `make ecs-status`
3. Verify service health: `make ecs-service-status`
4. Check AWS documentation: https://docs.aws.amazon.com/ecs/

## Additional Resources

- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
- [CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
