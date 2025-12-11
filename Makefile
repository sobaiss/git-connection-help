.PHONY: help deploy delete validate package clean deploy-guided update logs outputs \
			ecs-deploy ecs-validate ecs-deploy-all ecs-delete ecs-update docker-build docker-push \
			ecs-logs ecs-status ecs-service-status ecs-validate-master ecs-deploy-master \
			ecs-master-outputs ecs-master-status ecs-delete-master ecs-update-master

include .env.deploy

# Variables

TEMPLATE_FILE = template.yaml
PACKAGED_TEMPLATE = packaged-template.yaml

# ECS Deployment Variables
ECR_REGISTRY = $(ACCOUNT_ID).dkr.ecr.$(REGION).amazonaws.com
ECR_REPOSITORY = $(STAGE)/$(PROJECT_NAME)
IMAGE_TAG ?= latest
CF_TEMPLATES_DIR = aws/cloudformation
CF_PARAMS_FILE = $(CF_TEMPLATES_DIR)/parameters.json
CF_MASTER_TEMPLATE = $(CF_TEMPLATES_DIR)/master-template.yaml
ECS_STACK_NAME = $(PROJECT_NAME)-$(STAGE)-ecs-fargate

# Colors for output
COLOR_RESET = \033[0m
COLOR_BOLD = \033[1m
COLOR_GREEN = \033[32m
COLOR_YELLOW = \033[33m
COLOR_BLUE = \033[34m

help: ## Display this help message
	@echo "$(COLOR_BOLD)Available targets:$(COLOR_RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(COLOR_GREEN)%-20s$(COLOR_RESET) %s\n", $$1, $$2}'

validate: ## Validate CloudFormation template
	@echo "$(COLOR_BLUE)Validating CloudFormation template...$(COLOR_RESET)"
	aws cloudformation validate-template \
		--template-body file://$(TEMPLATE_FILE) \
		--region $(REGION)
	@echo "$(COLOR_GREEN)✓ Template is valid$(COLOR_RESET)"

create-bucket: ## Create S3 bucket for deployment artifacts
	@echo "$(COLOR_BLUE)Creating S3 bucket for deployment...$(COLOR_RESET)"
	@aws s3 mb s3://$(S3_BUCKET) --region $(REGION) 2>/dev/null || echo "Bucket already exists"
	@echo "$(COLOR_GREEN)✓ S3 bucket ready$(COLOR_RESET)"

package: validate ## Package the CloudFormation template
	@echo "$(COLOR_BLUE)Packaging CloudFormation template...$(COLOR_RESET)"
	aws cloudformation package \
		--template-file $(TEMPLATE_FILE) \
		--s3-bucket $(S3_BUCKET) \
		--s3-prefix $(S3_PREFIX) \
		--output-template-file $(PACKAGED_TEMPLATE) \
		--region $(REGION)
	@echo "$(COLOR_GREEN)✓ Template packaged$(COLOR_RESET)"

deploy: package ## Deploy the application to AWS Amplify
	@echo "$(COLOR_BLUE)Deploying application to AWS Amplify...$(COLOR_RESET)"
	@if [ -z "$(GITHUB_TOKEN)" ]; then \
		echo "$(COLOR_YELLOW)⚠ GITHUB_TOKEN is required. Set it with: export GITHUB_TOKEN=your_token$(COLOR_RESET)"; \
		exit 1; \
	fi
	@if [ -z "$(NEXTAUTH_URL)" ]; then \
		echo "$(COLOR_YELLOW)⚠ NEXTAUTH_URL is required. Set it with: export NEXTAUTH_URL=your_url$(COLOR_RESET)"; \
		exit 1; \
	fi
	@if [ -z "$(AUTH_SECRET)" ]; then \
		echo "$(COLOR_YELLOW)⚠ AUTH_SECRET is required. Set it with: export AUTH_SECRET=your_secret$(COLOR_RESET)"; \
		exit 1; \
	fi
	@if [ -z "$(NEXT_PUBLIC_API_URL)" ]; then \
		echo "$(COLOR_YELLOW)⚠ NEXT_PUBLIC_API_URL is required. Set it with: export NEXT_PUBLIC_API_URL=your_url$(COLOR_RESET)"; \
		exit 1; \
	fi
	@if [ -z "$(NEXT_PUBLIC_API_KEY)" ]; then \
		echo "$(COLOR_YELLOW)⚠ NEXT_PUBLIC_API_KEY is required. Set it with: export NEXT_PUBLIC_API_KEY=your_key$(COLOR_RESET)"; \
		exit 1; \
	fi
	aws cloudformation deploy \
		--template-file $(PACKAGED_TEMPLATE) \
		--stack-name $(STACK_NAME) \
		--parameter-overrides \
			GitHubRepository=$(GITHUB_REPO) \
			GitHubBranch=$(GITHUB_BRANCH) \
			GitHubToken=$(GITHUB_TOKEN) \
			NextAuthUrl=$(NEXTAUTH_URL) \
			AuthSecret=$(AUTH_SECRET) \
			NextPublicApiUrl=$(NEXT_PUBLIC_API_URL) \
			NextImagesUrl=$(NEXT_IMAGES_URL) \
			NextPublicApiKey=$(NEXT_PUBLIC_API_KEY) \
			Stage=$(STAGE) \
			ProjectName=$(PROJECT_NAME) \
			GoogleClientId=$(GOOGLE_CLIENT_ID) \
			GoogleClientSecret=$(GOOGLE_CLIENT_SECRET) \
		--capabilities CAPABILITY_IAM \
		--region $(REGION) \
		--no-fail-on-empty-changeset
	@echo "$(COLOR_GREEN)✓ Deployment complete$(COLOR_RESET)"
	@$(MAKE) outputs

deploy-guided: ## Deploy with interactive parameter input
	@echo "$(COLOR_BLUE)Starting guided deployment...$(COLOR_RESET)"
	@read -p "Enter GitHub Repository URL: " GITHUB_REPO; \
	read -p "Enter GitHub Branch [main]: " GITHUB_BRANCH; \
	GITHUB_BRANCH=$${GITHUB_BRANCH:-main}; \
	read -sp "Enter GitHub Token: " GITHUB_TOKEN; echo; \
	read -p "Enter NextAuth URL: " NEXTAUTH_URL; \
	read -sp "Enter Auth Secret: " AUTH_SECRET; echo; \
	read -p "Enter Public API URL: " NEXT_PUBLIC_API_URL; \
	read -p "Enter Public API Key: " NEXT_PUBLIC_API_KEY; \
	read -sp "Enter Stage: " STAGE; echo; \
	read -sp "Enter Project Name: " PROJECT_NAME; echo; \
	read -p "Enter Google Client ID (optional): " GOOGLE_CLIENT_ID; \
	read -sp "Enter Google Client Secret (optional): " GOOGLE_CLIENT_SECRET; echo; \
	$(MAKE) deploy \
		GITHUB_REPO=$$GITHUB_REPO \
		GITHUB_BRANCH=$$GITHUB_BRANCH \
		GITHUB_TOKEN=$$GITHUB_TOKEN \
		NEXTAUTH_URL=$$NEXTAUTH_URL \
		AUTH_SECRET=$$AUTH_SECRET \
		NEXT_PUBLIC_API_URL=$$NEXT_PUBLIC_API_URL \
		NEXT_PUBLIC_API_KEY=$$NEXT_PUBLIC_API_KEY \
		STAGE=$$STAGE \
		PROJECT_NAME=$$PROJECT_NAME \
		GOOGLE_CLIENT_ID=$$GOOGLE_CLIENT_ID \
		GOOGLE_CLIENT_SECRET=$$GOOGLE_CLIENT_SECRET

update: deploy ## Update existing deployment (alias for deploy)

delete: ## Delete the CloudFormation stack
	@echo "$(COLOR_YELLOW)⚠ This will delete the entire stack$(COLOR_RESET)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(COLOR_BLUE)Deleting stack...$(COLOR_RESET)"; \
		aws cloudformation delete-stack \
			--stack-name $(STACK_NAME) \
			--region $(REGION); \
		echo "$(COLOR_BLUE)Waiting for stack deletion...$(COLOR_RESET)"; \
		aws cloudformation wait stack-delete-complete \
			--stack-name $(STACK_NAME) \
			--region $(REGION); \
		echo "$(COLOR_GREEN)✓ Stack deleted$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_YELLOW)Deletion cancelled$(COLOR_RESET)"; \
	fi

logs: ## Show CloudFormation stack events
	@echo "$(COLOR_BLUE)Fetching stack events...$(COLOR_RESET)"
	aws cloudformation describe-stack-events \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--max-items 20 \
		--query 'StackEvents[*].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId,ResourceStatusReason]' \
		--output table

outputs: ## Display stack outputs
	@echo "$(COLOR_BLUE)Stack Outputs:$(COLOR_RESET)"
	@aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query 'Stacks[0].Outputs[*].[OutputKey,OutputValue,Description]' \
		--output table

describe: ## Describe the stack
	@echo "$(COLOR_BLUE)Stack Details:$(COLOR_RESET)"
	@aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--region $(REGION)

status: ## Show stack status
	@echo "$(COLOR_BLUE)Stack Status:$(COLOR_RESET)"
	@aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query 'Stacks[0].[StackName,StackStatus,CreationTime]' \
		--output table

amplify-status: ## Show Amplify app status
	@echo "$(COLOR_BLUE)Amplify App Status:$(COLOR_RESET)"
	@APP_ID=$$(aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query 'Stacks[0].Outputs[?OutputKey==`AppId`].OutputValue' \
		--output text); \
	aws amplify get-app --app-id $$APP_ID --region $(REGION)

amplify-jobs: ## Show recent Amplify build jobs
	@echo "$(COLOR_BLUE)Recent Amplify Jobs:$(COLOR_RESET)"
	@APP_ID=$$(aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query 'Stacks[0].Outputs[?OutputKey==`AppId`].OutputValue' \
		--output text); \
	BRANCH=$$(aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query 'Stacks[0].Outputs[?OutputKey==`BranchName`].OutputValue' \
		--output text); \
	aws amplify list-jobs --app-id $$APP_ID --branch-name $$BRANCH --region $(REGION) \
		--query 'jobSummaries[*].[jobId,status,commitMessage,startTime]' \
		--output table

trigger-build: ## Trigger a new build in Amplify
	@echo "$(COLOR_BLUE)Triggering new build...$(COLOR_RESET)"
	@APP_ID=$$(aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query 'Stacks[0].Outputs[?OutputKey==`AppId`].OutputValue' \
		--output text); \
	BRANCH=$$(aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query 'Stacks[0].Outputs[?OutputKey==`BranchName`].OutputValue' \
		--output text); \
	aws amplify start-job --app-id $$APP_ID --branch-name $$BRANCH --job-type RELEASE --region $(REGION)
	@echo "$(COLOR_GREEN)✓ Build triggered$(COLOR_RESET)"

clean: ## Clean up packaged template
	@echo "$(COLOR_BLUE)Cleaning up...$(COLOR_RESET)"
	@rm -f $(PACKAGED_TEMPLATE)
	@echo "$(COLOR_GREEN)✓ Cleanup complete$(COLOR_RESET)"

env-template: ## Generate .env template for deployment
	@echo "$(COLOR_BLUE)Creating .env.deploy template...$(COLOR_RESET)"
	@echo '# GitHub Configuration' > .env.deploy.template
	@echo 'export GITHUB_REPO="https://github.com/yourusername/yourrepo"' >> .env.deploy.template
	@echo 'export GITHUB_BRANCH="main"' >> .env.deploy.template
	@echo 'export GITHUB_TOKEN="your_github_personal_access_token"' >> .env.deploy.template
	@echo '' >> .env.deploy.template
	@echo '# NextAuth Configuration' >> .env.deploy.template
	@echo 'export NEXTAUTH_URL="https://your-app.amplifyapp.com"' >> .env.deploy.template
	@echo 'export AUTH_SECRET="your_auth_secret"' >> .env.deploy.template
	@echo '' >> .env.deploy.template
	@echo '# Supabase Configuration' >> .env.deploy.template
	@echo 'export NEXT_PUBLIC_API_URL="https://your-public-api.co"' >> .env.deploy.template
	@echo 'export NEXT_PUBLIC_API_KEY="your_public_api_key"' >> .env.deploy.template
	@echo 'export STAGE="dev"' >> .env.deploy.template
	@echo 'export PROJECT_NAME="slt-web"' >> .env.deploy.template
	@echo '' >> .env.deploy.template
	@echo '# OAuth (Optional)' >> .env.deploy.template
	@echo 'export GOOGLE_CLIENT_ID="your_google_client_id"' >> .env.deploy.template
	@echo 'export GOOGLE_CLIENT_SECRET="your_google_client_secret"' >> .env.deploy.template
	@echo '' >> .env.deploy.template
	@echo '# Deployment Configuration' >> .env.deploy.template
	@echo 'export STACK_NAME="slt-web"' >> .env.deploy.template
	@echo 'export REGION="eu-west-1"' >> .env.deploy.template
	@echo 'export S3_BUCKET="$${STACK_NAME}-deployment-bucket"' >> .env.deploy.template
	@echo "$(COLOR_GREEN)✓ Template created at .env.deploy.template$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)⚠ Copy to .env.deploy and fill in your values$(COLOR_RESET)"

# ============================================
# ECS Fargate Deployment Commands
# ============================================

ecs-validate-master: ## Validate master CloudFormation template
	@echo "$(COLOR_BLUE)Validating master CloudFormation template...$(COLOR_RESET)"
	aws cloudformation validate-template \
		--template-body file://$(CF_MASTER_TEMPLATE) \
		--region $(REGION)
	@echo "$(COLOR_GREEN)✓ Master template is valid$(COLOR_RESET)"

ecs-deploy-master: #ecs-validate-master ## Deploy complete ECS infrastructure using master template
	@echo "$(COLOR_BLUE)Deploying complete ECS infrastructure...$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)Note: Make sure to update parameters in master-template.yaml with your actual values$(COLOR_RESET)"
	@if [ -z "$(VPC_ID)" ]; then \
		echo "$(COLOR_YELLOW)⚠ VPC_ID is required. Set it with: export VPC_ID=your_vpc_id$(COLOR_RESET)"; \
		exit 1; \
	fi
	@if [ -z "$(PUBLIC_SUBNET_1)" ]; then \
		echo "$(COLOR_YELLOW)⚠ PUBLIC_SUBNET_1 is required. Set it with: export PUBLIC_SUBNET_1=your_public_subnet_1$(COLOR_RESET)"; \
		exit 1; \
	fi
	@if [ -z "$(PUBLIC_SUBNET_2)" ]; then \
		echo "$(COLOR_YELLOW)⚠ PUBLIC_SUBNET_2 is required. Set it with: export PUBLIC_SUBNET_2=your_public_subnet_2$(COLOR_RESET)"; \
		exit 1; \
	fi
	@if [ -z "$(SSL_CERTIFICATE_ARN)" ]; then \
		echo "$(COLOR_YELLOW)⚠ SSL_CERTIFICATE_ARN is required. Set it with: export SSL_CERTIFICATE_ARN=your_ssl_certificate_arn$(COLOR_RESET)"; \
		exit 1; \
	fi
	@if [ -z "$(HOSTED_ZONE_ID)" ]; then \
		echo "$(COLOR_YELLOW)⚠ HOSTED_ZONE_ID is required. Set it with: export HOSTED_ZONE_ID=your_hosted_zone_id$(COLOR_RESET)"; \
		exit 1; \
	fi
	@if [ -z "$(CUSTOM_DOMAIN_NAME)" ]; then \
		echo "$(COLOR_YELLOW)⚠ CUSTOM_DOMAIN_NAME is required. Set it with: export CUSTOM_DOMAIN_NAME=your_custom_domain_name$(COLOR_RESET)"; \
		exit 1; \
	fi
	@if [ -z "$(IMAGE_URI)" ]; then \
		echo "$(COLOR_YELLOW)⚠ IMAGE_URI is required. Set it with: export IMAGE_URI=your_image_uri$(COLOR_RESET)"; \
		exit 1; \
	fi
	@if [ -z "$(AUTH_SECRET)" ]; then \
		echo "$(COLOR_YELLOW)⚠ AUTH_SECRET is required. Set it with: export AUTH_SECRET=your_auth_secret$(COLOR_RESET)"; \
		exit 1; \
	fi
	@if [ -z "$(NEXT_IMAGES_URL)" ]; then \
		echo "$(COLOR_YELLOW)⚠ NEXT_IMAGES_URL is required. Set it with: export NEXT_IMAGES_URL=your_next_images_url$(COLOR_RESET)"; \
		exit 1; \
	fi
	@if [ -z "$(NEXT_PUBLIC_API_URL)" ]; then \
		echo "$(COLOR_YELLOW)⚠ NEXT_PUBLIC_API_URL is required. Set it with: export NEXT_PUBLIC_API_URL=your_public_api_url$(COLOR_RESET)"; \
		exit 1; \
	fi
	aws cloudformation deploy \
		--template-file $(CF_MASTER_TEMPLATE) \
		--stack-name $(ECS_STACK_NAME) \
		--capabilities CAPABILITY_NAMED_IAM \
		--region $(REGION) \
		--parameter-overrides \
			NextAuthUrl=$(NEXTAUTH_URL) \
			NextPublicApiUrl=$(NEXT_PUBLIC_API_URL) \
			NextPublicApiKey=$(NEXT_PUBLIC_API_KEY) \
			Stage=$(STAGE) \
			ProjectName=$(PROJECT_NAME) \
			InfraProjectName=$(INFRA_PROJECT_NAME) \
			GoogleClientId=$(GOOGLE_CLIENT_ID) \
			GoogleClientSecret=$(GOOGLE_CLIENT_SECRET) \
			AuthSecret=$(AUTH_SECRET) \
			NextImagesUrl=$(NEXT_IMAGES_URL) \
			VpcId=$(VPC_ID) \
			VpcCidr=$(VPC_CIDR) \
			PublicSubnet1=$(PUBLIC_SUBNET_1) \
			PublicSubnet2=$(PUBLIC_SUBNET_2) \
			CertificateArn=$(SSL_CERTIFICATE_ARN) \
			HostedZoneId=$(HOSTED_ZONE_ID) \
			DomainName=$(CUSTOM_DOMAIN_NAME) \
			ImageUri=$(IMAGE_URI) \
			EnableVpcEndpoints=$(ENABLE_VPC_ENDPOINTS) \
		--no-fail-on-empty-changeset
	@echo "$(COLOR_GREEN)✓ Complete ECS infrastructure deployed$(COLOR_RESET)"
	@$(MAKE) ecs-master-outputs

ecs-master-outputs: ## Show master stack outputs
	@echo "$(COLOR_BLUE)Master Stack Outputs:$(COLOR_RESET)"
	@aws cloudformation describe-stacks \
		--stack-name $(ECS_STACK_NAME) \
		--region $(REGION) \
		--query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
		--output table 2>/dev/null || echo "Stack not found"

ecs-master-status: ## Show master stack status
	@echo "$(COLOR_BLUE)Master Stack Status:$(COLOR_RESET)"
	@aws cloudformation describe-stacks \
		--stack-name $(ECS_STACK_NAME) \
		--region $(REGION) \
		--query 'Stacks[0].[StackName,StackStatus,CreationTime]' \
		--output table 2>/dev/null || echo "Stack not found"

ecs-delete-master: ## Delete master stack
	@echo "$(COLOR_YELLOW)⚠ Deleting master ECS stack...$(COLOR_RESET)"
	@read -p "Are you sure? This will delete all ECS resources [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		aws cloudformation delete-stack --stack-name $(ECS_STACK_NAME) --region $(REGION); \
		echo "$(COLOR_BLUE)Waiting for stack deletion...$(COLOR_RESET)"; \
		aws cloudformation wait stack-delete-complete --stack-name $(ECS_STACK_NAME) --region $(REGION); \
		echo "$(COLOR_GREEN)✓ Master stack deleted$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_YELLOW)Deletion cancelled$(COLOR_RESET)"; \
	fi

ecs-update-master: docker-push ## Build, push image and update master stack
	@echo "$(COLOR_BLUE)Updating master stack with new image...$(COLOR_RESET)"
	aws cloudformation deploy \
		--template-file $(CF_MASTER_TEMPLATE) \
		--stack-name $(ECS_STACK_NAME) \
		--capabilities CAPABILITY_NAMED_IAM \
		--region $(REGION) \
		--no-fail-on-empty-changeset
	@echo "$(COLOR_GREEN)✓ Master stack updated$(COLOR_RESET)"
	@$(MAKE) ecs-master-outputs


ecs-service-status: ## Show ECS service and task status
	@echo "$(COLOR_BLUE)ECS Service Status:$(COLOR_RESET)"
	@aws ecs describe-services \
		--cluster $(PROJECT_NAME)-cluster \
		--services $(PROJECT_NAME)-service \
		--region $(REGION) \
		--query 'services[0].[serviceName,status,runningCount,desiredCount]' \
		--output table
	@echo ""
	@echo "$(COLOR_BLUE)Running Tasks:$(COLOR_RESET)"
	@aws ecs list-tasks \
		--cluster $(PROJECT_NAME)-cluster \
		--service-name $(PROJECT_NAME)-service \
		--region $(REGION) \
		--query 'taskArns[*]' \
		--output table

docker-build: ## Build Docker image
	@echo "$(COLOR_BLUE)Building Docker image...$(COLOR_RESET)"
	docker build --platform $(PLATFORM) -t $(ECR_REPOSITORY):$(IMAGE_TAG) .
	@echo "$(COLOR_GREEN)✓ Docker image built: $(ECR_REPOSITORY):$(IMAGE_TAG)$(COLOR_RESET)"

docker-login: ## Login to ECR
	@echo "$(COLOR_BLUE)Logging into ECR...$(COLOR_RESET)"
	aws ecr get-login-password --region $(REGION) | docker login --username AWS --password-stdin $(ECR_REGISTRY)
	@echo "$(COLOR_GREEN)✓ Logged into ECR$(COLOR_RESET)"

docker-push: docker-login docker-build ## Build and push Docker image to ECR
	@echo "$(COLOR_BLUE)Tagging and pushing Docker image...$(COLOR_RESET)"
	docker tag $(ECR_REPOSITORY):$(IMAGE_TAG) $(ECR_REGISTRY)/$(ECR_REPOSITORY):$(IMAGE_TAG)
	docker tag $(ECR_REPOSITORY):$(IMAGE_TAG) $(ECR_REGISTRY)/$(ECR_REPOSITORY):latest
	docker push $(ECR_REGISTRY)/$(ECR_REPOSITORY):$(IMAGE_TAG)
	docker push $(ECR_REGISTRY)/$(ECR_REPOSITORY):latest
	@echo "$(COLOR_GREEN)✓ Docker image pushed to ECR$(COLOR_RESET)"
	@echo "$(COLOR_BLUE)Image URI: $(ECR_REGISTRY)/$(ECR_REPOSITORY):$(IMAGE_TAG)$(COLOR_RESET)"

ecs-update: docker-push ## Build, push image and update ECS service
	@echo "$(COLOR_BLUE)Updating ECS service...$(COLOR_RESET)"
	aws ecs update-service \
		--cluster $(PROJECT_NAME)-cluster \
		--service $(PROJECT_NAME)-service \
		--force-new-deployment \
		--region $(REGION)
	@echo "$(COLOR_GREEN)✓ ECS service update initiated$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)Monitor deployment with: make ecs-service-status$(COLOR_RESET)"

ecs-full-deploy: docker-push ecs-deploy-ecs ## Complete deployment: build, push, and deploy ECS
	@echo "$(COLOR_GREEN)✓ Full deployment complete$(COLOR_RESET)"
	@$(MAKE) ecs-outputs

start-local:
	@echo "$(COLOR_BLUE)Starting application locally...$(COLOR_RESET)"
	docker run -p 3002:3000 \
		-e NEXTAUTH_URL=$(NEXTAUTH_URL) \
		-e NEXT_PUBLIC_API_URL=$(NEXT_PUBLIC_API_URL) \
		-e AUTH_SECRET=$(AUTH_SECRET) \
		-e NEXT_IMAGES_URL=$(NEXT_IMAGES_URL) \
		-e NEXT_PUBLIC_API_KEY=$(NEXT_PUBLIC_API_KEY) \
		$(ECR_REPOSITORY):$(IMAGE_TAG)
	@echo "$(COLOR_GREEN)✓ Application running at http://localhost:3000$(COLOR_RESET)"
# ============================================
# End of ECS Fargate Commands
# ============================================

.DEFAULT_GOAL := help
