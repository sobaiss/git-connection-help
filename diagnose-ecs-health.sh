#!/bin/bash

# ECS Task Health Diagnostic Script
# Usage: ./diagnose-ecs-health.sh <cluster-name> <service-name>

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log_info() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step() { echo -e "${BLUE}[→]${NC} $1"; }

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <cluster-name> <service-name> [region]"
    echo ""
    echo "Example:"
    echo "  $0 my-cluster slt-web us-east-1"
    exit 1
fi

CLUSTER_NAME=$1
SERVICE_NAME=$2
AWS_REGION=${3:-us-east-1}

echo "========================================="
echo "ECS Task Health Diagnostic Tool"
echo "========================================="
echo "Cluster: $CLUSTER_NAME"
echo "Service: $SERVICE_NAME"
echo "Region: $AWS_REGION"
echo ""

# 1. Check Service Status
log_step "Checking ECS service status..."
SERVICE_STATUS=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $AWS_REGION \
    --query 'services[0]' 2>/dev/null)

if [ -z "$SERVICE_STATUS" ] || [ "$SERVICE_STATUS" == "null" ]; then
    log_error "Service not found!"
    exit 1
fi

DESIRED_COUNT=$(echo $SERVICE_STATUS | jq -r '.desiredCount')
RUNNING_COUNT=$(echo $SERVICE_STATUS | jq -r '.runningCount')
PENDING_COUNT=$(echo $SERVICE_STATUS | jq -r '.pendingCount')

echo "  Desired: $DESIRED_COUNT | Running: $RUNNING_COUNT | Pending: $PENDING_COUNT"

if [ "$RUNNING_COUNT" -eq 0 ]; then
    log_error "No running tasks!"
else
    log_info "Service has running tasks"
fi

# 2. Check Recent Events
log_step "Checking recent service events..."
echo $SERVICE_STATUS | jq -r '.events[:5][] | "\(.createdAt) - \(.message)"' | while read line; do
    if echo "$line" | grep -q "unhealthy"; then
        log_error "  $line"
    elif echo "$line" | grep -q "steady state"; then
        log_info "  $line"
    else
        echo "  $line"
    fi
done

# 3. Get Task Details
log_step "Getting task details..."
TASK_ARNS=$(aws ecs list-tasks \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_NAME \
    --region $AWS_REGION \
    --query 'taskArns' \
    --output text)

if [ -z "$TASK_ARNS" ]; then
    log_warn "No tasks found (might be starting up)"
else
    for TASK_ARN in $TASK_ARNS; do
        TASK_ID=$(basename $TASK_ARN)
        echo ""
        log_step "Task: $TASK_ID"
        
        TASK_DETAILS=$(aws ecs describe-tasks \
            --cluster $CLUSTER_NAME \
            --tasks $TASK_ARN \
            --region $AWS_REGION \
            --query 'tasks[0]')
        
        HEALTH_STATUS=$(echo $TASK_DETAILS | jq -r '.healthStatus // "UNKNOWN"')
        LAST_STATUS=$(echo $TASK_DETAILS | jq -r '.lastStatus')
        DESIRED_STATUS=$(echo $TASK_DETAILS | jq -r '.desiredStatus')
        
        echo "  Last Status: $LAST_STATUS"
        echo "  Desired Status: $DESIRED_STATUS"
        
        if [ "$HEALTH_STATUS" == "HEALTHY" ]; then
            log_info "  Health Status: $HEALTH_STATUS"
        elif [ "$HEALTH_STATUS" == "UNHEALTHY" ]; then
            log_error "  Health Status: $HEALTH_STATUS"
        else
            log_warn "  Health Status: $HEALTH_STATUS"
        fi
        
        # Get container health
        CONTAINER_HEALTH=$(echo $TASK_DETAILS | jq -r '.containers[0].healthStatus // "UNKNOWN"')
        echo "  Container Health: $CONTAINER_HEALTH"
        
        # Check for stopped reason
        STOPPED_REASON=$(echo $TASK_DETAILS | jq -r '.stoppedReason // "N/A"')
        if [ "$STOPPED_REASON" != "N/A" ] && [ "$STOPPED_REASON" != "null" ]; then
            log_error "  Stopped Reason: $STOPPED_REASON"
        fi
        
        # Get task IP
        TASK_IP=$(echo $TASK_DETAILS | jq -r '.attachments[0].details[] | select(.name=="privateIPv4Address") | .value')
        if [ ! -z "$TASK_IP" ]; then
            echo "  Private IP: $TASK_IP"
        fi
    done
fi

# 4. Check CloudWatch Logs
log_step "Checking recent CloudWatch logs..."
LOG_GROUP="/ecs/$SERVICE_NAME"

# Check if log group exists
if aws logs describe-log-groups \
    --log-group-name-prefix $LOG_GROUP \
    --region $AWS_REGION \
    --query "logGroups[?logGroupName=='$LOG_GROUP']" \
    --output text | grep -q "$LOG_GROUP"; then
    
    log_info "Log group exists: $LOG_GROUP"
    
    # Get recent logs
    echo ""
    log_step "Recent logs (last 20 lines):"
    aws logs tail $LOG_GROUP \
        --since 5m \
        --format short \
        --region $AWS_REGION \
        2>/dev/null | tail -20 || log_warn "No recent logs found"
    
    # Check for errors
    echo ""
    log_step "Searching for errors in logs..."
    ERROR_COUNT=$(aws logs filter-log-events \
        --log-group-name $LOG_GROUP \
        --filter-pattern "ERROR" \
        --start-time $(( $(date +%s) * 1000 - 300000 )) \
        --region $AWS_REGION \
        --query 'events' \
        --output text 2>/dev/null | wc -l)
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        log_error "Found $ERROR_COUNT error messages in last 5 minutes"
        aws logs filter-log-events \
            --log-group-name $LOG_GROUP \
            --filter-pattern "ERROR" \
            --start-time $(( $(date +%s) * 1000 - 300000 )) \
            --region $AWS_REGION \
            --query 'events[].message' \
            --output text 2>/dev/null | head -10
    else
        log_info "No error messages found"
    fi
else
    log_error "Log group not found: $LOG_GROUP"
    log_warn "Check your task definition logConfiguration"
fi

# 5. Check Task Definition
log_step "Checking task definition..."
TASK_DEF_ARN=$(echo $SERVICE_STATUS | jq -r '.taskDefinition')
TASK_DEF=$(aws ecs describe-task-definition \
    --task-definition $TASK_DEF_ARN \
    --region $AWS_REGION \
    --query 'taskDefinition')

MEMORY=$(echo $TASK_DEF | jq -r '.memory // "N/A"')
CPU=$(echo $TASK_DEF | jq -r '.cpu // "N/A"')

echo "  CPU: $CPU"
echo "  Memory: $MEMORY MB"

if [ "$MEMORY" != "N/A" ] && [ "$MEMORY" -lt 2048 ]; then
    log_warn "  Memory is less than 2GB - consider increasing"
fi

# Check health check config
HEALTH_CHECK=$(echo $TASK_DEF | jq -r '.containerDefinitions[0].healthCheck')
if [ "$HEALTH_CHECK" != "null" ]; then
    START_PERIOD=$(echo $HEALTH_CHECK | jq -r '.startPeriod // 0')
    INTERVAL=$(echo $HEALTH_CHECK | jq -r '.interval // 0')
    TIMEOUT=$(echo $HEALTH_CHECK | jq -r '.timeout // 0')
    
    echo ""
    log_step "Health Check Configuration:"
    echo "  Start Period: $START_PERIOD seconds"
    echo "  Interval: $INTERVAL seconds"
    echo "  Timeout: $TIMEOUT seconds"
    
    if [ "$START_PERIOD" -lt 60 ]; then
        log_warn "  Start period is less than 60s - Next.js might need more time to start"
        log_warn "  Recommend: 90 seconds or more"
    else
        log_info "  Start period looks good"
    fi
else
    log_warn "  No health check configured in container definition"
fi

# Check environment variables
log_step "Checking critical environment variables..."
REQUIRED_VARS=("NODE_ENV" "HOSTNAME" "AUTH_TRUST_HOST" "NEXTAUTH_URL" "NEXTAUTH_SECRET")
ENV_VARS=$(echo $TASK_DEF | jq -r '.containerDefinitions[0].environment[]? | "\(.name)"')
SECRETS=$(echo $TASK_DEF | jq -r '.containerDefinitions[0].secrets[]? | "\(.name)"')

ALL_VARS="$ENV_VARS $SECRETS"

for VAR in "${REQUIRED_VARS[@]}"; do
    if echo "$ALL_VARS" | grep -q "^$VAR$"; then
        log_info "  $VAR is set"
    else
        log_error "  $VAR is NOT set"
    fi
done

# 6. Summary
echo ""
echo "========================================="
echo "SUMMARY"
echo "========================================="

if [ "$RUNNING_COUNT" -eq 0 ]; then
    log_error "No running tasks - check CloudWatch logs for startup errors"
elif [ "$HEALTH_STATUS" == "UNHEALTHY" ]; then
    log_error "Task is UNHEALTHY"
    echo ""
    echo "Common fixes:"
    echo "  1. Increase health check startPeriod to 90+ seconds"
    echo "  2. Increase ECS service healthCheckGracePeriodSeconds to 120"
    echo "  3. Check CloudWatch logs for errors"
    echo "  4. Verify all environment variables are set"
    echo "  5. Ensure memory >= 2GB"
    echo ""
    echo "View logs:"
    echo "  aws logs tail $LOG_GROUP --follow --region $AWS_REGION"
elif [ "$HEALTH_STATUS" == "HEALTHY" ]; then
    log_info "Task is HEALTHY - service is working correctly!"
else
    log_warn "Task health status: $HEALTH_STATUS (might still be starting up)"
fi

echo ""
echo "For more help, see: ECS-UNHEALTHY-FIX.md"
