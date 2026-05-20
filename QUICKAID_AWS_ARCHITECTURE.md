# QuickAid AWS Architecture

## Emergency Triage Command Platform - Singapore Government

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Network Architecture](#network-architecture)
4. [Compute Architecture (EC2)](#compute-architecture-ec2)
5. [Database Architecture](#database-architecture)
6. [Caching Architecture](#caching-architecture)
7. [SMS Broadcasting Architecture](#sms-broadcasting-architecture)
8. [Frontend Hosting Architecture](#frontend-hosting-architecture)
9. [Security Architecture](#security-architecture)
10. [Monitoring & Observability](#monitoring--observability)
11. [Step-by-Step Process Flows](#step-by-step-process-flows)
12. [CI/CD Pipeline](#cicd-pipeline)
13. [Infrastructure as Code](#infrastructure-as-code)
14. [Cost Estimation](#cost-estimation)
15. [Disaster Recovery](#disaster-recovery)
16. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

QuickAid is an emergency triage command platform for Singapore government services. This AWS-native architecture provides:

- **Unified Platform**: Single AWS account for all services
- **SMS Broadcasting**: Native SNS integration for emergency alerts
- **High Availability**: Multi-AZ deployment with EC2 Auto Scaling
- **Real-time Updates**: Server-Sent Events (SSE) for live incident tracking
- **AI Integration**: Google Gemini API for incident triage
- **Enterprise Security**: WAF, Shield, encryption, IAM
- **Auto-Scaling**: EC2 Auto Scaling Group based on demand
- **Full Control**: SSH access to instances for critical troubleshooting
- **Cost-Effective**: Reserved instances for steady 24/7 workload

---

## Architecture Overview

```mermaid
graph TB
    subgraph "User Access"
        Citizen[Citizens]
        Responders[Responders<br/>SCDF, MOH, SPF]
        Supervisors[Supervisors<br/>Station Commanders]
        GovAdmins[Gov Admins<br/>Crisis Center]
    end

    subgraph "Edge Layer - Global"
        Route53[Route 53 DNS<br/>quickaid.gov.sg]
        CloudFront[CloudFront CDN<br/>Singapore: 4 PoCs]
        WAF[AWS WAF<br/>Security Filtering]
        ACM[ACM Certificates<br/>TLS/SSL]
    end

    subgraph "VPC: 10.0.0.0/16"
        subgraph "Public Subnets"
            ALB[Application Load Balancer<br/>quickaid-alb]
            Bastion[Bastion Host<br/>SSH Access<br/>t3.micro]
            NAT1[NAT Gateway 1A]
            NAT2[NAT Gateway 2B]
        end

        subgraph "Private Subnets - Application"
            subgraph "EC2 Auto Scaling Group"
                EC2A1[EC2 Instance 1A<br/>t3.large<br/>Docker Compose<br/>Backend + SSE + Worker]
                EC2A2[EC2 Instance 2B<br/>t3.large<br/>Docker Compose<br/>Backend + SSE + Worker]
                EC2A3[EC2 Instance 1A<br/>t3.large<br/>Docker Compose<br/>Backend + SSE + Worker]
                EC2B1[EC2 Instance 2B<br/>t3.large<br/>Docker Compose<br/>Backend + SSE + Worker]
            end

            subgraph "Auto Scaling"
                ASG[Auto Scaling Group<br/>Min: 4, Max: 8]
                ScaleOut[Scale Out<br/>CPU > 70% for 3min]
                ScaleIn[Scale In<br/>CPU < 30% for 10min]
            end
        end

        subgraph "Private Subnets - Database"
            RDSPrimary[RDS PostgreSQL<br/>Primary Instance<br/>db.r6g.large<br/>Multi-AZ]
            RDSStandby[RDS Standby<br/>Cross-AZ Replica]
        end

        subgraph "Private Subnets - Cache"
            RedisPrimary[ElastiCache Redis<br/>Primary Node<br/>cache.r6g.large]
            RedisReplica1[Redis Replica 1A]
            RedisReplica2[Redis Replica 2B]
        end
    end

    subgraph "Storage Layer"
        S3Frontend[S3: quickaid-frontend<br/>React Build Output]
        S3Uploads[S3: quickaid-uploads<br/>User Uploads]
        S3Logs[S3: quickaid-logs<br/>Access Logs]
    end

    subgraph "Messaging Layer"
        SNSTopic[SNS Topic: quickaid-broadcasts.fifo<br/>SMS Broadcasting]
        SNSTopic2[SNS Topic: quickaid-alerts<br/>Incident Alerts]
        SQSQueue[SQS Queue: sms-jobs<br/>Reliable SMS Processing]
        DLQ[Dead Letter Queue]
    end

    subgraph "External Services"
        Gemini[Google Gemini AI<br/>Triage Analysis]
        OSM[OpenStreetMap<br/>Map Tiles]
    end

    subgraph "Monitoring & Security"
        CloudWatch[CloudWatch<br/>Logs & Metrics]
        SystemsManager[Systems Manager<br/>EC2 Management]
        SecretsMgr[Secrets Manager<br/>DB & API Keys]
        KMS[AWS KMS<br/>Encryption Keys]
        CloudTrail[CloudTrail<br/>Audit Trail]
    end

    Citizen --> Route53
    Responders --> Route53
    Supervisors --> Route53
    GovAdmins --> Route53

    Route53 --> ACM
    ACM --> CloudFront
    CloudFront --> WAF
    WAF --> ALB

    ALB --> EC2A1
    ALB --> EC2A2
    ALB --> EC2A3
    ALB --> EC2B1

    EC2A1 --> RDSPrimary
    EC2A2 --> RDSPrimary
    EC2A3 --> RDSPrimary
    EC2B1 --> RDSPrimary

    EC2A1 --> RedisPrimary
    EC2A2 --> RedisPrimary
    EC2A3 --> RedisPrimary
    EC2B1 --> RedisPrimary

    EC2A1 --> SQSQueue
    EC2A1 --> SNSTopic

    RDSPrimary -.->|Sync Replication| RDSStandby
    RedisPrimary -.->|Async Replication| RedisReplica1
    RedisPrimary -.->|Async Replication| RedisReplica2

    CloudFront --> S3Frontend
    EC2A1 --> S3Uploads

    SNSTopic -->|SMS Delivery| Citizen
    SNSTopic -->|SMS Delivery| Responders
    SNSTopic -->|SMS Delivery| Supervisors

    EC2A1 --> CloudWatch
    EC2A2 --> CloudWatch
    EC2A3 --> CloudWatch
    EC2B1 --> CloudWatch
    ALB --> CloudWatch

    EC2A1 --> SystemsManager
    EC2A1 --> SecretsMgr
    EC2A1 --> KMS
    ALB --> CloudTrail

    SQSQueue -.->|Failed Messages| DLQ
    ASG --> EC2A1
    ASG --> EC2A2
    ASG --> EC2A3
    ASG --> EC2B1
    ScaleOut --> ASG
    ScaleIn --> ASG

    Bastion --> NAT1
    EC2A1 --> NAT1
    EC2A2 --> NAT2

    style CloudFront fill:#FF9900,color:#000
    style EC2A1 fill:#FF9900,color:#000
    style EC2A2 fill:#FF9900,color:#000
    style EC2A3 fill:#FF9900,color:#000
    style EC2B1 fill:#FF9900,color:#000
    style RDSPrimary fill:#FF9900,color:#000
    style SNSTopic fill:#FF9900,color:#000
    style S3Frontend fill:#FF9900,color:#000
    style RedisPrimary fill:#FF9900,color:#000
    style SystemsManager fill:#FF9900,color:#000
    style ASG fill:#FF9900,color:#000
```

---

## Network Architecture

### VPC Configuration

```mermaid
graph TB
    subgraph "AWS VPC: 10.0.0.0/16<br/>Singapore Region (ap-southeast-1)"
        subgraph "Public Subnets - 2 AZs"
            PubSub1[Public Subnet 1A<br/>10.0.1.0/24<br/>AZ: ap-southeast-1a<br/>ALB, NAT Gateway, Bastion]
            PubSub2[Public Subnet 2B<br/>10.0.2.0/24<br/>AZ: ap-southeast-1b<br/>ALB, NAT Gateway]

            IGW[Internet Gateway<br/>igw-xxxxx]
            NAT1[NAT Gateway 1A<br/>nat-xxxxx]
            NAT2[NAT Gateway 2B<br/>nat-yyyyy]
        end

        subgraph "Private Subnets - Application - 2 AZs"
            PriSub1[Private Subnet 1A<br/>10.0.11.0/24<br/>AZ: ap-southeast-1a<br/>EC2 Instances]
            PriSub2[Private Subnet 2B<br/>10.0.12.0/24<br/>AZ: ap-southeast-1b<br/>EC2 Instances]
        end

        subgraph "Database Subnets - Isolated - 2 AZs"
            DBSub1[DB Subnet 1A<br/>10.0.21.0/24<br/>AZ: ap-southeast-1a<br/>RDS Primary]
            DBSub2[DB Subnet 2B<br/>10.0.22.0/24<br/>AZ: ap-southeast-1b<br/>RDS Standby]
        end

        subgraph "Cache Subnets - Private - 2 AZs"
            CacheSub1[Cache Subnet 1A<br/>10.0.31.0/24<br/>AZ: ap-southeast-1a<br/>Redis Primary]
            CacheSub2[Cache Subnet 2B<br/>10.0.32.0/24<br/>AZ: ap-southeast-1b<br/>Redis Replica]
        end
    end

    PubSub1 --> IGW
    PubSub2 --> IGW
    PriSub1 --> NAT1
    PriSub2 --> NAT2
    DBSub1 -.->|No Direct Internet| DBSub2
    CacheSub1 --> NAT1
    CacheSub2 --> NAT2

    style IGW fill:#22c55e,color:#000
    style NAT1 fill:#eab308,color:#000
    style NAT2 fill:#eab308,color:#000
```

### Network Details

| Component | CIDR | AZ | Purpose |
|-----------|------|-----|---------|
| **VPC** | 10.0.0.0/16 | - | Network isolation boundary |
| Public Subnet 1A | 10.0.1.0/24 | ap-southeast-1a | ALB, NAT Gateway, Bastion |
| Public Subnet 2B | 10.0.2.0/24 | ap-southeast-1b | ALB, NAT Gateway |
| Private Subnet 1A | 10.0.11.0/24 | ap-southeast-1a | EC2 Instances (2 × t3.large) |
| Private Subnet 2B | 10.0.12.0/24 | ap-southeast-1b | EC2 Instances (2 × t3.large) |
| DB Subnet 1A | 10.0.21.0/24 | ap-southeast-1a | RDS PostgreSQL Primary |
| DB Subnet 2B | 10.0.22.0/24 | ap-southeast-1b | RDS PostgreSQL Standby |
| Cache Subnet 1A | 10.0.31.0/24 | ap-southeast-1a | ElastiCache Redis Primary |
| Cache Subnet 2B | 10.0.32.0/24 | ap-southeast-1b | ElastiCache Redis Replica |

### Security Groups

```mermaid
graph TB
    subgraph "Security Group Hierarchy"
        subgraph "ALB Security Group"
            ALBSG[ALB-SG<br/>Inbound: HTTP(80), HTTPS(443)<br/>From: 0.0.0.0/0<br/>Outbound: All]
        end

        subgraph "EC2 Security Group"
            EC2SG[EC2-QuickAid-SG<br/>Inbound: TCP(3000, 3001)<br/>From: ALB-SG<br/>Outbound: All]
        end

        subgraph "RDS Security Group"
            RDSSG[RDS-SG<br/>Inbound: TCP(5432)<br/>From: EC2-QuickAid-SG<br/>Outbound: None]
        end

        subgraph "Redis Security Group"
            RedisSG[Redis-SG<br/>Inbound: TCP(6379)<br/>From: EC2-QuickAid-SG<br/>Outbound: None]
        end

        subgraph "Bastion Security Group"
            BastionSG[Bastion-SG<br/>Inbound: SSH(22)<br/>From: Office IP CIDR<br/>Outbound: All]
        end
    end

    ALBSG --> EC2SG
    EC2SG --> RDSSG
    EC2SG --> RedisSG
    BastionSG --> EC2SG

    style ALBSG fill:#ef4444,color:#fff
    style EC2SG fill:#22c55e,color:#fff
    style RDSSG fill:#3b82f6,color:#fff
    style RedisSG fill:#eab308,color:#000
```

---

## Compute Architecture (EC2)

### EC2 Auto Scaling Group Configuration

```mermaid
graph TB
    subgraph "EC2 Auto Scaling Group: quickaid-asg"
        subgraph "Configuration"
            ASGConfig[ASG: quickaid-asg<br/>Min: 4 instances<br/>Max: 8 instances<br/>Desired: 4 instances]
            LaunchTemplate[Launch Template: quickaid-lt<br/>Image: Ubuntu 22.04 LTS<br/>Instance Type: t3.large<br/>EBS: 50 GB gp3]
            KeyPair[Key Pair: quickaid-key-pair<br/>SSH access for troubleshooting]
            IAMProfile[IAM Profile: EC2-QuickAid-Role<br/>Permissions: RDS, S3, SNS, SQS, CloudWatch]
        end

        subgraph "EC2 Instances - Running Services"
            subgraph "Instance 1 (10.0.11.10)"
                DockerCompose[Docker Compose<br/>Managing 3 containers]
                BackendContainer[Backend Service<br/>Image: quickaid-backend<br/>Port: 3000<br/>Health: /health]
                SSEContainer[SSE Service<br/>Image: quickaid-backend<br/>Port: 3001<br/>Health: /sse/health]
                WorkerContainer[Worker Service<br/>Image: quickaid-backend<br/>No Port<br/>Always Running]
            end

            subgraph "Instance 2 (10.0.11.11)"
                DockerCompose2[Docker Compose<br/>Managing 3 containers]
                BackendContainer2[Backend Service<br/>Image: quickaid-backend<br/>Port: 3000<br/>Health: /health]
                SSEContainer2[SSE Service<br/>Image: quickaid-backend<br/>Port: 3001<br/>Health: /sse/health]
                WorkerContainer2[Worker Service<br/>Image: quickaid-backend<br/>No Port<br/>Always Running]
            end

            subgraph "Instance 3 (10.0.12.10)"
                DockerCompose3[Docker Compose<br/>Managing 3 containers]
                BackendContainer3[Backend Service<br/>Image: quickaid-backend<br/>Port: 3000<br/>Health: /health]
                SSEContainer3[SSE Service<br/>Image: quickaid-backend<br/>Port: 3001<br/>Health: /sse/health]
                WorkerContainer3[Worker Service<br/>Image: quickaid-backend<br/>No Port<br/>Always Running]
            end

            subgraph "Instance 4 (10.0.12.11)"
                DockerCompose4[Docker Compose<br/>Managing 3 containers]
                BackendContainer4[Backend Service<br/>Image: quickaid-backend<br/>Port: 3000<br/>Health: /health]
                SSEContainer4[SSE Service<br/>Image: quickaid-backend<br/>Port: 3001<br/>Health: /sse/health]
                WorkerContainer4[Worker Service<br/>Image: quickaid-backend<br/>No Port<br/>Always Running]
            end
        end

        subgraph "Auto Scaling Policies"
            ScaleOutPolicy[Scale Out Policy<br/>Metric: CPU > 70%<br/>Duration: 3 min<br/>Action: +1 instance<br/>Cooldown: 5 min]
            ScaleInPolicy[Scale In Policy<br/>Metric: CPU < 30%<br/>Duration: 10 min<br/>Action: -1 instance<br/>Cooldown: 15 min]
            SSEPolicy[SSE Connections Policy<br/>Metric: Connections > 2000<br/>Action: +1 instance<br/>Cooldown: 10 min]
        end

        subgraph "Lifecycle Hooks"
            LaunchHook[Launch Hook<br/>Wait for Docker containers healthy<br/>Timeout: 5 min]
            TerminateHook[Terminate Hook<br/>Graceful drain SSE connections<br/>Timeout: 3 min<br/>SIGTERM signal]
        end
    end

    ASGConfig --> LaunchTemplate
    LaunchTemplate --> KeyPair
    LaunchTemplate --> IAMProfile

    Instance1 --> DockerCompose
    Instance2 --> DockerCompose2
    Instance3 --> DockerCompose3
    Instance4 --> DockerCompose4

    DockerCompose --> BackendContainer
    DockerCompose --> SSEContainer
    DockerCompose --> WorkerContainer

    ScaleOutPolicy --> ASGConfig
    ScaleInPolicy --> ASGConfig
    SSEPolicy --> ASGConfig

    LaunchHook --> ASGConfig
    TerminateHook --> ASGConfig

    style ASGConfig fill:#FF9900,color:#000
    style LaunchTemplate fill:#FF9900,color:#000
    style Instance1 fill:#FF9900,color:#000
    style Instance2 fill:#FF9900,color:#000
    style Instance3 fill:#FF9900,color:#000
    style Instance4 fill:#FF9900,color:#000
    style ScaleOutPolicy fill:#22c55e,color:#000
    style ScaleInPolicy fill:#eab308,color:#000
```

### EC2 Instance Specification

| Setting | Value | Notes |
|---------|-------|-------|
| **Instance Type** | t3.large | 2 vCPU, 8 GB RAM |
| **AMI** | Ubuntu 22.04 LTS | Or Amazon Linux 2023 |
| **EBS Storage** | 50 GB gp3 | 3,000 IOPS, 125 MB/s |
| **SSH Key Pair** | quickaid-key | For emergency access |
| **IAM Profile** | EC2-QuickAid-Role | Minimal permissions |
| **Security Group** | EC2-QuickAid-SG | Ports 3000, 3001 |
| **User Data** | Docker install script | Auto-configure on boot |

### Docker Compose Configuration

**File: `/opt/quickaid/docker-compose.yml`**

```yaml
version: '3.8'

services:
  backend:
    image: 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/quickaid-backend:latest
    container_name: quickaid-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
      - EC2_INSTANCE_ID=${EC2_INSTANCE_ID}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 60s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - quickaid-network

  sse:
    image: 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/quickaid-backend:latest
    container_name: quickaid-sse
    restart: unless-stopped
    command: ["node", "dist/sse.js"]
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - EC2_INSTANCE_ID=${EC2_INSTANCE_ID}
      - AWS_REGION=${AWS_REGION}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/sse/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 60s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - quickaid-network

  worker:
    image: 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/quickaid-backend:latest
    container_name: quickaid-worker
    restart: unless-stopped
    command: ["node", "dist/worker.js"]
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SQS_QUEUE_URL=${SQS_QUEUE_URL}
      - SNS_TOPIC_ARN=${SNS_TOPIC_ARN}
      - AWS_REGION=${AWS_REGION}
      - EC2_INSTANCE_ID=${EC2_INSTANCE_ID}
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - quickaid-network

networks:
  quickaid-network:
    driver: bridge
```

### User Data Script (EC2 Bootstrap)

**File: `user-data.sh`**

```bash
#!/bin/bash
# User data script for QuickAid EC2 instances

# Log to console and file
exec > >(tee /var/log/user-data.log) 2>&1
echo "Starting QuickAid EC2 bootstrap at $(date)"

# Get EC2 instance metadata
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
REGION=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | jq -r .region)
echo "Instance ID: $INSTANCE_ID"
echo "Region: $REGION"

# Update packages
apt-get update -y
apt-get upgrade -y

# Install Docker
apt-get install -y docker.io docker-compose
systemctl start docker
systemctl enable docker

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m)" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Install Node.js (for monitoring scripts)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Create application directory
mkdir -p /opt/quickaid
cd /opt/quickaid

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin 123456789012.dkr.ecr.$REGION.amazonaws.com

# Create environment file from SSM Parameter Store
aws ssm get-parameter --name "/quickaid/production/env" --with-decryption --query Parameter.Value --output text > .env

# Add instance ID to environment
echo "EC2_INSTANCE_ID=$INSTANCE_ID" >> .env
echo "AWS_REGION=$REGION" >> .env

# Pull Docker images
docker pull 123456789012.dkr.ecr.$REGION.amazonaws.com/quickaid-backend:latest

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/quickaid-backend:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 60s

  sse:
    image: 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/quickaid-backend:latest
    restart: unless-stopped
    command: ["node", "dist/sse.js"]
    ports:
      - "3001:3001"
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/sse/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 60s

  worker:
    image: 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/quickaid-backend:latest
    restart: unless-stopped
    command: ["node", "dist/worker.js"]
    env_file:
      - .env
EOF

# Start services
docker-compose up -d

# Install CloudWatch agent
apt-get install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/syslog",
            "log_group_name": "/quickaid/ec2/syslog",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "/quickaid/ec2/user-data",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "QuickAid/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait"],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["disk_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Install SSH key for debugging (from Secrets Manager)
SSH_KEY=$(aws secretsmanager get-secret-value --secret-id quickaid-ssh-key --query SecretString --output text)
mkdir -p /home/ubuntu/.ssh
echo "$SSH_KEY" > /home/ubuntu/.ssh/authorized_keys
chmod 600 /home/ubuntu/.ssh/authorized_keys

# Set up graceful shutdown handler
cat > /opt/quickaid/graceful-shutdown.sh << 'EOF'
#!/bin/bash
# Graceful shutdown script
echo "Starting graceful shutdown at $(date)"

# Notify active SSE connections
curl -X POST http://localhost:3001/sse/notify-shutdown || true

# Wait for SSE connections to drain (max 2 minutes)
sleep 120

# Stop Docker containers
cd /opt/quickaid
docker-compose down

echo "Graceful shutdown completed"
EOF

chmod +x /opt/quickaid/graceful-shutdown.sh

# Add shutdown hook
cat > /etc/systemd/system/graceful-shutdown.service << EOF
[Unit]
Description=Graceful Shutdown Hook
Before=shutdown.target reboot.target

[Service]
Type=oneshot
ExecStart=/opt/quickaid/graceful-shutdown.sh

[Install]
WantedBy=multi-user.target
EOF

systemctl enable graceful-shutdown.service

# Send instance ready signal
aws autoscaling complete-lifecycle-action \
  --lifecycle-hook-name quickaid-launch-hook \
  --auto-scaling-group-name quickaid-asg \
  --lifecycle-action-result CONTINUE \
  --instance-id $INSTANCE_ID \
  --region $REGION

echo "QuickAid EC2 bootstrap completed at $(date)"
```

### ALB Target Groups

| Target Group | Port | Health Check | Protocol | Stickiness |
|--------------|------|--------------|----------|------------|
| **quickaid-backend-tg** | 3000 | GET /health | HTTP | No |
| **quickaid-sse-tg** | 3001 | GET /sse/health | HTTP | Yes, 3600s |

---

## Database Architecture

### RDS PostgreSQL Configuration

```mermaid
graph TB
    subgraph "RDS PostgreSQL: quickaid-db"
        subgraph "Primary Instance"
            Primary[Primary Writer Instance<br/>db.r6g.large<br/>vCPU: 2 ARM<br/>Memory: 16 GiB<br/>Storage: 100 GB gp3<br/>IOPS: 3000<br/>Throughput: 125 MB/s<br/>Engine: PostgreSQL 16.1<br/>Multi-AZ: Yes]
            Endpoint[Writer Endpoint<br/>quickaid-db.XXXXX.ap-southeast-1.rds.amazonaws.com:5432]
            Backup[Automated Backups<br/>Retention: 7 days<br/>Window: 03:00-04:00 UTC]
        end

        subgraph "Standby Instance"
            Standby[Standby Read Replica<br/>db.r6g.large<br/>Same spec as Primary<br/>In: ap-southeast-1b]
            ReaderEndpoint[Reader Endpoint<br/>quickaid-db-ro.XXXXX.ap-southeast-1.rds.amazonaws.com:5432]
        end

        subgraph "Parameter Group"
            PGConfig[Parameter Group: quickaid-pg-config<br/>max_connections: 200<br/>shared_buffers: 4GB<br/>effective_cache_size: 12GB<br/>maintenance_work_mem: 1GB<br/>checkpoint_completion_target: 0.9<br/>wal_buffers: 16MB<br/>default_statistics_target: 100]
        end

        subgraph "Extensions"
            UUID[uuid-ossp<br/>UUID generation]
            Trgm[pg_trgm<br/>Full-text search]
            TSVector[tsvector<br/>Text search]
        end
    end

    Primary -.->|Synchronous Replication| Standby
    Primary --> Endpoint
    Standby --> ReaderEndpoint
    Primary --> Backup
    Primary --> PGConfig

    PGConfig --> UUID
    PGConfig --> Trgm
    PGConfig --> TSVector

    style Primary fill:#FF9900,color:#000
    style Standby fill:#FF9900,color:#000
    style Backup fill:#22c55e,color:#000
```

### Database Schema

```mermaid
erDiagram
    users ||--o{ incidents : reports
    users ||--o{ volunteers : registers_as
    users ||--o{ incident_updates : creates
    users ||--o{ broadcasts : sends
    users ||--o{ hospitals : updates

    incidents ||--o{ incident_updates : has_timeline
    incidents ||--o{ broadcasts : references

    users {
        uuid id PK
        text email UK
        text password_hash
        text full_name
        text role CK
        text unit
        text phone
        boolean is_active
        timestamptz last_login_at
        timestamptz created_at
        timestamptz updated_at
    }

    incidents {
        uuid id PK
        text ticket_number UK
        text type CK
        text title
        text description
        text location_text
        decimal location_lat
        decimal location_lng
        int severity CK
        text status CK
        uuid reported_by FK
        uuid assigned_to FK
        jsonb ai_triage_data
        int approved_option
        uuid approved_by FK
        timestamptz approved_at
        timestamptz resolved_at
        timestamptz created_at
        timestamptz updated_at
    }

    incident_updates {
        uuid id PK
        uuid incident_id FK
        uuid author_id FK
        text update_type CK
        text content
        jsonb metadata
        timestamptz created_at
    }

    hospitals {
        uuid id PK
        text name
        text short_name
        text address
        decimal lat
        decimal lng
        int total_beds
        int available_beds
        int icu_available
        int trauma_bays
        timestamptz last_updated_at
        timestamptz created_at
    }

    volunteers {
        uuid id PK
        uuid user_id FK
        text full_name
        text phone
        text_array skills
        text postal_district
        boolean is_available
        timestamptz last_active_at
        timestamptz created_at
        timestamptz updated_at
    }

    broadcasts {
        uuid id PK
        text title
        text message
        text audience CK
        text zone
        uuid sent_by FK
        uuid incident_id FK
        timestamptz created_at
    }

    sms_logs {
        uuid id PK
        text phone_number
        text message
        text status CK
        text broadcast_id FK
        jsonb metadata
        timestamptz sent_at
        timestamptz delivered_at
        text error_message
    }
```

---

## Caching Architecture

### ElastiCache Redis Configuration

```mermaid
graph TB
    subgraph "ElastiCache Redis: quickaid-redis"
        subgraph "Cluster Configuration"
            Cluster[Redis Cluster Mode Disabled<br/>Replication Group<br/>Engine: Redis 7.1<br/>Port: 6379]
        end

        subgraph "Primary Node"
            Primary[Primary Node<br/>cache.r6g.large<br/>vCPU: 2 ARM<br/>Memory: 12.77 GiB<br/>In: ap-southeast-1a<br/>Multi-AZ: Yes]
            PrimaryEndpoint[Primary Endpoint<br/>quickaid-redis.XXXXX.ng.0001.apse1.cache.amazonaws.com]
        end

        subgraph "Replica Nodes"
            Replica1[Replica Node 1<br/>cache.r6g.large<br/>In: ap-southeast-1a<br/>Read Replicas]
            Replica2[Replica Node 2<br/>cache.r6g.large<br/>In: ap-southeast-1b<br/>Read Replicas]
            ReaderEndpoint[Reader Endpoint<br/>quickaid-redis-ro.XXXXX.ng.0001.apse1.cache.amazonaws.com]
        end

        subgraph "Redis Data Types"
            Sessions[sessions:hash<br/>Key: session:{userId}<br/>TTL: 7 days<br/>Data: JWT tokens, user info]
            SSEConnections[sse_connections:set<br/>Key: sse:{connectionId}<br/>TTL: 5 min<br/>Data: Active SSE connections]
            APIResponse[api_response:string<br/>Key: api:{endpoint}:hash<br/>TTL: 5 min<br/>Data: Hospital data, volunteers]
            RateLimit[rate_limit:string<br/>Key: rate:{userId}:{endpoint}<br/>TTL: 60 s<br/>Data: Request counters]
            BroadcastCache[broadcasts:sorted_set<br/>Key: broadcasts<br/>TTL: 1 hour<br/>Data: Active broadcasts]
            InstanceConnections[instance:{instanceId}:set<br/>TTL: 5 min<br/>Data: Active connections per EC2]
        end

        subgraph "Eviction Policy"
            Policy[Eviction: allkeys-lru<br/>Max Memory: 12 GB<br/>Reserved: 10%]
        end
    end

    Cluster --> Primary
    Cluster --> Replica1
    Cluster --> Replica2
    Primary -.->|Async Replication| Replica1
    Primary -.->|Async Replication| Replica2

    Primary --> PrimaryEndpoint
    Replica1 --> ReaderEndpoint
    Replica2 --> ReaderEndpoint

    Primary --> Sessions
    Primary --> SSEConnections
    Primary --> APIResponse
    Primary --> RateLimit
    Primary --> BroadcastCache
    Primary --> InstanceConnections
    Primary --> Policy

    style Primary fill:#FF9900,color:#000
    style Replica1 fill:#FF9900,color:#000
    style Replica2 fill:#FF9900,color:#000
```

### Redis Data Patterns

| Pattern | Key Format | TTL | Purpose |
|---------|-----------|-----|---------|
| **User Sessions** | `session:{userId}` | 7 days | JWT refresh tokens, user context |
| **SSE Connections** | `sse:{connectionId}` | 5 min | Track active SSE connections |
| **Instance Tracking** | `instance:{instanceId}` | 5 min | Track connections per EC2 |
| **API Response** | `api:{endpoint}:{hash}` | 5 min | Cache GET requests |
| **Rate Limiting** | `rate:{userId}:{endpoint}` | 60 s | Sliding window rate limiting |
| **Broadcasts** | `broadcasts` | 1 hour | Recent broadcasts list |
| **Incident Cache** | `incident:{id}` | 30 min | Hot incident data |
| **Hospital Cache** | `hospitals` | 5 min | Hospital bed availability |
| **Volunteer Cache** | `volunteers:{skill}` | 10 min | Available volunteers |

---

## SMS Broadcasting Architecture

### Amazon SNS + SQS Integration

```mermaid
graph TB
    subgraph "SMS Broadcasting System"
        subgraph "User Interface"
            GovAdminUI[Gov Admin Portal<br/>Create Broadcast]
        end

        subgraph "Backend API"
            BroadcastAPI[POST /api/broadcasts<br/>EC2 Backend Service]
        end

        subgraph "Message Queue"
            SQSMain[SQS Queue: quickaid-sms-jobs<br/>FIFO Queue<br/>Message Retention: 4 days<br/>Visibility Timeout: 300 s]
            SQSDLQ[Dead Letter Queue<br/>quickaid-sms-dlq<br/>Max Receive Count: 5]
        end

        subgraph "Worker Service"
            SMSWorker[Worker Service<br/>Docker Container on EC2<br/>Polls SQS every 20 s<br/>Batch size: 10 messages]
        end

        subgraph "Database"
            BroadcastsDB[broadcasts table<br/>Store broadcast record]
            UsersDB[users table<br/>Query recipients]
            SMSLogsDB[sms_logs table<br/>Track delivery]
        end

        subgraph "SNS Topics"
            SNSTopicBroadcast[SNS Topic: quickaid-broadcasts.fifo<br/>FIFO for ordering<br/>Content-based deduplication]
            SNSTopicAlerts[SNS Topic: quickaid-alerts<br/>Standard topic<br/>Incident alerts]
        end

        subgraph "SMS Delivery"
            SNSRegion[ap-southeast-1<br/>Singapore Region]
            SenderID[Sender ID: QUICKAID]
            OptOut[Opt-out: STOP keyword]
            RateLimit[Rate Limit: 5 SMS/s<br/>Per account]
        end

        subgraph "Recipients"
            Citizens[Citizens<br/>Mobile phones]
            Responders[Responders<br/>SCDF, MOH, SPF]
            Supervisors[Supervisors<br/>Station commanders]
        end

        subgraph "Monitoring"
            CWLogs[CloudWatch Logs<br/>SMS delivery logs]
            CWMetrics[CloudWatch Metrics<br/>Delivery rate, bounces]
            CWAlarms[CloudWatch Alarms<br/>Bounce rate > 10%]
        end
    end

    GovAdminUI --> BroadcastAPI
    BroadcastAPI --> BroadcastsDB
    BroadcastAPI --> SQSMain
    BroadcastAPI -->|SSE| GovAdminUI

    SQSMain -.->|Failed| SQSDLQ
    SQSMain --> SMSWorker

    SMSWorker --> UsersDB
    SMSWorker --> SMSLogsDB
    SMSWorker --> SNSTopicBroadcast
    SMSWorker --> SNSTopicAlerts
    SMSWorker --> CWLogs

    SNSTopicBroadcast --> SNSRegion
    SNSTopicAlerts --> SNSRegion

    SNSRegion --> SenderID
    SNSRegion --> OptOut
    SNSRegion --> RateLimit

    SNSRegion --> Citizens
    SNSRegion --> Responders
    SNSRegion --> Supervisors

    SNSRegion --> CWMetrics
    CWMetrics --> CWAlarms

    style SNSTopicBroadcast fill:#FF9900,color:#000
    style SNSTopicAlerts fill:#FF9900,color:#000
    style SQSMain fill:#FF9900,color:#000
    style SMSWorker fill:#FF9900,color:#000
```

### SMS Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| **Region** | ap-southeast-1 | Singapore region for local SMS rates |
| **Sender ID** | QUICKAID | Up to 11 characters alphanumeric |
| **Default SMS Type** | Transactional | For alerts and notifications |
| **Delivery Status Logging** | Enabled | Track delivery in CloudWatch |
| **Monthly Spend Limit** | $1,000 (adjustable) | AWS account-level limit |
| **Opt-out Keyword** | STOP, END, QUIT | Recipients can opt out |
| **Rate Limit** | 5 SMS/second | Per AWS account |
| **Message Format** | GSM 03.38 | Supports English characters |

---

## Frontend Hosting Architecture

### S3 + CloudFront Deployment

```mermaid
graph TB
    subgraph "Global Edge Network"
        Edge[CloudFront Edge Locations<br/>Singapore: 4 PoCs]
    end

    subgraph "DNS Configuration"
        Route53[Route 53 Hosted Zone<br/>quickaid.gov.sg]
        ARecord[A Record (Alias)<br/>quickaid.gov.sg → CloudFront]
        AAAARecord[AAAA Record (Alias)<br/>quickaid.gov.sg → CloudFront]
    end

    subgraph "CloudFront Distribution"
        CF[Distribution ID: EXXXXX<br/>Price Class: PriceClass_100<br/>Asia Pacific only]
        Origin1[Origin 1: S3 Bucket<br/>quickaid-frontend.s3.ap-southeast-1.amazonaws.com]
        Origin2[Origin 2: ALB<br/>quickaid-alb-XXXXX.elb.amazonaws.com]

        CachePolicyStatic[Cache Policy: quickaid-static<br/>Min TTL: 0<br/>Default TTL: 86400 (1 day)<br/>Max TTL: 31536000 (1 year)]
        CachePolicyAPI[Cache Policy: quickaid-api<br/>Min TTL: 0<br/>Default TTL: 0<br/>Max TTL: 0]

        BehaviorStatic[Behavior 1: Default (*)<br/>Origin: S3 Bucket<br/>Cache: quickaid-static<br/>Compress: Yes]
        BehaviorAPI[Behavior 2: /api/*<br/>Origin: ALB<br/>Cache: quickaid-api<br/>Compress: Yes]
        BehaviorSSE[Behavior 3: /api/sse*<br/>Origin: ALB<br/>Cache: Disabled<br/>Compress: No]

        OAC[Origin Access Control<br/>Sign requests to S3<br/>Block public access]
    end

    subgraph "SSL/TLS"
        ACMCert[ACM Certificate<br/>quickaid.gov.sg<br/>Type: Public<br/>Validation: DNS]
        SSLConfig[Security Policy<br/>TLSv1.2_2021-01<br/>HTTPS Only]
    end

    subgraph "Security"
        WAF[AWS WAF Web ACL<br/>quickaid-waf<br/>Managed Rules: AWSManagedRulesCommonRuleSet<br/>Rate-based Rule: 2000/5min]
        Shield[AWS Shield Standard<br/>DDoS Protection]
    end

    subgraph "S3 Storage"
        S3Bucket[S3 Bucket: quickaid-frontend<br/>Region: ap-southeast-1<br/>Access: Private<br/>Versioning: Enabled]
        StaticFiles[React Build Output<br/>index.html, *.js, *.css]
    end

    subgraph "Compute"
        EC2Instances[EC2 Auto Scaling Group<br/>4 × t3.large instances<br/>Docker Compose]
    end

    User[User Browser] --> Route53
    Route53 --> ARecord
    Route53 --> AAAARecord

    ARecord --> Edge
    AAAARecord --> Edge

    Edge --> CF
    CF --> SSLConfig
    SSLConfig --> ACMCert
    CF --> WAF
    WAF --> Shield

    WAF --> BehaviorStatic
    WAF --> BehaviorAPI
    WAF --> BehaviorSSE

    BehaviorStatic --> CachePolicyStatic
    BehaviorStatic --> OAC
    OAC --> Origin1
    Origin1 --> S3Bucket
    S3Bucket --> StaticFiles

    BehaviorAPI --> CachePolicyAPI
    BehaviorAPI --> Origin2
    Origin2 --> EC2Instances

    BehaviorSSE --> Origin2
    Origin2 --> EC2Instances

    style Edge fill:#FF9900,color:#000
    style CF fill:#FF9900,color:#000
    style S3Bucket fill:#FF9900,color:#000
    style EC2Instances fill:#FF9900,color:#000
```

---

## Security Architecture

### IAM Role Configuration

```mermaid
graph TB
    subgraph "IAM Roles"
        subgraph "EC2 Instance Profile"
            EC2Role[Role: EC2-QuickAid-Role<br/>Trust Policy: ec2.amazonaws.com]
            EC2Perms[Permissions:<br/>ssm:GetParameter<br/>secretsmanager:GetSecretValue<br/>rds-db:connect<br/>sqs:ReceiveMessage,DeleteMessage<br/>sns:Publish<br/>s3:PutObject,GetObject<br/>logs:PutLogEvents<br/>elasticache:Connect]
        end

        subgraph "Bastion Role"
            BastionRole[Role: EC2-Bastion-Role<br/>Trust Policy: ec2.amazonaws.com]
            BastionPerms[Permissions:<br/>ssm:UpdateInstanceInformation<br/>ssmmessages:CreateControlChannel<br/>ssmmessages:OpenControlChannel]
        end

        subgraph "Systems Manager Access"
            SSMRole[Role: QuickAid-SSM-Access<br/>For SSH access<br/>Trusted IAM users/groups]
        end
    end

    EC2Role --> EC2Perms
    BastionRole --> BastionPerms

    style EC2Role fill:#FF9900,color:#000
    style BastionRole fill:#FF9900,color:#000
```

### IAM Policy: EC2 Instance Profile

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SSMParameterAccess",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:ap-southeast-1:123456789012:parameter/quickaid/*"
    },
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:quickaid-db-*",
        "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:quickaid-jwt-*",
        "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:quickaid-gemini-*"
      ]
    },
    {
      "Sid": "ElastiCacheAccess",
      "Effect": "Allow",
      "Action": [
        "elasticache:Connect"
      ],
      "Resource": "arn:aws:elasticache:ap-southeast-1:123456789012:cluster:quickaid-redis"
    },
    {
      "Sid": "SNSPublish",
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": [
        "arn:aws:sns:ap-southeast-1:123456789012:quickaid-*"
      ]
    },
    {
      "Sid": "SQSAccess",
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:ChangeMessageVisibility",
        "sqs:GetQueueAttributes"
      ],
      "Resource": [
        "arn:aws:sqs:ap-southeast-1:123456789012:quickaid-*"
      ]
    },
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::quickaid-uploads/*"
      ]
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchMetrics",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2Metadata",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "autoscaling:CompleteLifecycleAction"
      ],
      "Resource": "*"
    }
  ]
}
```

### Security Layers

```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "Edge Security"
            WAF[Web Application Firewall<br/>SQL injection protection<br/>XSS protection<br/>Rate limiting<br/>IP reputation]
            Shield[AWS Shield Standard<br/>DDoS protection<br/>Network & Transport layer]
            CFSSL[CloudFront SSL/TLS<br/>TLS 1.2+ only<br/>Perfect Forward Secrecy]
        end

        subgraph "Network Security"
            VPC[VPC Isolation<br/>Private subnets for EC2<br/>No direct internet access]
            SG[Security Groups<br/>Stateful firewall<br/>Least privilege<br/>Only needed ports]
            NACL[Network ACLs<br/>Stateless rules<br/>Subnet-level control]
        end

        subgraph "Application Security"
            Helmet[Helmet.js Headers<br/>CSP, HSTS, X-Frame-Options]
            CORS[CORS Configuration<br/>Origin validation<br/>Credentials policy]
            RateLimit[Rate Limiting<br/>General: 100/min<br/>AI: 10/min<br/>Auth: 5/min]
        end

        subgraph "Authentication & Authorization"
            JWT[JWT Access Tokens<br/>15 min expiry<br/>Signed with secret]
            RefreshToken[Refresh Tokens<br/>7 day expiry<br/>httpOnly cookie<br/>CSRF protection]
            RBAC[Role-Based Access Control<br/>citizen, responder, supervisor, gov_admin]
        end

        subgraph "Data Security"
            KMS[AWS KMS<br/>Customer-managed CMK<br/>Envelope encryption]
            RDS_SSL[RDS SSL<br/>Enforced connections<br/>Certificate validation]
            S3_Enc[S3 Server-Side Encryption<br/>SSE-KMS<br/>Bucket policies]
        end

        subgraph "Access Control"
            SSH[SSH Access<br/>Via Bastion Host<br/>Authorized IAM users]
            SSM[Systems Manager<br/>Session Manager<br/>No SSH needed]
            MFA[MFA Required<br/>For IAM users<br/>Multi-factor authentication]
        end

        subgraph "Audit & Compliance"
            CloudTrail[CloudTrail<br/>All API activity logged<br/>Immutable audit trail]
            Config[AWS Config<br/>Compliance monitoring<br/>Resource tracking]
            GuardDuty[GuardDuty<br/>Threat detection<br/>Anomaly detection]
        end
    end

    UserRequest[User Request] --> WAF
    WAF --> Shield
    Shield --> CFSSL
    CFSSL --> VPC
    VPC --> SG
    SG --> NACL
    NACL --> Helmet
    Helmet --> CORS
    CORS --> RateLimit
    RateLimit --> JWT
    JWT --> RefreshToken
    RefreshToken --> RBAC
    RBAC --> KMS
    KMS --> RDS_SSL
    RDS_SSL --> S3_Enc
    S3_Enc --> SSH
    SSH --> SSM
    SSM --> MFA
    MFA --> CloudTrail
    CloudTrail --> Config
    Config --> GuardDuty

    style WAF fill:#FF9900,color:#000
    style Shield fill:#FF9900,color:#000
    style KMS fill:#FF9900,color:#000
    style CloudTrail fill:#FF9900,color:#000
```

---

## Monitoring & Observability

### CloudWatch Integration

```mermaid
graph TB
    subgraph "Log Collection"
        EC2Logs[EC2 Instance Logs<br/>/quickaid/ec2/syslog<br/>/quickaid/ec2/user-data]
        DockerLogs[Docker Container Logs<br/>quickaid-backend<br/>quickaid-sse<br/>quickaid-worker]
        ALBLogs[ALB Access Logs<br/>/quickaid/alb/access]
        CFLogs[CloudFront Access Logs<br/>S3: quickaid-logs/cloudfront]
    end

    subgraph "Metrics Collection"
        subgraph "Application Metrics"
            APILatency[API Latency<br/>p50, p90, p99<br/>Target: < 200ms]
            APIErrorRate[API Error Rate<br/>4xx, 5xx<br/>Target: < 1%]
            APIThroughput[API Throughput<br/>Requests/second]
            ActiveUsers[Active Users<br/>Authenticated sessions]
        end

        subgraph "Infrastructure Metrics"
            CPUMetrics[CPU Utilization<br/>EC2 instances<br/>Alert: > 80% for 5min]
            MemoryMetrics[Memory Utilization<br/>EC2 instances<br/>Alert: > 85% for 5min]
            DiskMetrics[Disk Usage<br/>EBS volumes<br/>Alert: > 90%]
            DBConnections[DB Connections<br/>Active connections<br/>Alert: > 180]
            DBLatency[DB Query Latency<br/>Average query time<br/>Alert: > 100ms]
        end

        subgraph "ASG Metrics"
            ASGInstances[Instances in Service<br/>Running EC2 instances]
            ASGScaling[Scaling Events<br/>Scale out/in actions]
            ASGHealth[Instance Health<br/>Healthy instances]
        end

        subgraph "SSE Metrics"
            SSEConnections[SSE Connections<br/>Active connections<br/>Alert: > 2000]
            SSEMessages[SSE Messages<br/>Messages sent/second]
            InstanceConnections[Connections per Instance<br/>Alert: > 500]
        end

        subgraph "SMS Metrics"
            SMSDelivery[SMS Delivery Rate<br/>Successful deliveries<br/>Alert: < 90%]
            SMSBounce[SMS Bounce Rate<br/>Failed deliveries<br/>Alert: > 10%]
            SMSCost[SMS Cost Tracking<br/>Daily spend<br/>Alert: > $50/day]
        end

        subgraph "Business Metrics"
            IncidentVolume[Incident Volume<br/>Incidents/hour<br/>Alert: > 50/hour]
            TriageTime[Triage Time<br/>AI analysis duration<br/>Target: < 30s]
            ResponseTime[Response Time<br/>Incident to dispatch<br/>Target: < 5min]
        end
    end

    subgraph "Alarms"
        AlarmCPU[CPU > 80% for 5min<br/>Action: Scale up ASG]
        AlarmMemory[Memory > 85% for 5min<br/>Action: Scale up ASG]
        AlarmSSE[SSE Connections > 2000<br/>Action: Scale up ASG]
        AlarmDBConn[DB Connections > 180<br/>Action: Notify DBA]
        Alarm5xx[API 5xx Rate > 1%<br/>Action: Investigate backend]
        AlarmSMSBounce[SMS Bounce > 10%<br/>Action: Review phone list]
        AlarmIncident[Incidents > 50/hour<br/>Action: Notify Ops team]
    end

    subgraph "Dashboards"
        MainDashboard[QuickAid Main Dashboard<br/>Overall health status]
        APIDashboard[API Performance Dashboard<br/>Latency, errors, throughput]
        DBDashboard[Database Health Dashboard<br/>Connections, queries, locks]
        SMSDashboard[SMS Delivery Dashboard<br/>Delivery rate, cost tracking]
        BusinessDashboard[Business Metrics Dashboard<br/>Incidents, response time]
        ASGDashboard[EC2 Auto Scaling Dashboard<br/>Instances, scaling events]
    end

    subgraph "Monitoring Tools"
        CloudWatchAgent[CloudWatch Agent<br/>Installed on each EC2]
        SystemsManager[Systems Manager<br/>Instance health<br/>Patch management]
        XRay[AWS X-Ray<br/>Distributed tracing]
    end

    EC2Logs --> CloudWatchLogs[CloudWatch Logs]
    DockerLogs --> CloudWatchLogs
    ALBLogs --> CloudWatchLogs
    CFLogs --> S3LogsBucket

    CPUMetrics --> CloudWatchMetrics[CloudWatch Metrics]
    MemoryMetrics --> CloudWatchMetrics
    DiskMetrics --> CloudWatchMetrics
    DBConnections --> CloudWatchMetrics
    DBLatency --> CloudWatchMetrics

    ASGInstances --> CloudWatchMetrics
    ASGScaling --> CloudWatchMetrics
    ASGHealth --> CloudWatchMetrics

    SSEConnections --> CloudWatchMetrics
    SSEMessages --> CloudWatchMetrics
    InstanceConnections --> CloudWatchMetrics

    SMSDelivery --> CloudWatchMetrics
    SMSBounce --> CloudWatchMetrics
    SMSCost --> CloudWatchMetrics

    IncidentVolume --> CloudWatchMetrics
    TriageTime --> CloudWatchMetrics
    ResponseTime --> CloudWatchMetrics

    CloudWatchMetrics --> AlarmCPU
    CloudWatchMetrics --> AlarmMemory
    CloudWatchMetrics --> AlarmSSE
    CloudWatchMetrics --> AlarmDBConn
    CloudWatchMetrics --> Alarm5xx
    CloudWatchMetrics --> AlarmSMSBounce
    CloudWatchMetrics --> AlarmIncident

    CloudWatchMetrics --> MainDashboard
    CloudWatchMetrics --> APIDashboard
    CloudWatchMetrics --> DBDashboard
    CloudWatchMetrics --> SMSDashboard
    CloudWatchMetrics --> BusinessDashboard
    CloudWatchMetrics --> ASGDashboard

    CloudWatchAgent --> EC2Logs
    CloudWatchAgent --> CPUMetrics
    CloudWatchAgent --> MemoryMetrics
    CloudWatchAgent --> DiskMetrics

    SystemsManager --> ASGHealth
    XRay --> Segments[Request Segments]

    style CloudWatchLogs fill:#FF9900,color:#000
    style CloudWatchMetrics fill:#FF9900,color:#000
    style XRay fill:#FF9900,color:#000
    style SystemsManager fill:#FF9900,color:#000
```

### CloudWatch Alarms

| Alarm | Metric | Threshold | Period | Action |
|-------|--------|-----------|--------|--------|
| `quickaid-cpu-high` | CPUUtilization > 80% | 3 consecutive periods | 5 min | SNS notification, scale up ASG |
| `quickaid-memory-high` | MemoryUtilization > 85% | 3 consecutive periods | 5 min | SNS notification, scale up ASG |
| `quickaid-sse-connections-high` | SSEConnections > 2000 | 2 consecutive periods | 1 min | SNS notification, scale up ASG |
| `quickaid-db-connections-high` | DatabaseConnections > 180 | 2 consecutive periods | 1 min | SNS notification |
| `quickaid-api-5xx-high` | HTTPCode_Target_5XX_Count > 1% | 5 consecutive periods | 1 min | SNS notification |
| `quickaid-sms-bounce-high` | SMSBounceRate > 10% | 5 consecutive periods | 5 min | SNS notification |
| `quickaid-instance-unhealthy` | ASG Unhealthy Count > 1 | 1 period | 1 min | SNS notification |

---

## Step-by-Step Process Flows

### Flow 1: User Login Process

| Step | User Action | AWS Service | Details |
|------|-------------|-------------|---------|
| **1** | User navigates to `https://quickaid.gov.sg` | **Route 53** | DNS lookup resolves domain to CloudFront distribution |
| **2** | Browser sends HTTPS request | **CloudFront** | Request hits nearest edge location (Singapore PoC) |
| **3** | Static assets served | **CloudFront → S3** | CloudFront serves React app from S3 bucket via OAC |
| **4** | User enters email/password, clicks Login | **CloudFront** | POST request to `/api/auth/login` |
| **5** | WAF security check | **AWS WAF** | Validates against SQL injection, XSS, rate limiting rules |
| **6** | Request forwarded | **Application Load Balancer** | Routes to EC2 target group |
| **7** | Load balanced to EC2 | **ALB → EC2 ASG** | Request routed to healthy EC2 instance |
| **8** | Rate limit check | **ElastiCache Redis** | `GET rate:{email}:login` - checks if under 5 attempts/min |
| **9** | Retrieve database credentials | **Secrets Manager** | EC2 instance retrieves `quickaid-db` secret (encrypted) |
| **10** | Query user record | **RDS PostgreSQL** | `SELECT * FROM users WHERE email = ?` via Multi-AZ primary |
| **11** | Verify password | **EC2 Backend Container** | bcrypt.compare() with password_hash from database |
| **12** | Generate JWT tokens | **EC2 Backend Container** | Creates access token (15min) + refresh token (7 days) |
| **13** | Store session | **ElastiCache Redis** | `SET session:{userId}` with TTL 7 days |
| **14** | Update last login | **RDS PostgreSQL** | `UPDATE users SET last_login_at = NOW()` |
| **15** | Set httpOnly cookie | **EC2 Backend → CloudFront** | Set-Cookie: refreshToken (Secure, HttpOnly, SameSite=Strict) |
| **16** | Log authentication | **CloudWatch Logs** | Write structured log entry to `/quickaid/ec2/syslog` |
| **17** | Return response | **CloudFront → Browser** | JSON with accessToken and user data |
| **18** | User logged in | **Browser** | Store accessToken in memory, redirect to dashboard |

---

### Flow 2: SMS Broadcasting Process

| Step | Gov Admin Action | AWS Service | Details |
|------|------------------|-------------|---------|
| **1** | Navigate to Broadcast page | **Route 53 → CloudFront → S3** | Load React app from edge location |
| **2** | Fill broadcast form | **Browser** | { title, message, audience: 'responders', zone: 'North' } |
| **3** | Submit broadcast | **CloudFront → ALB** | POST `/api/broadcasts` |
| **4** | WAF validation | **AWS WAF** | Validate request body, check rate limits |
| **5** | Route to EC2 | **ALB → EC2 ASG** | Route to healthy EC2 instance backend container |
| **6** | Validate JWT token | **EC2 Backend Container** | Verify admin role (`gov_admin` or `supervisor`) |
| **7** | Create broadcast record | **RDS PostgreSQL** | `INSERT INTO broadcasts` returns broadcast ID |
| **8** | Query eligible recipients | **RDS PostgreSQL** | `SELECT phone FROM users WHERE role='responders' AND zone='North'` |
| **9** | Create pending SMS logs | **RDS PostgreSQL** | `INSERT INTO sms_logs` for each recipient (status: 'pending') |
| **10** | Send to SQS queue | **SQS Queue** | `SendMessage` to `quickaid-sms-jobs` FIFO queue |
| **11** | Acknowledge broadcast | **EC2 Backend → CloudFront** | Return `{ id, status: 'queued', recipientsCount: 150 }` |
| **12** | Log broadcast creation | **CloudWatch Logs** | Write to `/quickaid/ec2/syslog` |
| **13** | Send SSE notification | **EC2 SSE Container** | Broadcast event to connected admin dashboard |
| **14** | Display queued status | **Gov Admin UI** | "Broadcast queued (150 recipients)" |

| Step | Background Worker | AWS Service | Details |
|------|-------------------|-------------|---------|
| **15** | Poll SQS queue | **SQS Queue** | Worker container calls `ReceiveMessage` (batchSize: 10) |
| **16** | Receive broadcast jobs | **SQS Queue** | Get 10 broadcast job messages |
| **17** | Process each broadcast | **EC2 Worker Container** | Loop through each broadcast ID |
| **18** | Get broadcast details | **RDS PostgreSQL** | `SELECT * FROM broadcasts WHERE id = ?` |
| **19** | Get recipient phone numbers | **RDS PostgreSQL** | `SELECT phone FROM sms_logs WHERE broadcast_id = ? AND status='pending'` |
| **20** | Batch recipients | **EC2 Worker Container** | Group into batches of 1000 (SNS limit) |
| **21** | Publish to SNS | **Amazon SNS** | `publishBatch` to `quickaid-broadcasts.fifo` topic |
| **22** | SNS topic check | **SNS** | Validates IAM permissions, message attributes |
| **23** | Send SMS messages | **SNS → Telco** | SNS routes to Singapore telco via sender ID "QUICKAID" |
| **24** | Deliver to recipients | **Telco → Mobile** | SMS delivered to 150 responder phones |
| **25** | Process delivery receipts | **SNS → EC2 Worker** | SNS publishes delivery status to CloudWatch |
| **26** | Update delivery status | **RDS PostgreSQL** | `UPDATE sms_logs SET status='delivered', delivered_at=NOW()` |
| **27** | Handle failed deliveries | **EC2 Worker → DLQ** | Failed messages go to Dead Letter Queue |
| **28** | Log failed SMS | **RDS PostgreSQL** | `UPDATE sms_logs SET status='failed', error_message='Invalid phone number'` |
| **29** | Delete processed messages | **SQS Queue** | `DeleteMessage` for processed jobs |
| **30** | Update CloudWatch metrics | **CloudWatch Metrics** | `PutMetricData` for delivery_rate, cost_tracking |
| **31** | Log batch summary | **CloudWatch Logs** | Write to `/quickaid/ec2/syslog` |
| **32** | Notify admin of completion | **SSE Service** | Push delivery report to admin dashboard |

---

### Flow 3: Incident Reporting with AI Triage

| Step | Citizen Action | AWS Service | Details |
|------|----------------|-------------|---------|
| **1** | Open report incident form | **Route 53 → CloudFront → S3** | Load React app from edge location |
| **2** | Fill incident details | **Browser** | { type: 'medical', title, description, location, severity: 2 } |
| **3** | Submit incident | **CloudFront → ALB** | POST `/api/incidents` |
| **4** | WAF security check | **AWS WAF** | Validate request body, check rate limits |
| **5** | Route to EC2 | **ALB → EC2 ASG** | Route to healthy EC2 instance backend container |
| **6** | Verify JWT token | **EC2 Backend Container** | Decode and validate access token |
| **7** | Check rate limit | **ElastiCache Redis** | `INCR rate:{userId}:incidents` (100/hour limit) |
| **8** | Generate ticket number | **EC2 Backend Container** | Format: `INC-YYYYMMDD-HHMMSS` |
| **9** | Get DB credentials | **Secrets Manager** | Retrieve encrypted DB connection string |
| **10** | Insert incident | **RDS PostgreSQL** | `INSERT INTO incidents` with ticket_number, user_id |
| **11** | Create timeline entry | **RDS PostgreSQL** | `INSERT INTO incident_updates` (system: "Incident reported") |
| **12** | Cache incident | **ElastiCache Redis** | `SET incident:{id}` with 30 min TTL |
| **13** | Log incident creation | **CloudWatch Logs** | Write to `/quickaid/ec2/syslog` |
| **14** | Return ticket number | **EC2 Backend → CloudFront → Browser** | `{ ticketNumber: 'INC-20260519-143052', id }` |

| Step | Responder Action | AWS Service | Details |
|------|------------------|-------------|---------|
| **15** | View incident and request AI triage | **CloudFront → ALB → SSE** | GET `/api/ai/triage?incidentId={id}` |
| **16** | Establish SSE connection | **EC2 SSE Container** | Set headers: `Content-Type: text/event-stream` |
| **17** | Keep SSE alive | **EC2 SSE Container** | Send `: keepalive` every 25 seconds |
| **18** | Backend receives triage request | **EC2 Backend Container** | Process AI triage for incident |
| **19** | Get incident context | **RDS PostgreSQL** | Query incident details, nearby hospitals, volunteers |
| **20** | Fetch hospital data | **RDS PostgreSQL** | `SELECT * FROM hospitals ORDER BY location` |
| **21** | Fetch available volunteers | **RDS PostgreSQL** | `SELECT * FROM volunteers WHERE is_available=true AND skills @> ARRAY['first_aid']` |
| **22** | Prepare AI prompt | **EC2 Backend Container** | Construct context for Gemini AI |
| **23** | Call Gemini API | **Google Gemini AI** | POST to `generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent` |
| **24** | Stream AI response | **Gemini → EC2 Backend** | Receive streaming chunks of AI analysis |
| **25** | Process each chunk | **EC2 Backend Container** | Parse JSON chunks with analysis options |
| **26** | Send via SSE | **EC2 Backend → EC2 SSE Container** | Push event: `{ type: 'text', content: '...' }` |
| **27** | Stream to responder | **CloudFront → Browser** | Progressive display of AI recommendations |
| **28** | Final AI response | **Gemini** | Complete triage with 3 ranked options |
| **29** | Send complete event | **EC2 SSE Container** | `{ type: 'complete', options: [{rank, action, rationale, resources_required, notify, eta_minutes, confidence}] }` |
| **30** | Store AI data | **RDS PostgreSQL** | `UPDATE incidents SET ai_triage_data = ?` |
| **31** | Log AI usage | **CloudWatch Metrics** | Track AI API calls and response time |
| **32** | Responder reviews options | **Browser UI** | Display 3 ranked response options |
| **33** | Responder approves option | **CloudFront → ALB → EC2 Backend** | PATCH `/api/incidents/:id/approve` with `{ option: 1 }` |
| **34** | Update incident status | **RDS PostgreSQL** | `UPDATE incidents SET status='dispatched', approved_option=1` |
| **35** | Create dispatch timeline | **RDS PostgreSQL** | `INSERT INTO incident_updates` (dispatch: "Option 1 approved") |
| **36** | Notify connected responders | **EC2 SSE Container** | Push `{ type: 'incident_updated', payload: {...} }` to all SSE clients |
| **37** | Log approval | **CloudWatch Logs** | Write approval details to logs |
| **38** | Return confirmation | **CloudFront → Browser** | `{ message: 'Option approved and dispatched' }` |

---

### Flow 4: SSE Real-time Updates on EC2

| Step | Responder Action | AWS Service | Details |
|------|------------------|-------------|---------|
| **1** | Login to responder portal | **Route 53 → CloudFront → S3** | Load React app |
| **2** | Establish SSE connection | **CloudFront → ALB** | GET `/api/sse` with `Authorization: Bearer {token}` |
| **3** | WAF validation | **AWS WAF** | Check request rate, validate headers |
| **4** | Route to EC2 SSE | **ALB → EC2 ASG** | Route to SSE target group (port 3001) |
| **5** | Validate JWT token | **EC2 SSE Container** | Decode and verify access token |
| **6** | Generate connection ID | **EC2 SSE Container** | Format: `{instanceId}-{userId}-{timestamp}` |
| **7** | Get instance ID | **EC2 Metadata** | Fetch EC2 instance ID from metadata service |
| **8** | Set SSE headers | **EC2 SSE Container** | `Content-Type: text/event-stream`, `Cache-Control: no-cache` |
| **9** | Send connected event | **EC2 SSE Container → Browser** | `data: {"type":"connected","connectionId":"...","instanceId":"i-xxx"}` |
| **10** | Track connection | **ElastiCache Redis** | `SET sse:{connectionId}` with TTL 5 min |
| **11** | Track per-instance connections | **ElastiCache Redis** | `SADD instance:{instanceId} {connectionId}` with TTL 5 min |
| **12** | Store connection mapping | **EC2 SSE Container** | Map connectionId → response object |
| **13** | Start keepalive timer | **EC2 SSE Container** | SetInterval every 25 seconds |
| **14** | Send keepalive | **EC2 SSE Container → Browser** | `: keepalive` (prevents timeout) |
| **15** | Monitor connection | **EC2 SSE Container** | Listen for `close` and `error` events |

| Step | Backend (Background) | AWS Service | Details |
|------|-----------------------|-------------|---------|
| **16** | Incident status changes | **EC2 Backend Container** | Admin updates incident status |
| **17** | Update database | **RDS PostgreSQL** | `UPDATE incidents SET status='on_scene'` |
| **18** | Create timeline entry | **RDS PostgreSQL** | `INSERT INTO incident_updates` |
| **19** | Notify SSE service | **EC2 Backend → Redis** | `PUBLISH sse_updates:{incidentId}` channel |
| **20** | SSE service receives update | **EC2 SSE Container → Redis** | Subscribed to Redis Pub/Sub |
| **21** | Query affected connections | **ElastiCache Redis** | `SCAN for sse:* patterns` |
| **22** | Push update to clients | **EC2 SSE Container → Browser** | `data: {"type":"incident_updated","payload":{...}}` |
| **23** | UI updates automatically | **Browser** | React component re-renders with new data |

| Step | Instance Lifecycle | AWS Service | Details |
|------|-------------------|-------------|---------|
| **24** | Auto scaling terminates instance | **ASG → EC2** | Instance receives SIGTERM signal |
| **25** | Graceful shutdown handler | **EC2 SSE Container** | Docker container receives SIGTERM |
| **26** | Notify connected clients | **EC2 SSE Container → Browser** | Send `{"type":"server_shutdown","message":"Reconnecting..."}` |
| **27** | Drain SSE connections | **EC2 SSE Container** | Wait up to 2 minutes for connections to close |
| **28** | Update Redis | **ElastiCache Redis** | `DEL instance:{instanceId}` and all `sse:{connectionId}` |
| **29** | Stop Docker containers | **EC2 → Docker** | `docker-compose down` |
| **30** | Instance terminates | **ASG** | Instance goes to Terminating state |
| **31** | Browser auto-reconnects | **Browser** | EventSource automatically retries to new instance |

---

### Flow 5: EC2 Auto Scaling Process

| Step | Auto Scaling Event | AWS Service | Details |
|------|-------------------|-------------|---------|
| **1** | CloudWatch alarm triggers | **CloudWatch** | `quickaid-cpu-high` (CPU > 80% for 5min) |
| **2** | Scale out policy executes | **Auto Scaling Group** | Launch template creates new EC2 instance |
| **3** | User data script runs | **EC2** | Bootstrap script executes |
| **4** | Install Docker | **EC2 → apt** | Install Docker and Docker Compose |
| **5** | Login to ECR | **EC2 → ECR** | Authenticate with AWS credentials |
| **6** | Pull Docker images | **EC2 → ECR** | Pull `quickaid-backend:latest` |
| **7** | Start containers | **EC2 → Docker Compose** | `docker-compose up -d` |
| **8** | Health check pending | **ALB** | Target group shows instance as `initializing` |
| **9** | Containers start | **Docker** | Backend, SSE, Worker containers running |
| **10** | Health check passes | **ALB** | `/health` and `/sse/health` return 200 |
| **11** | Instance healthy | **ALB → ASG** | Instance added to target group |
| **12** | Traffic starts flowing | **ALB → EC2** | Load balancer routes traffic to new instance |
| **13** | Update metrics | **CloudWatch** | CPU utilization decreases |
| **14** | Alarm clears | **CloudWatch** | `quickaid-cpu-high` alarm state changes to OK |

| Step | Scale In Event | AWS Service | Details |
|------|----------------|-------------|---------|
| **15** | CloudWatch alarm triggers | **CloudWatch** | `quickaid-cpu-low` (CPU < 30% for 10min) |
| **16** | Scale in policy executes | **Auto Scaling Group** | Select instance to terminate |
| **17** | Instance selected | **ASG** | Choose instance with oldest launch time |
| **18** | Termination lifecycle hook | **ASG → EC2** | Send `autoscaling:EC2_INSTANCE_TERMINATING` |
| **19** | Graceful shutdown | **EC2** | `/opt/quickaid/graceful-shutdown.sh` executes |
| **20** | Notify SSE connections | **EC2 SSE Container** | Send shutdown event to clients |
| **21** | Drain connections | **EC2 SSE Container** | Wait up to 2 minutes |
| **22** | Stop containers | **EC2 → Docker** | `docker-compose down` |
| **23** | Complete lifecycle hook | **ASG** | Instance enters `Terminating:Proceed` |
| **24** | Instance terminates | **EC2** | Instance shut down |
| **25** | Remove from target group | **ALB** | Instance removed from routing |

---

### Flow 6: Frontend Deployment Process

| Step | Action | AWS Service | Details |
|------|--------|-------------|---------|
| **1** | Developer pushes code | **GitHub** | Push to `main` branch triggers webhook |
| **2** | CodePipeline starts | **AWS CodePipeline** | Pipeline execution initiated |
| **3** | Source stage completes | **CodePipeline → GitHub** | Fetches latest commit SHA |
| **4** | Start frontend build | **CodeBuild: quickaid-frontend** | Build project with Node.js 20 |
| **5** | Install dependencies | **CodeBuild → npm** | `npm ci` in `client/` directory |
| **6** | Build React app | **CodeBuild → Vite** | `npm run build` creates `dist/` folder |
| **7** | Run tests (if configured) | **CodeBuild → Jest/Vitest** | Execute test suite |
| **8** | Package artifacts | **CodeBuild → S3** | Upload `dist/` to `quickaid-artifacts` bucket |
| **9** | Build stage completes | **CodePipeline** | Status: SUCCESS |
| **10** | Start frontend deploy | **CodePipeline** | Deploy stage begins |
| **11** | Sync to S3 bucket | **AWS CLI → S3** | `aws s3 sync dist/ s3://quickaid-frontend --delete` |
| **12** | Set cache headers | **S3** | Configure metadata for static files |
| **13** | Invalidate CloudFront | **CloudFront** | `aws cloudfront create-invalidation --paths "/*"` |
| **14** | CloudFront propagates | **CloudFront Edge** | Invalidate all edge locations globally |
| **15** | Deploy stage completes | **CodePipeline** | Status: SUCCESS |
| **16** | Notify team | **SNS → Slack/Email** | Deployment notification sent |

---

### Flow 7: Backend Deployment Process

| Step | Action | AWS Service | Details |
|------|--------|-------------|---------|
| **1** | Developer pushes code | **GitHub** | Push to `main` branch |
| **2** | CodePipeline starts | **AWS CodePipeline** | Pipeline execution initiated |
| **3** | Source stage completes | **CodePipeline → GitHub** | Fetches latest commit SHA |
| **4** | Start backend build | **CodeBuild: quickaid-backend** | Build Docker image |
| **5** | Install dependencies | **CodeBuild → npm** | `npm ci` in `server/` directory |
| **6** | Run tests | **CodeBuild → npm** | `npm test` - all tests must pass |
| **7** | Login to ECR | **AWS CLI → ECR** | `aws ecr get-login-password` |
| **8** | Build Docker image | **CodeBuild → Docker** | `docker build -t quickaid-backend:${SHA}` |
| **9** | Tag images | **Docker** | Tag as `latest` and `${SHA}` |
| **10** | Push to ECR | **ECR** | `docker push 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/quickaid-backend:${SHA}` |
| **11** | Package artifacts | **S3** | Upload to `quickaid-artifacts` bucket |
| **12** | Manual approval (production) | **CodePipeline** | Wait for manual approval |
| **13** | Approver clicks approve | **CodePipeline** | Proceed to deploy stage |
| **14** | Start rolling update | **Auto Scaling Group** | Begin instance replacement |
| **15** | Suspend scaling | **ASG** | `suspend-processes` during deployment |
| **16** | Update launch template | **ASG** | Point to new Docker image tag |
| **17** | Start instance refresh | **ASG** | `instance-refresh` begins |
| **18** | Terminate old instance | **ASG → EC2** | Graceful shutdown with lifecycle hook |
| **19** | Launch new instance | **ASG → EC2** | New instance with updated image |
| **20** | Bootstrap new instance | **EC2** | User data script runs |
| **21** | Pull new image | **EC2 → ECR** | `docker pull quickaid-backend:latest` |
| **22** | Start containers | **EC2 → Docker Compose** | `docker-compose up -d` |
| **23** | Health checks | **ALB** | Verify `/health` and `/sse/health` |
| **24** | Instance healthy | **ALB → ASG** | New instance accepts traffic |
| **25** | Repeat for all instances | **ASG** | Rolling update continues (one at a time) |
| **26** | All instances updated | **ASG** | Instance refresh completes |
| **27** | Resume scaling | **ASG** | `resume-processes` |
| **28** | Run database migrations | **EC2 → RDS** | Execute any pending migrations |
| **29** | Smoke tests | **CodeBuild → API** | Test critical endpoints |
| **30** | Deploy stage completes | **CodePipeline** | Status: SUCCESS |
| **31** | X-Ray trace recording | **AWS X-Ray** | Start recording new deployment traces |
| **32** | Notify team | **SNS → Slack/Email** | Deployment notification sent |

---

## CI/CD Pipeline

### CodePipeline Architecture

```mermaid
graph TB
    subgraph "Source Stage"
        GitHub[GitHub Repository<br/>quickaid/quickaid-platform<br/>Branch: main]
        Webhook[Webhook Trigger<br/>Push to main]
    end

    subgraph "Build Stage"
        subgraph "Frontend Build"
            CFBuild[CodeBuild: quickaid-frontend<br/>Image: aws/codebuild/standard:7.0]
            CFSteps[Steps:<br/>npm ci<br/>npm run build<br/>Sync to S3]
        end

        subgraph "Backend Build"
            CBBuild[CodeBuild: quickaid-backend<br/>Image: aws/codebuild/standard:7.0]
            CBSteps[Steps:<br/>npm ci<br/>npm test<br/>Docker build & push]
        end

        subgraph "Artifact Storage"
            ECRBackend[ECR: quickaid-backend<br/>Image tags: latest, {commit-sha}]
            ArtifactsS3[S3: quickaid-artifacts<br/>Build artifacts]
        end
    end

    subgraph "Deploy Stage"
        subgraph "Frontend Deploy"
            S3Deploy[S3 Deploy<br/>quickaid-frontend bucket]
            CFInvalidation[CloudFront Invalidation<br/>/* after deploy]
        end

        subgraph "Backend Deploy"
            ASGUpdate[ASG Instance Refresh<br/>Rolling update<br/>One instance at a time]
            LaunchTemplate[Update Launch Template<br/>New Docker image tag]
            ScalingControl[Suspend/Resume<br/>Auto Scaling processes]
        end

        subgraph "Database Migrations"
            MigrationRun[Run Database Migrations<br/>EC2 executes migrations]
        end
    end

    subgraph "Post-Deploy"
        SmokeTests[Smoke Tests<br/>Health checks<br/>API endpoint tests]
        IntegTests[Integration Tests<br/>End-to-end scenarios]
        Notification[Slack/Email Notification<br/>Deploy success or failure]
    end

    subgraph "Approvals"
        ManualApproval[Manual Approval<br/>Required for production<br/>Approval before rolling update]
    end

    GitHub --> Webhook
    Webhook --> CFBuild
    Webhook --> CBBuild

    CFBuild --> CFSteps
    CBBuild --> CBSteps

    CFSteps --> S3Deploy
    CBSteps --> ECRBackend
    CBSteps --> ArtifactsS3

    S3Deploy --> CFInvalidation

    ECRBackend --> ManualApproval
    ManualApproval --> LaunchTemplate

    LaunchTemplate --> ASGUpdate
    ASGUpdate --> ScalingControl
    ASGUpdate --> MigrationRun

    CFInvalidation --> SmokeTests
    MigrationRun --> SmokeTests

    SmokeTests --> IntegTests
    IntegTests --> Notification

    style GitHub fill:#24292e,color:#fff
    style CodeBuild fill:#FF9900,color:#000
    style ECRBackend fill:#FF9900,color:#000
    style S3Deploy fill:#FF9900,color:#000
    style ASGUpdate fill:#FF9900,color:#000
```

---

## Infrastructure as Code

### CloudFormation Stack Structure

```mermaid
graph TB
    subgraph "QuickAid CloudFormation Stacks"
        subgraph "Layer 1: Foundation"
            VPCStack[quickaid-vpc<br/>Network foundation<br/>VPC, Subnets, IGW, NAT]
            DNSStack[quickaid-dns<br/>Route 53 hosted zone<br/>Domain configuration]
            ACMStack[quickaid-acm<br/>SSL/TLS certificates<br/>Certificate validation]
        end

        subgraph "Layer 2: Data & Caching"
            RDSStack[quickaid-rds<br/>PostgreSQL database<br/>Multi-AZ, encrypted]
            RedisStack[quickaid-redis<br/>ElastiCache Redis<br/>Replication group]
        end

        subgraph "Layer 3: Storage & Messaging"
            S3Stack[quickaid-s3<br/>S3 buckets<br/>Frontend, uploads, logs]
            SNSStack[quickaid-sns<br/>SNS topics<br/>SMS broadcasting]
            SQSStack[quickaid-sqs<br/>SQS queues<br/>SMS job queue]
        end

        subgraph "Layer 4: Compute"
            ECRStack[quickaid-ecr<br/>ECR repositories<br/>Docker image storage]
            LaunchTemplateStack[quickaid-launch-template<br/>EC2 launch template<br/>Docker configuration]
            ASGStack[quickaid-asg<br/>Auto Scaling Group<br/>EC2 instances]
            ALBStack[quickaid-alb<br/>Application Load Balancer<br/>Target groups]
        end

        subgraph "Layer 5: Edge & Security"
            CloudFrontStack[quickaid-cloudfront<br/>CloudFront distribution<br/>OAC, cache policies]
            WAFStack[quickaid-waf<br/>Web Application Firewall<br/>Security rules]
            SecretsStack[quickaid-secrets<br/>Secrets Manager<br/>Database credentials]
            IAMStack[quickaid-iam<br/>IAM roles & policies<br/>Least privilege]
        end

        subgraph "Layer 6: Monitoring"
            CloudWatchStack[quickaid-cloudwatch<br/>Log groups, metrics<br/>Alarms, dashboards]
            XRayStack[quickaid-xray<br/>AWS X-Ray<br/>Distributed tracing]
            ConfigStack[quickaid-config<br/>AWS Config<br/>Compliance rules]
        end
    end

    VPCStack --> RDSStack
    VPCStack --> RedisStack
    VPCStack --> ASGStack
    VPCStack --> ALBStack

    RDSStack --> SecretsStack
    RedisStack --> SecretsStack

    SNSStack --> SQSStack
    SQSStack --> ASGStack

    ECRStack --> LaunchTemplateStack
    LaunchTemplateStack --> ASGStack

    ASGStack --> ALBStack

    ACMStack --> CloudFrontStack
    S3Stack --> CloudFrontStack

    WAFStack --> CloudFrontStack

    IAMStack --> ASGStack
    IAMStack --> SecretsStack

    ASGStack --> CloudWatchStack
    ALBStack --> CloudWatchStack
    CloudFrontStack --> CloudWatchStack

    ASGStack --> XRayStack

    style VPCStack fill:#FF9900,color:#000
    style RDSStack fill:#FF9900,color:#000
    style ASGStack fill:#FF9900,color:#000
    style CloudFrontStack fill:#FF9900,color:#000
    style IAMStack fill:#FF9900,color:#000
    style CloudWatchStack fill:#FF9900,color:#000
```

---

## Cost Estimation

### Monthly Cost Breakdown

| Service | Configuration | Usage | Monthly Cost (USD) |
|---------|-------------|-------|---------------------|
| **Compute** | | | |
| EC2 (t3.large) | 4 instances × 2 vCPU, 8 GB RAM | 730 hours | $196.00 (reserved) |
| ALB | 1 ALB, 2 AZs, LCU hours | ~850 LCU hours | $35.00 |
| **Database & Cache** | | | |
| RDS PostgreSQL | db.r6g.large, 100GB GP3, Multi-AZ | 730 hours | $350.00 |
| ElastiCache Redis | cache.r6g.large, Multi-AZ | 730 hours | $210.00 |
| **Storage & CDN** | | | |
| S3 (Frontend) | 10GB storage | Static | $0.23 |
| S3 (Uploads) | 100GB storage, 500GB transfer | Growing | $22.50 |
| CloudFront | 2TB transfer, 10M requests | API-heavy | $240.00 |
| **Messaging** | | | |
| SNS SMS | 50,000 SMS/month (SG) | Broadcasts | $1,500.00 |
| SQS | 100K requests, DLQ | SMS queue | $0.40 |
| **Monitoring & Security** | | | |
| CloudWatch Logs | 50GB ingestion, 100GB archiving | Logging | $150.00 |
| CloudWatch Metrics | Custom metrics + dashboards | 50 metrics | $20.00 |
| AWS WAF | Web ACL + rules | Basic rules | $30.00 |
| Secrets Manager | 10 secrets | DB rotation | $0.40 |
| Systems Manager | Instance management | EC2 instances | $0.00 (included) |
| **Other** | | | |
| Route 53 | 1 hosted zone, 50 queries | DNS | $0.50 |
| Data Transfer | Inter-AZ, public | ~200GB | $20.00 |
| **Total** | | | **~$2,775.03** |

### Cost Comparison: EC2 vs ECS Fargate

| Component | EC2 (Reserved) | ECS Fargate | Savings |
|-----------|----------------|-------------|---------|
| Compute | $196/month | $219/month | **11%** |
| Overall | $2,775/month | $2,821/month | **1.6%** |

### Cost Optimization Recommendations

1. **EC2 Reserved Instances**: 30-60% savings for 24/7 workloads
2. **S3 Storage**: Use lifecycle policies for old uploads (IA → Glacier)
3. **CloudFront**: Enable cache optimization for static assets
4. **RDS**: Use read replicas for reporting queries
5. **Auto Scaling**: Scale down during off-peak hours (scheduled scaling)
6. **SMS**: Use push notifications for opted-in mobile app users
7. **CloudWatch Logs**: Reduce log retention to 14 days for non-critical logs

---

## Disaster Recovery

### Backup Strategy

```mermaid
graph TB
    subgraph "Backup Strategy"
        subgraph "Automated Backups"
            RDSBackup[RDS Automated Backups<br/>Window: 03:00-04:00 UTC<br/>Retention: 7 days<br/>Point-in-time recovery: 35 days]
            Snapshot[RDS Manual Snapshots<br/>Before deployments<br/>Weekly<br/>Retention: 30 days]
            AMIBackup[EC2 AMI Backups<br/>Weekly automated<br/>Retention: 4 weeks]
        end

        subgraph "S3 Versioning"
            S3Version[S3 Object Versioning<br/>All buckets<br/>Enable for rollback]
            S3Lifecycle[S3 Lifecycle Policies<br/>30-day delete for logs<br/>IA transition after 90 days]
        end

        subgraph "ECR Images"
            ECRVersions[ECR Image Tags<br/>Keep last 20 versions<br/>Tag with commit SHA]
        end
    end

    subgraph "Recovery Objectives"
        RTO[RTO: 1 hour<br/>Recovery Time Objective]
        RPO[RPO: 5 minutes<br/>Recovery Point Objective]
    end

    RDSBackup --> RPO
    Snapshot --> RTO
    S3Version --> RTO
    ECRVersions --> RTO
    AMIBackup --> RTO

    style RDSBackup fill:#22c55e,color:#000
    style Snapshot fill:#22c55e,color:#000
    style RTO fill:#FF9900,color:#000
    style RPO fill:#FF9900,color:#000
```

### Disaster Recovery Plan

| Scenario | Impact | Recovery Steps | Estimated Time |
|----------|--------|----------------|----------------|
| **Single EC2 Failure** | Minimal | ASG auto-replaces instance | < 5 min |
| **Single AZ Failure** | Medium | ASG launches instances in remaining AZ | < 10 min |
| **RDS Primary Failure** | Medium | RDS automatic failover | < 60 sec |
| **All EC2 Instances Down** | High | Restore from AMI, launch new instances | 30-60 min |
| **Region Outage** | Critical | Activate DR in ap-southeast-2 | 2-4 hours |
| **Data Corruption** | High | Point-in-time recovery to 5 min ago | 30-60 min |
| **Security Incident** | High | Isolate, investigate, restore from snapshot | 2-8 hours |

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Tasks:**
- [ ] Set up AWS account and organizational structure
- [ ] Create VPC, subnets, security groups, NACLs
- [ ] Set up Route 53 hosted zone and acquire domain
- [ ] Request and validate ACM SSL certificate
- [ ] Configure IAM roles and instance profiles
- [ ] Set up AWS Config and CloudTrail

**Deliverables:**
- VPC with public/private subnets across 2 AZs
- Route 53 configured with domain
- SSL certificate issued and validated
- IAM infrastructure ready

---

### Phase 2: Database & Cache (Week 3)

**Tasks:**
- [ ] Deploy RDS PostgreSQL cluster (Multi-AZ)
- [ ] Configure parameter groups and security
- [ ] Set up database migrations
- [ ] Deploy ElastiCache Redis cluster
- [ ] Configure Redis security groups
- [ ] Test database and cache connectivity

**Deliverables:**
- RDS PostgreSQL Multi-AZ deployment
- ElastiCache Redis with replication
- Database migrated with all tables
- Connection testing successful

---

### Phase 3: Storage & Messaging (Week 4)

**Tasks:**
- [ ] Create S3 buckets (frontend, uploads, logs)
- [ ] Configure bucket policies and lifecycle rules
- [ ] Set up SNS topics for SMS broadcasting
- [ ] Create SQS queues for SMS jobs
- [ ] Configure SNS topic policies and subscriptions
- [ ] Test SMS delivery flow

**Deliverables:**
- S3 buckets with proper policies
- SNS topics for broadcasts and alerts
- SQS queue for SMS jobs
- SMS delivery verified

---

### Phase 4: Compute Infrastructure (Week 5-6)

**Tasks:**
- [ ] Set up ECR repositories
- [ ] Dockerize backend services
- [ ] Create EC2 launch template with user data
- [ ] Configure Auto Scaling Group (min: 4, max: 8)
- [ ] Set up lifecycle hooks
- [ ] Deploy Application Load Balancer
- [ ] Configure target groups (backend, SSE)
- [ ] Test EC2 instance bootstrap
- [ ] Test Docker Compose startup

**Deliverables:**
- ECR repositories configured
- Docker images built and pushed
- EC2 launch template with user data
- Auto Scaling Group with 4 instances
- ALB routing configured

---

### Phase 5: Frontend Deployment (Week 7)

**Tasks:**
- [ ] Build and deploy frontend to S3
- [ ] Configure CloudFront distribution
- [ ] Set up Origin Access Control (OAC)
- [ ] Configure cache policies and behaviors
- [ ] Set up AWS WAF rules
- [ ] Test CloudFront caching and invalidation

**Deliverables:**
- Frontend deployed to S3
- CloudFront distribution active
- WAF rules configured
- CDN caching verified

---

### Phase 6: SMS Integration (Week 8)

**Tasks:**
- [ ] Implement SMS service in worker container
- [ ] Configure SNS sender ID and settings
- [ ] Implement recipient filtering logic
- [ ] Set up SMS delivery logging
- [ ] Configure CloudWatch metrics for SMS
- [ ] End-to-end SMS broadcasting test

**Deliverables:**
- SMS worker service deployed
- SMS delivery tracking implemented
- CloudWatch SMS metrics configured
- Broadcast system fully functional

---

### Phase 7: Monitoring & Security (Week 9)

**Tasks:**
- [ ] Configure CloudWatch log groups
- [ ] Set up CloudWatch dashboards
- [ ] Create CloudWatch alarms (CPU, memory, SSE, SMS)
- [ ] Enable AWS X-Ray tracing
- [ ] Configure Secrets Manager
- [ ] Rotate database credentials
- [ ] Set up AWS GuardDuty
- [ ] Configure Systems Manager for SSH access
- [ ] Security audit and penetration test

**Deliverables:**
- Comprehensive monitoring dashboard
- Alarms configured for all critical metrics
- X-Ray tracing enabled
- Secrets Manager operational
- SSH access via Systems Manager

---

### Phase 8: CI/CD Pipeline (Week 10)

**Tasks:**
- [ ] Set up CodePipeline
- [ ] Configure CodeBuild projects
- [ ] Set up automated testing
- [ ] Configure rolling update (instance refresh)
- [ ] Set up rollback mechanism
- [ ] Configure Slack/email notifications
- [ ] End-to-end deployment test
- [ ] Test graceful SSE connection draining

**Deliverables:**
- CodePipeline configured
- Automated builds and tests
- Rolling update working
- Rollback mechanism tested
- SSE connections drain gracefully

---

### Phase 9: Testing & Launch (Week 11-12)

**Tasks:**
- [ ] Load testing (incident creation, SSE, SMS)
- [ ] Performance optimization
- [ ] Security hardening review
- [ ] Disaster recovery testing
- [ ] User acceptance testing
- [ ] Documentation finalization
- [ ] Production cutover
- [ ] Go-live support

**Deliverables:**
- Load test results (target: 10K concurrent users)
- Performance optimization completed
- Security audit passed
- DR plan tested
- User documentation complete
- Production deployment successful

---

## Appendix

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@quickaid-db.XXXXX.ap-southeast-1.rds.amazonaws.com:5432/quickaid
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://quickaid-redis.XXXXX.ng.0001.apse1.cache.amazonaws.com:6379

# JWT
JWT_SECRET=来自Secrets Manager
JWT_REFRESH_SECRET=来自Secrets Manager
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# AI
GEMINI_API_KEY=来自Secrets Manager

# SMS
SNS_TOPIC_ARN=arn:aws:sns:ap-southeast-1:123456789012:quickaid-broadcasts.fifo
SMS_SENDER_ID=QUICKAID

# Application
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://quickaid.gov.sg

# EC2
EC2_INSTANCE_ID=来自Metadata服务
AWS_REGION=ap-southeast-1

# SQS
SQS_QUEUE_URL=https://sqs.ap-southeast-1.amazonaws.com/123456789012/quickaid-sms-jobs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### API Endpoints Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | None | Create new user |
| `/api/auth/login` | POST | None | User login |
| `/api/auth/refresh` | POST | Cookie | Refresh access token |
| `/api/auth/logout` | POST | Cookie | User logout |
| `/api/auth/me` | GET | JWT | Get current user |
| `/api/incidents` | GET | JWT | List incidents (paginated, filtered) |
| `/api/incidents` | POST | JWT | Create incident |
| `/api/incidents/:id` | GET | JWT | Get incident details |
| `/api/incidents/:id` | PATCH | JWT | Update incident |
| `/api/incidents/:id/approve` | PATCH | JWT | Approve AI triage option |
| `/api/incidents/:id/status` | PATCH | JWT | Update incident status |
| `/api/tickets/:id/updates` | POST | JWT | Add timeline note |
| `/api/resources/hospitals` | GET | JWT | List hospitals |
| `/api/resources/hospitals/:id` | PATCH | JWT | Update hospital data |
| `/api/resources/volunteers` | GET | JWT | List volunteers |
| `/api/volunteers` | POST | JWT | Create volunteer registration |
| `/api/broadcasts` | GET | Optional JWT | List broadcasts |
| `/api/broadcasts` | POST | JWT | Create broadcast (gov_admin only) |
| `/api/ai/triage` | POST | JWT | Stream AI triage analysis |
| `/api/sse` | GET | JWT | SSE connection for authenticated users |
| `/api/sse/public` | GET | None | SSE connection for public broadcasts |
| `/health` | GET | None | Health check endpoint |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-05-19 | QuickAid Team | Initial AWS architecture with EC2 Auto Scaling Group |