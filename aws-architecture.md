# QuickAid AWS Architecture

## Overview

This document describes the AWS-native architecture for the QuickAid emergency response platform. The architecture uses AWS services exclusively for all components including network, compute, storage, notifications, and monitoring.

```mermaid
graph TB
    subgraph "User Access"
        Browser[User Browser]
        Mobile[Mobile Device]
    end

    subgraph "AWS Network Layer - VPC"
        VPC[AWS VPC]
        PublicSubnet[Public Subnets]
        PrivateSubnet[Private Subnets]
        SecurityGroup[Security Groups]
        NACL[Network ACLs]
    end

    subgraph "AWS Edge & CDN"
        CloudFront[CloudFront CDN]
        Route53[Route 53 DNS]
        ACM[Certificate Manager]
    end

    subgraph "Frontend Hosting"
        S3[S3 Static Website]
        OAI[OAI for S3 Access]
    end

    subgraph "Backend Compute"
        ALB[Application Load Balancer]
        ECS[ECS Fargate Cluster]
        ECSService[Express Backend Service]
        SSEService[SSE Service Container]
        TaskDef[Task Definition]
    end

    subgraph "Database Layer - Private"
        RDS[RDS PostgreSQL]
        MultiAZ[Multi-AZ Deployment]
        ReadReplica[Read Replica]
        ParameterGroup[Parameter Group]
    end

    subgraph "Caching Layer"
        ElastiCache[ElastiCache Redis]
        RedisCluster[Redis Cluster Mode]
    end

    subgraph "SMS & Notifications"
        SNS[Amazon SNS]
        SNSTopic[SNS Topics]
        SMS[SMS Delivery]
        Email[Email Delivery]
    end

    subgraph "File Storage"
        S3Bucket[S3 Bucket - Uploads]
        CloudFrontS3[CloudFront OAI for Uploads]
    end

    subgraph "Monitoring & Observability"
        CloudWatch[CloudWatch Logs]
        CloudWatchMetrics[CloudWatch Metrics]
        XRay[AWS X-Ray]
        Alarms[CloudWatch Alarms]
    end

    subgraph "Security & IAM"
        SecretsManager[Secrets Manager]
        IAM[IAM Roles & Policies]
        WAF[Web Application Firewall]
    end

    subgraph "External Services"
        Gemini[Google Gemini AI]
        OSM[OpenStreetMap]
    end

    Browser --> Route53
    Route53 --> ACM
    ACM --> CloudFront
    CloudFront --> S3
    CloudFront --> ALB
    Mobile --> CloudFront

    VPC --> PublicSubnet
    VPC --> PrivateSubnet
    PublicSubnet --> SecurityGroup
    PrivateSubnet --> SecurityGroup

    CloudFront --> WAF
    WAF --> ALB
    ALB --> ECS
    ECS --> ECSService
    ECS --> SSEService
    ECSService --> TaskDef

    ECS --> RDS
    RDS --> MultiAZ
    RDS --> ReadReplica
    RDS --> ParameterGroup

    ECS --> ElastiCache
    ElastiCache --> RedisCluster

    ECS --> SNS
    SNS --> SNSTopic
    SNSTopic --> SMS
    SNSTopic --> Email

    ECS --> S3Bucket
    S3Bucket --> CloudFrontS3

    ECS --> CloudWatch
    ECS --> CloudWatchMetrics
    ECS --> X-Ray
    CloudWatchMetrics --> Alarms

    ECS --> SecretsManager
    ECS --> IAM
    ECSService --> Gemini
    S3 --> OSM

    style CloudFront fill:#FF9900,color:#000
    style ECS fill:#FF9900,color:#000
    style RDS fill:#FF9900,color:#000
    style SNS fill:#FF9900,color:#000
    style S3 fill:#FF9900,color:#000
    style ElastiCache fill:#FF9900,color:#000
    style CloudWatch fill:#FF9900,color:#000
    style Route53 fill:#FF9900,color:#000
```

---

## Network Architecture

### VPC Design

```mermaid
graph TB
    subgraph "VPC - 10.0.0.0/16"
        subgraph "Public Subnets"
            PubSub1[Public Subnet 1A<br/>10.0.1.0/24]
            PubSub2[Public Subnet 2B<br/>10.0.2.0/24]
            IGW[Internet Gateway]
            NAT1[NAT Gateway 1A]
            NAT2[NAT Gateway 2B]
        end

        subgraph "Private Subnets"
            PriSub1[Private Subnet 1A<br/>10.0.11.0/24]
            PriSub2[Private Subnet 2B<br/>10.0.12.0/24]
        end

        subgraph "Database Subnets - Isolated"
            DBSub1[DB Subnet 1A<br/>10.0.21.0/24]
            DBSub2[DB Subnet 2B<br/>10.0.22.0/24]
        end
    end

    style VPC fill:#3b82f6,color:#fff
    style IGW fill:#22c55e,color:#000
    style NAT1 fill:#eab308,color:#000
    style NAT2 fill:#eab308,color:#000
```

**Components Description:**

| Component | CIDR | Purpose |
|-----------|------|---------|
| VPC | 10.0.0.0/16 | Primary network isolation boundary |
| Public Subnets | 10.0.1.0/24, 10.0.2.0/24 | ALB, NAT Gateways, Bastion Host |
| Private Subnets | 10.0.11.0/24, 10.0.12.0/24 | ECS Tasks, ElastiCache |
| Database Subnets | 10.0.21.0/24, 10.0.22.0/24 | RDS PostgreSQL (no internet access) |
| Internet Gateway | - | Public internet access for public subnets |
| NAT Gateways | - | Outbound internet access for private resources |

**Security Groups:**

```mermaid
graph TB
    subgraph "Security Groups Configuration"
        ALBSG[ALB Security Group<br/>Port 80/443 from 0.0.0.0/0]
        ECSSG[ECS Tasks SG<br/>Port 3000 from ALB SG]
        RDSSG[RDS Security Group<br/>Port 5432 from ECS SG]
        RedisSG[ElastiCache SG<br/>Port 6379 from ECS SG]
        SNSSG[SNS Integration<br/>HTTPS to SNS endpoints]
        GeminiSG[Outbound HTTPS<br/>To Gemini API]
    end

    ALBSG --> ECSSG
    ECSSG --> RDSSG
    ECSSG --> RedisSG
    ECSSG --> SNSSG
    ECSSG --> GeminiSG

    style ALBSG fill:#ef4444,color:#fff
    style ECSSG fill:#22c55e,color:#fff
    style RDSSG fill:#3b82f6,color:#fff
    style RedisSG fill:#eab308,color:#fff
```

---

## Compute Architecture

### ECS Fargate Deployment

```mermaid
graph TB
    subgraph "ECS Cluster: quickaid-cluster"
        subgraph "Backend Service: quickaid-backend"
            TaskDef1[Task Definition<br/>CPU: 1024 units<br/>Memory: 2GB<br/>Image: ECR]
            Container1[Express App Container]
            PortMap1[Port: 3000<br/>Health Check: /health]
            AutoScale1[Auto Scaling<br/>Min: 2, Max: 10]
        end

        subgraph "SSE Service: quickaid-sse"
            TaskDef2[Task Definition<br/>CPU: 512 units<br/>Memory: 1GB<br/>Image: ECR]
            Container2[SSE Server Container]
            PortMap2[Port: 3001<br/>Health Check: /sse/health]
            AutoScale2[Auto Scaling<br/>Min: 2, Max: 5]
        end

        subgraph "Worker Service: quickaid-worker"
            TaskDef3[Task Definition<br/>CPU: 256 units<br/>Memory: 512MB]
            Container3[Background Workers]
            SQS[Queue Consumer]
        end
    end

    subgraph "Load Balancing"
        ALB[Application Load Balancer]
        TG1[Target Group: Backend<br/>Port 3000]
        TG2[Target Group: SSE<br/>Port 3001]
        Listener[Listener: 443 HTTPS]
        Cert[ACM Certificate]
    end

    ALB --> Listener
    Listener --> Cert
    Listener --> TG1
    Listener --> TG2
    TG1 --> TaskDef1
    TG2 --> TaskDef2

    style TaskDef1 fill:#FF9900,color:#000
    style TaskDef2 fill:#FF9900,color:#000
    style ALB fill:#FF9900,color:#000
```

**Components Description:**

- **ECS Cluster**: Orchestration container for all services
- **Backend Service**: Express.js API server
- **SSE Service**: Dedicated service for Server-Sent Events (long-lived connections)
- **Worker Service**: Background processing for SMS queues, scheduled tasks
- **ALB**: Routes traffic to appropriate target groups based on path routing
- **Target Groups**: Group of ECS tasks for load distribution
- **Auto Scaling**: Automatically scales tasks based on CPU/memory metrics

---

## Storage Architecture

### Database Layer (RDS PostgreSQL)

```mermaid
graph TB
    subgraph "RDS PostgreSQL Configuration"
        subgraph "Primary DB Instance"
            Primary[Primary Instance<br/>db.r6g.large<br/>vCPU: 2<br/>Memory: 16GiB<br/>Storage: 100GB GP3]
            Endpoint[Writer Endpoint<br/>quickaid-db.XXXX.ap-southeast-1.rds.amazonaws.com]
        end

        subgraph "Standby DB Instance"
            Standby[Standby Instance<br/>db.r6g.large<br/>Same config as Primary]
            ReaderEndpoint[Reader Endpoint<br/>quickaid-db-ro.XXXX.ap-southeast-1.rds.amazonaws.com]
        end

        subgraph "Database Configuration"
            MultiAZ[Multi-AZ Deployment<br/>High Availability]
            Backups[Automated Backups<br/>Retention: 7 days<br/>Window: 03:00-04:00 UTC]
            Encryption[Encryption at Rest<br/>KMS Managed]
            Param[Parameter Group<br/>Connections: 200<br/>Shared Buffers: 4GB]
        end
    end

    Primary -.->|Synchronous Replication| Standby
    Primary --> Endpoint
    Standby --> ReaderEndpoint
    Primary --> MultiAZ
    Primary --> Backups
    Primary --> Encryption
    Primary --> Param

    style Primary fill:#FF9900,color:#000
    style Standby fill:#FF9900,color:#000
    style MultiAZ fill:#22c55e,color:#000
```

**Database Schema Tables:**

| Table | Description | Estimated Rows |
|-------|-------------|----------------|
| users | User accounts and authentication | 10,000 |
| incidents | Emergency incident reports | 100,000 |
| incidents_updates | Incident timeline entries | 500,000 |
| ai_triage_data | AI analysis results | 100,000 |
| hospitals | Hospital resource data | 500 |
| volunteers | Volunteer registrations | 5,000 |
| volunteer_tasks | Volunteer task listings | 2,000 |
| communities | Community organizations | 1,000 |
| broadcasts | Emergency broadcasts | 10,000 |
| broadcasts_audience | Broadcast recipient mapping | 1,000,000 |
| sms_logs | SMS delivery logs | 10,000,000 |

---

### Caching Layer (ElastiCache Redis)

```mermaid
graph TB
    subgraph "ElastiCache Redis Configuration"
        subgraph "Redis Cluster"
            PrimaryNode[Primary Node<br/>cache.r6g.large<br/>vCPU: 2<br/>Memory: 12.77GB]
            Replica1[Replica Node 1A<br/>cache.r6g.large]
            Replica2[Replica Node 2B<br/>cache.r6g.large]
        end

        subgraph "Redis Data Uses"
            SessionStore[User Sessions<br/>JWT Refresh Tokens<br/>TTL: 7 days]
            SSEConnections[SSE Connection Tracking<br/>Active Connections Map<br/>TTL: 5 min]
            APIResponseCache[API Response Cache<br/>Hospital Data<br/>TTL: 5 min]
            RateLimit[Rate Limiting<br/>API Rate Limits<br/>TTL: 1 min]
            BroadcastCache[Active Broadcasts<br/>Cached for Performance<br/>TTL: 1 hour]
        end
    end

    PrimaryNode -.->|Async Replication| Replica1
    PrimaryNode -.->|Async Replication| Replica2

    PrimaryNode --> SessionStore
    PrimaryNode --> SSEConnections
    PrimaryNode --> APIResponseCache
    PrimaryNode --> RateLimit
    PrimaryNode --> BroadcastCache

    style PrimaryNode fill:#FF9900,color:#000
    style Replica1 fill:#FF9900,color:#000
    style Replica2 fill:#FF9900,color:#000
```

**Components Description:**

- **Primary Node**: Handles write operations
- **Replica Nodes**: Handle read operations (read-after-write consistency acceptable)
- **Session Store**: Stores JWT refresh tokens, user session data
- **SSE Connections**: Tracks active SSE connections for targeted notifications
- **API Response Cache**: Caches frequently accessed data (hospitals, volunteers)
- **Rate Limiting**: Implements sliding window rate limiting
- **Broadcast Cache**: Caches active broadcasts for quick lookup

---

### S3 Storage

```mermaid
graph TB
    subgraph "S3 Buckets"
        subgraph "Bucket: quickaid-frontend"
            Bucket1[Static Frontend Assets<br/>Location: ap-southeast-1<br/>Access: Public via CloudFront OAI<br/>Versioning: Enabled]
            Content1[HTML, JS, CSS files]
            CloudFrontOAI[CloudFront OAI Access]
        end

        subgraph "Bucket: quickaid-uploads"
            Bucket2[User Uploads & Documents<br/>Location: ap-southeast-1<br/>Access: Private via Pre-signed URLs<br/>Versioning: Enabled<br/>Lifecycle: 90-day glacier transition]
            Content2[Incident photos<br/>Volunteer documents<br/>Broadcast attachments]
            StorageClass[Standard → IA → Glacier]
        end

        subgraph "Bucket: quickaid-logs"
            Bucket3[Application & Access Logs<br/>Location: ap-southeast-1<br/>Access: Private<br/>Lifecycle: 30-day delete]
            Content3[ALB Access Logs<br/>CloudFront Logs<br/>ECS Logs]
        end
    end

    Bucket1 --> Content1
    Bucket1 --> CloudFrontOAI
    Bucket2 --> Content2
    Bucket2 --> StorageClass
    Bucket3 --> Content3

    style Bucket1 fill:#FF9900,color:#000
    style Bucket2 fill:#FF9900,color:#000
    style Bucket3 fill:#FF9900,color:#000
```

---

## SMS & Notification Architecture

### Amazon SNS Integration

```mermaid
graph TB
    subgraph "SMS Notification System"
        subgraph "Topic Management"
            Topic1[SNS Topic: quickaid-broadcasts<br/>FIFO Topic for ordering]
            Topic2[SNS Topic: quickaid-incident-alerts<br/>Standard Topic]
            Topic3[SNS Topic: quickaid-volunteer-alerts<br/>Standard Topic]
        end

        subgraph "Subscription Management"
            SMS1[SMS Subscriptions<br/>Opted-in users only]
            Email1[Email Subscriptions<br/>Backup channel]
            Lambda1[Lambda Subscription<br/>Custom delivery logic]
            Push1[Push Notifications<br/>Mobile app]
        end

        subgraph "Message Processing"
            Queue[ SQS Queue: sms-queue<br/>Dead-letter Queue for failed messages]
            Worker[Worker Service Consumer<br/>Processes SMS queue]
            Template[SNS Message Templates<br/>Broadcast alert<br/>Incident update<br/>Volunteer request]
        end

        subgraph "Delivery Flow"
            Broadcast[Broadcast Created]
            Filtering[Audience Filtering<br/>By zone, role, preferences]
            Sending[SNS Send<br/>Bulk SMS delivery]
            Tracking[Delivery Tracking<br/>CloudWatch Metrics]
            Logging[Delivery Logging<br/>To RDS sms_logs table]
        end
    end

    Topic1 --> SMS1
    Topic1 --> Email1
    Topic1 --> Lambda1
    Topic1 --> Push1
    Topic2 --> SMS1
    Topic3 --> SMS1

    Broadcast --> Filtering
    Filtering --> Topic1
    Topic1 --> Queue
    Queue --> Worker
    Worker --> Template
    Template --> Sending
    Sending --> Tracking
    Tracking --> Logging

    style Topic1 fill:#FF9900,color:#000
    style Topic2 fill:#FF9900,color:#000
    style Topic3 fill:#FF9900,color:#000
    style Queue fill:#FF9900,color:#000
```

### SMS Broadcast Flow

```mermaid
sequenceDiagram
    participant G as Government Admin
    participant F as Frontend
    participant B as Backend API
    participant Q as SQS Queue
    participant W as Worker Service
    participant S as SNS
    participant DB as RDS
    participant U as User

    G->>F: Create Broadcast
    F->>B: POST /api/broadcasts
    B->>DB: Save broadcast record
    DB-->>B: Broadcast created
    B->>Q: Send message to sms-queue
    B-->>F: Broadcast queued
    F-->>G: Show confirmation

    Note over W: Worker polls queue
    W->>Q: Receive message
    W->>DB: Query eligible recipients
    DB-->>W: Recipient list (phone numbers)
    W->>W: Batch recipients (max 1000/batch)
    W->>S: Publish batch to SNS topic
    S->>U: Send SMS to each recipient
    W->>DB: Log delivery status
    W->>Q: Delete processed message

    Note over S: Delivery tracking
    S->>S: Track delivery
    S->>S: Update CloudWatch metrics
```

**SMS Configuration Details:**

| Setting | Value |
|---------|-------|
| Region | ap-southeast-1 (Singapore) |
| Sender ID | QUICKAID |
| Default SMS Type | Transactional |
| Delivery Status Logging | Enabled |
| Monthly Spend Limit | $1,000 (configurable) |
| Opt-out Keyword | STOP |
| Rate Limit | 5 SMS/second per account |

**SNS Topic Policy Example:**

```json
{
  "Version": "2008-10-17",
  "Id": "__default_policy_ID",
  "Statement": [
    {
      "Sid": "__default_statement_ID",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/quickaid-ecs-task-role"
      },
      "Action": "SNS:Publish",
      "Resource": "arn:aws:sns:ap-southeast-1:123456789012:quickaid-broadcasts"
    }
  ]
}
```

---

## Frontend Hosting Architecture

### CloudFront + S3 Deployment

```mermaid
graph TB
    subgraph "Global Edge Network"
        CFEdge[CloudFront Edge Locations<br/>400+ PoPs globally]
    end

    subgraph "Route 53"
        DNS[Domain: quickaid.gov.sg]
        Alias[Alias Record → CloudFront]
    end

    subgraph "CloudFront Distribution"
        Origin1[Origin 1: S3 Bucket<br/>quickaid-frontend]
        Origin2[Origin 2: ALB<br/>quickaid-alb-1234.elb.amazonaws.com]
        CachePolicy[Cache Policy<br/>Static: TTL 1 day<br/>API: No-cache]
        OriginAccessControl[OAC for S3]
        Behaviors1[Path Pattern: /*<br/>Origin: S3<br/>Cache: Static]
        Behaviors2[Path Pattern: /api/*<br/>Origin: ALB<br/>Cache: None]
        WAFConfig[WAF Web ACL<br/>Rate limiting<br/>SQLi protection]
        SSL[SSL/TLS<br/>ACM Certificate]
    end

    subgraph "S3 Bucket"
        Bucket[quickaid-frontend.s3.ap-southeast-1.amazonaws.com]
        StaticFiles[React Build Output<br/>index.html, *.js, *.css]
        Versioning[Object Versioning<br/>For rollback capability]
        CloudFrontOriginAccess[Only accessible<br/>via CloudFront OAC]
    end

    User[User Browser] --> DNS
    DNS --> Alias
    Alias --> CFEdge
    CFEdge --> CloudFront
    CloudFront --> SSL
    CloudFront --> WAFConfig
    CloudFront --> Behaviors1
    CloudFront --> Behaviors2
    Behaviors1 --> CachePolicy
    Behaviors2 --> CachePolicy
    Behaviors1 --> OriginAccessControl
    Behaviors2 --> Origin2
    OriginAccessControl --> Origin1
    Origin1 --> Bucket
    Bucket --> StaticFiles
    Bucket --> Versioning
    Bucket --> CloudFrontOriginAccess

    style CloudFront fill:#FF9900,color:#000
    style S3 fill:#FF9900,color:#000
    style Route53 fill:#FF9900,color:#000
```

**Components Description:**

- **CloudFront**: Global CDN for low-latency content delivery
- **Route 53**: DNS management and alias records
- **S3 Bucket**: Stores static frontend assets (React build output)
- **OAC (Origin Access Control)**: Restricts S3 bucket access to CloudFront only
- **ALB Origin**: Forward API requests to backend
- **WAF**: Web Application Firewall for protection against attacks
- **SSL/TLS**: ACM-managed certificates for HTTPS
- **Cache Policies**: Optimized caching for static and dynamic content

---

## Security Architecture

### IAM & Security Layers

```mermaid
graph TB
    subgraph "IAM Configuration"
        TaskRole[ECS Task Role<br/>quickaid-ecs-task-role]
        ExecutionRole[ECS Task Execution Role<br/>quickaid-ecs-execution-role]
        WorkerRole[Worker Service Role<br/>quickaid-worker-role]
        LambdaRole[Lambda Execution Role<br/>quickaid-lambda-role]
    end

    subgraph "Security Services"
        SecretsManager[Secrets Manager<br/>DB credentials<br/>API keys<br/>JWT secrets]
        ParameterStore[Parameter Store<br/>Configuration<br/>Environment variables]
        WAF[Web Application Firewall<br/>SQL injection protection<br/>XSS protection<br/>Rate limiting]
        Shield[AWS Shield Standard<br/>DDoS protection]
    end

    subgraph "Encryption"
        KMS[KMS Key Management<br/>Customer Managed CMK<br/>RDS encryption<br/>EBS encryption]
        S3Encryption[S3 Server-Side Encryption<br/>SSE-KMS]
        EBS[EBS Volume Encryption<br/>At-rest encryption]
    end

    subgraph "Compliance"
        Config[AWS Config<br/>Compliance monitoring<br/>Resource tracking]
        AuditTrail[CloudTrail<br/>API activity logging<br/>Audit trail]
        GuardDuty[GuardDuty<br/>Threat detection<br/>Anomaly detection]
    end

    TaskRole --> SecretsManager
    TaskRole --> ParameterStore
    TaskRole --> SNS[Amazon SNS]
    TaskRole --> SQS[Amazon SQS]
    TaskRole --> CloudWatch[CloudWatch Logs]

    SecretsManager --> KMS
    S3Encryption --> KMS
    EBS --> KMS

    WAF --> Shield
    AuditTrail --> Config
    GuardDuty --> AuditTrail

    style SecretsManager fill:#FF9900,color:#000
    style WAF fill:#FF9900,color:#000
    style KMS fill:#FF9900,color:#000
    style CloudTrail fill:#FF9900,color:#000
```

**IAM Role Policies:**

```json
// ECS Task Role Permissions
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:quickaid-db-*",
        "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:quickaid-jwt-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:ap-southeast-1:123456789012:parameter/quickaid/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish",
        "sns:CreateTopic",
        "sns:Subscribe"
      ],
      "Resource": "arn:aws:sns:ap-southeast-1:123456789012:quickaid-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:ap-southeast-1:123456789012:quickaid-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticache:Connect"
      ],
      "Resource": "arn:aws:elasticache:ap-southeast-1:123456789012:cluster:quickaid-redis"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::quickaid-uploads/*"
    }
  ]
}
```

---

## Monitoring & Observability Architecture

### CloudWatch Integration

```mermaid
graph TB
    subgraph "Logging"
        ECSLogs[ECS Task Logs<br/>/aws/ecs/quickaid-backend]
        SSELogs[SSE Service Logs<br/>/aws/ecs/quickaid-sse]
        WorkerLogs[Worker Service Logs<br/>/aws/ecs/quickaid-worker]
        ALBLogs[ALB Access Logs<br/>/aws/elasticloadbalancing/quickaid-alb]
        CFLogs[CloudFront Access Logs<br/>quickaid-cloudfront-logs]
    end

    subgraph "Metrics Collection"
        CPUMetrics[CPU Utilization<br/>ECS Tasks]
        MemMetrics[Memory Utilization<br/>ECS Tasks]
        DBMetrics[RDS Metrics<br/>Connections, Latency]
        CacheMetrics[Redis Metrics<br/>Hits, Evictions]
        APIMetrics[API Metrics<br/>Latency, Error Rate]
        SMSMetrics[SNS Metrics<br/>Delivery Rate, Bounces]
    end

    subgraph "Alarms"
        HighCPU[CPU > 80% for 5 min]
        HighMemory[Memory > 85% for 5 min]
        DBConnections[DB Connections > 180]
        APIErrors[API Error Rate > 5%]
        SMSBounce[SMS Bounce Rate > 10%]
        HealthCheck[Health Check Failed]
    end

    subgraph "Dashboards"
        MainDash[QuickAid Main Dashboard<br/>Overall health metrics]
        APIDash[API Performance Dashboard<br/>Latency, throughput, errors]
        DBDash[Database Health Dashboard<br/>Connections, queries, locks]
        SMSDash[SMS Delivery Dashboard<br/>Delivery rate, cost tracking]
    end

    subgraph "Tracing"
        XRay[AWS X-Ray<br/>Distributed tracing]
        Segments[Service Map<br/>Request flow visualization]
    end

    ECSLogs --> CloudWatchLogs[CloudWatch Logs]
    SSELogs --> CloudWatchLogs
    WorkerLogs --> CloudWatchLogs
    ALBLogs --> CloudWatchLogs
    CFLogs --> S3LogsBucket[S3: quickaid-logs]

    CPUMetrics --> CloudWatchMetrics[CloudWatch Metrics]
    MemMetrics --> CloudWatchMetrics
    DBMetrics --> CloudWatchMetrics
    CacheMetrics --> CloudWatchMetrics
    APIMetrics --> CloudWatchMetrics
    SMSMetrics --> CloudWatchMetrics

    CloudWatchMetrics --> HighCPU
    CloudWatchMetrics --> HighMemory
    CloudWatchMetrics --> DBConnections
    CloudWatchMetrics --> APIErrors
    CloudWatchMetrics --> SMSBounce

    CloudWatchMetrics --> MainDash
    CloudWatchMetrics --> APIDash
    CloudWatchMetrics --> DBDash
    CloudWatchMetrics --> SMSDash

    XRay --> Segments

    style CloudWatchLogs fill:#FF9900,color:#000
    style CloudWatchMetrics fill:#FF9900,color:#000
    style XRay fill:#FF9900,color:#000
```

**Key Metrics to Monitor:**

| Metric | Threshold | Alarm Action |
|--------|-----------|--------------|
| ECS CPU Utilization | >80% for 5 min | Scale up ECS tasks |
| ECS Memory Utilization | >85% for 5 min | Scale up ECS tasks |
| RDS Freeable Memory | <2GB | Notify DBA |
| RDS Connection Usage | >90% | Scale RDS or optimize connections |
| API 4XX Rate | >5% | Investigate client errors |
| API 5XX Rate | >1% | Investigate server errors |
| SMS Delivery Rate | <90% | Investigate delivery issues |
| SMS Bounce Rate | >10% | Review phone list |
| ALB 5XX Errors | >1% | Investigate backend health |

---

## Complete Data Flow

### Incident Reporting Flow with AWS

```mermaid
sequenceDiagram
    participant U as User Browser
    participant CF as CloudFront
    participant ALB as Application LB
    participant BE as Express Backend
    participant Redis as ElastiCache
    participant DB as RDS PostgreSQL
    participant SNS as Amazon SNS
    participant SMS as SMS Delivery
    participant SSE as SSE Service
    participant AI as Gemini AI

    U->>CF: HTTPS Request
    CF->>ALB: Forward /api request
    ALB->>BE: Route to backend

    BE->>Redis: Check rate limit
    Redis-->>BE: Rate limit OK

    BE->>BE: Validate JWT token
    BE->>DB: Create incident record
    DB-->>BE: Incident ID created
    BE->>DB: Create timeline entry
    DB-->>BE: Timeline entry created

    BE->>Redis: Cache incident data
    BE->>CloudWatch: Log incident creation
    BE-->>ALB: Return incident response
    ALB-->>CF: Return response
    CF-->>U: Show ticket number

    Note over SNS: SMS Notification to Responders
    BE->>SNS: Publish incident alert
    SNS->>SMS: Send SMS to responders
    SMS-->>U: SMS received

    Note over BE: AI Triage Request
    U->>CF: Request AI triage
    CF->>ALB: Forward request
    ALB->>SSE: Connect to SSE service

    BE->>DB: Fetch incident context
    DB-->>BE: Context data
    BE->>AI: Send triage request
    AI-->>BE: Stream AI analysis
    BE->>SSE: Push via SSE
    SSE-->>CF: Stream to client
    CF-->>U: Display AI recommendations
```

### SMS Broadcast Flow

```mermaid
sequenceDiagram
    participant Admin as Government Admin
    participant CF as CloudFront
    participant BE as Express Backend
    participant SQS as SQS Queue
    participant Worker as Worker Service
    participant SNS as Amazon SNS
    participant SMS as SMS Delivery
    participant Users as Users
    participant CW as CloudWatch
    participant DB as RDS

    Admin->>CF: Create broadcast
    CF->>BE: POST /api/broadcasts
    BE->>DB: Save broadcast record
    DB-->>BE: Broadcast ID created
    BE->>CW: Log broadcast creation
    BE->>SQS: Enqueue broadcast job
    BE-->>Admin: Broadcast queued

    Note over Worker: Worker processes queue
    Worker->>SQS: Poll for messages
    SQS-->>Worker: Broadcast job
    Worker->>DB: Query eligible recipients
    DB-->>Worker: Recipient list

    loop Batch Processing (1000/batch)
        Worker->>SNS: Publish batch to topic
        SNS->>SMS: Send SMS to batch
        SMS-->>Users: SMS delivered
    end

    Worker->>DB: Update delivery status
    Worker->>CW: Log delivery metrics
    Worker->>SQS: Delete processed message
    CW-->>Admin: Delivery report
```

---

## Deployment Architecture

### CI/CD with AWS CodePipeline

```mermaid
graph TB
    subgraph "Source Control"
        GitHub[GitHub Repository<br/>quickaid/quickaid-platform]
        MainBranch[Main Branch]
        PRBranch[Pull Request Branches]
    end

    subgraph "Build Pipeline"
        CodeBuildFrontend[CodeBuild: Frontend<br/>npm run build<br/>Docker build]
        CodeBuildBackend[CodeBuild: Backend<br/>npm run build<br/>Docker build]
        CodeBuildWorker[CodeBuild: Worker<br/>npm run build<br/>Docker build]
    end

    subgraph "Artifact Storage"
        ArtifactBucket[S3: quickaid-artifacts<br/>Build artifacts]
        ECRFrontend[ECR: quickaid-frontend<br/>Frontend images]
        ECRBackend[ECR: quickaid-backend<br/>Backend images]
        ECRWorker[ECR: quickaid-worker<br/>Worker images]
    end

    subgraph "Deployment"
        CodeDeployFrontend[Deploy to S3<br/>CloudFront Invalidation]
        CodeDeployBackend[ECS Service Update<br/>Blue/Green Deployment]
        CodeDeployWorker[ECS Service Update<br/>Rolling Update]
    end

    subgraph "Post-Deployment"
        SmokeTests[Smoke Tests<br/>Health checks]
        DBMigrations[Database Migrations<br/>if needed]
        CloudFormation[CloudFormation Update<br/>Infrastructure changes]
    end

    MainBranch --> CodeBuildFrontend
    MainBranch --> CodeBuildBackend
    MainBranch --> CodeBuildWorker

    CodeBuildFrontend --> ArtifactBucket
    CodeBuildFrontend --> ECRFrontend
    CodeBuildBackend --> ArtifactBucket
    CodeBuildBackend --> ECRBackend
    CodeBuildWorker --> ArtifactBucket
    CodeBuildWorker --> ECRWorker

    ECRFrontend --> CodeDeployFrontend
    ECRBackend --> CodeDeployBackend
    ECRWorker --> CodeDeployWorker

    CodeDeployBackend --> DBMigrations
    CodeDeployBackend --> SmokeTests
    SmokeTests --> CloudFormation

    style CodeBuildFrontend fill:#FF9900,color:#000
    style CodeBuildBackend fill:#FF9900,color:#000
    style ECRFrontend fill:#FF9900,color:#000
    style ECRBackend fill:#FF9900,color:#000
```

**CodePipeline Stages:**

1. **Source Stage**: GitHub webhook triggers on push to main
2. **Build Stage**: Parallel builds for frontend, backend, worker
3. **Test Stage**: Run unit and integration tests
4. **Deploy Stage**: Deploy to production with blue/green
5. **Verify Stage**: Run smoke tests and health checks

---

## Infrastructure as Code

### CloudFormation / Terraform Structure

```mermaid
graph TB
    subgraph "Infrastructure as Code"
        subgraph "Network Stack"
            VPCStack[VPC Stack<br/>Network isolation]
            Subnets[Subnets<br/>Public, Private, DB]
            Security[Security Groups<br/>NACLs, Security Groups]
        end

        subgraph "Database Stack"
            RDSStack[RDS Stack<br/>PostgreSQL cluster]
            ParameterGroups[Parameter Groups]
            SubnetGroups[DB Subnet Groups]
        end

        subgraph "Cache Stack"
            RedisStack[ElastiCache Stack<br/>Redis cluster]
            SecurityGroups[Cache Security Groups]
        end

        subgraph "Compute Stack"
            ECSCluster[ECS Cluster]
            TaskDefinitions[Task Definitions<br/>Backend, SSE, Worker]
            Services[Services<br/>Backend, SSE, Worker]
            ALBStack[Application Load Balancer]
        end

        subgraph "Storage Stack"
            S3Stack[S3 Buckets<br/>Frontend, Uploads, Logs]
            CloudFrontStack[CloudFront Distribution]
            OAC[Origin Access Control]
        end

        subgraph "Messaging Stack"
            SNSStack[SNS Topics<br/>Broadcasts, Alerts]
            SQSStack[SQS Queues<br/>SMS Queue]
        end

        subgraph "Security Stack"
            IAMStack[IAM Roles & Policies]
            SecretsStack[Secrets Manager]
            KMSStack[KMS Keys]
        end

        subgraph "Monitoring Stack"
            CloudWatchStack[CloudWatch Alarms & Dashboards]
            XRayStack[AWS X-Ray]
            ConfigStack[AWS Config Rules]
        end
    end

    VPCStack --> RDSStack
    VPCStack --> RedisStack
    VPCStack --> ComputeStack

    IAMStack --> ComputeStack
    IAMStack --> DatabaseStack
    IAMStack --> MessagingStack

    ComputeStack --> ALBStack
    ComputeStack --> SNSStack
    ComputeStack --> SQSStack

    StorageStack --> CloudFrontStack

    style VPCStack fill:#FF9900,color:#000
    style RDSStack fill:#FF9900,color:#000
    style ComputeStack fill:#FF9900,color:#000
```

---

## Cost Estimation (Monthly)

| Service | Configuration | Estimated Cost (USD) |
|---------|-------------|---------------------|
| **Compute** | | |
| ECS Fargate (Backend) | 2 tasks × 1024 CPU, 2GB RAM × 730 hours | $146.00 |
| ECS Fargate (SSE) | 2 tasks × 512 CPU, 1GB RAM × 730 hours | $73.00 |
| ECS Fargate (Worker) | 2 tasks × 256 CPU, 512MB RAM × 730 hours | $36.50 |
| ALB | 1 ALB, 2 AZs, LCU hours | $35.00 |
| **Database** | | |
| RDS PostgreSQL | db.r6g.large, 100GB GP3, Multi-AZ | $350.00 |
| ElastiCache Redis | cache.r6g.large, Multi-AZ | $210.00 |
| **Storage** | | |
| S3 (Frontend) | 10GB storage, 1TB transfer | $2.50 |
| S3 (Uploads) | 100GB storage, 500GB transfer | $25.00 |
| CloudFront | 2TB transfer, requests | $240.00 |
| **Messaging** | | |
| SNS SMS | 50,000 SMS/month | $1,500.00* |
| SQS | 100K requests | $0.40 |
| **Monitoring** | | |
| CloudWatch Logs | 50GB ingestion | $150.00 |
| CloudWatch Metrics | Custom metrics | $20.00 |
| **Other** | | |
| Route 53 | 1 hosted zone | $0.50 |
| ACM | 1 certificate | Free |
| KMS | 1 CMK | $1.00 |
| Secrets Manager | 10 secrets | $0.40 |
| Data Transfer | Inter-AZ, public | $50.00 |
| **Total** | | **~$2,840.30** |

*\*SMS cost is variable based on volume. 50,000 SMS = $0.03 per SMS in Singapore.*

---

## Disaster Recovery & High Availability

### Backup & Recovery Strategy

```mermaid
graph TB
    subgraph "High Availability Design"
        MultiAZ[Multi-AZ Deployment<br/>RDS, Redis, ECS]
        AutoScaling[Auto Scaling<br/>Based on metrics]
        HealthChecks[Health Checks<br/>Automatic replacement]
    end

    subgraph "Backup Strategy"
        RDSBackups[RDS Automated Backups<br/>7-day retention]
        RDSFinal[RDS Manual Snapshots<br/>Before deployments]
        S3Versioning[S3 Versioning<br/>Object recovery]
        ECRImages[ECR Image Tags<br/>Rollback capability]
    end

    subgraph "Disaster Recovery"
        DRPlan[Disaster Recovery Plan<br/>Documented procedures]
        RTO[Recovery Time Objective<br/>1 hour]
        RPO[Recovery Point Objective<br/>5 minutes]
        Failover[Automated Failover<br/>Multi-AZ]
    end

    subgraph "Incident Response"
        CloudTrail[Audit Trail<br/>API logging]
        GuardDuty[Threat Detection<br/>24/7 monitoring]
    end

    MultiAZ --> HealthChecks
    AutoScaling --> HealthChecks

    RDSBackups --> RDSFinal
    S3Versioning --> ECRImages

    Failover --> RTO
    RTO --> RPO

    CloudTrail --> GuardDuty
```

---

## Comparison: AWS vs Current Architecture

| Aspect | Current (Vercel+Render+Neon) | AWS Native |
|--------|------------------------------|------------|
| **Hosting** | Multiple providers | Single provider, unified management |
| **Frontend** | Vercel Edge Network | CloudFront (400+ PoPs) |
| **Backend** | Render (fixed instances) | ECS Fargate (auto-scaling) |
| **Database** | Neon (serverless PostgreSQL) | RDS (managed, Multi-AZ) |
| **Caching** | None | ElastiCache Redis |
| **SMS** | Not implemented | SNS (native, cost-effective) |
| **Monitoring** | Basic | CloudWatch (comprehensive) |
| **Security** | Basic | WAF, Shield, IAM, KMS |
| **Cost Control** | Limited | Budgets, cost allocation tags |
| **Support** | Community | AWS Support (Business+) |
| **Compliance** | SOC 2 Type 2 | Multiple certifications |

**Advantages of AWS Native:**

1. **Single Platform**: All services under one AWS account for unified billing and management
2. **SMS Integration**: Native SNS service for cost-effective SMS broadcasting
3. **Better Control**: Full control over infrastructure configuration
4. **Security**: Enterprise-grade security with WAF, Shield, and IAM
5. **High Availability**: Multi-AZ deployment for critical components
6. **Scalability**: Auto-scaling based on real-time metrics
7. **Compliance**: Multiple certifications (ISO 27001, SOC 2, HIPAA)
8. **Support**: 24/7 enterprise support with AWS Business+

**Considerations:**

1. **Complexity**: More complex setup, requires DevOps knowledge
2. **Initial Cost**: Higher initial setup, better cost at scale
3. **Learning Curve**: AWS services require learning
4. **Migration Effort**: Significant effort to migrate existing infrastructure

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up AWS account and organizational structure
- [ ] Create VPC, subnets, and security groups
- [ ] Set up IAM roles and policies
- [ ] Configure Route 53 and acquire SSL certificates

### Phase 2: Storage Layer (Week 3)
- [ ] Deploy RDS PostgreSQL cluster
- [ ] Set up database migration scripts
- [ ] Deploy ElastiCache Redis cluster
- [ ] Create S3 buckets for uploads and logs

### Phase 3: Compute Layer (Week 4)
- [ ] Set up ECR repositories
- [ ] Dockerize backend services
- [ ] Deploy ECS cluster and services
- [ ] Configure Application Load Balancer

### Phase 4: Frontend Deployment (Week 5)
- [ ] Build and deploy frontend to S3
- [ ] Configure CloudFront distribution
- [ ] Set up WAF rules
- [ ] Configure cache policies

### Phase 5: SMS Integration (Week 6)
- [ ] Set up SNS topics and subscriptions
- [ ] Implement SMS service in backend
- [ ] Configure SQS for queuing
- [ ] Deploy worker service

### Phase 6: Monitoring & Security (Week 7)
- [ ] Configure CloudWatch alarms and dashboards
- [ ] Set up CloudTrail and Config
- [ ] Enable GuardDuty
- [ ] Configure Secrets Manager

### Phase 7: CI/CD (Week 8)
- [ ] Set up CodePipeline
- [ ] Configure CodeBuild projects
- [ ] Implement automated testing
- [ ] Configure blue/green deployments

### Phase 8: Testing & Launch (Week 9-10)
- [ ] Load testing and performance optimization
- [ ] Security audit and penetration testing
- [ ] Disaster recovery testing
- [ ] Production cutover

---

## Summary

This AWS-native architecture provides a comprehensive, scalable, and secure infrastructure for the QuickAid emergency response platform. Key benefits include:

1. **Unified Infrastructure**: All components under AWS for streamlined management
2. **SMS Broadcasting**: Native SNS integration for emergency alerts
3. **High Availability**: Multi-AZ deployment with automatic failover
4. **Enterprise Security**: WAF, Shield, encryption, and comprehensive IAM
5. **Auto-Scaling**: Resources scale automatically based on demand
6. **Monitoring**: Comprehensive observability with CloudWatch and X-Ray
7. **Cost Control**: Detailed cost tracking and optimization tools

The architecture supports all existing features while adding SMS notifications and providing enterprise-grade reliability and security required for an emergency response system.