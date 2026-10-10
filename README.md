<div align="center">

# TalentFlow
### Cloud-Based Recruitment Management Platform

**A cloud-hosted recruitment workflow for managing candidates, jobs, applications, interviews, and resume files.**

<p>
  <img src="https://img.shields.io/badge/AWS-Cloud%20Infrastructure-FF9900?logo=amazonaws&logoColor=white" alt="AWS" />
  <img src="https://img.shields.io/badge/Backend-REST%20API-2F6F9F" alt="REST API" />
  <img src="https://img.shields.io/badge/Database-Amazon%20RDS%20MySQL-4479A1?logo=mysql&logoColor=white" alt="RDS MySQL" />
  <img src="https://img.shields.io/badge/Containers-Docker-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/IaC-Terraform-7B42BC?logo=terraform&logoColor=white" alt="Terraform" />
  <img src="https://img.shields.io/badge/Status-Internship%20Project-2E8B57" alt="Internship project" />
</p>

<p><em>Project report and implementation evidence for the Davine Technologies internship project.</em></p>

</div>

---

## Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Project Goals](#-project-goals)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Application Workflow](#-application-workflow)
- [AWS Components](#-aws-components)
- [Data Model](#-data-model)
- [API Reference](#-api-reference)
- [Resume Processing Flow](#-resume-processing-flow)
- [Security Design](#-security-design)
- [Deployment and Infrastructure](#-deployment-and-infrastructure)
- [Testing and Validation](#-testing-and-validation)
- [Screenshots and Evidence](#-screenshots-and-evidence)
- [Challenges and Lessons Learned](#-challenges-and-lessons-learned)
- [Limitations and Future Improvements](#-limitations-and-future-improvements)
- [Repository Structure](#-repository-structure)
- [Local Development](#-local-development)
- [Configuration and Secrets](#-configuration-and-secrets)
- [Cleanup and Cost Awareness](#-cleanup-and-cost-awareness)
- [Disclaimer](#-disclaimer)

> **Screenshot paths:** This README expects all evidence images to be committed in a root-level `images/` directory, using the exact filenames shown in the gallery. GitHub renders repository-relative image paths. If a filename differs even by capitalization, update the corresponding path because GitHub is case-sensitive.

## ☁️ Overview

TalentFlow is a cloud-based recruitment management project designed to bring key hiring activities into one application. It focuses on the recruitment lifecycle: creating job listings, maintaining candidate records, receiving applications, tracking interview details, and storing resume files.

The project combines a web interface and REST API with AWS infrastructure. Application records are intended to persist in **Amazon RDS for MySQL**, while resume files are stored in **Amazon S3**. The backend is deployed behind an **Application Load Balancer (ALB)** and uses EC2/Auto Scaling components for application hosting. Supporting AWS services such as API Gateway, Lambda, SQS, SNS, EventBridge, and CloudWatch are used in the resume-processing and operational workflow.

The repository also documents infrastructure work and troubleshooting performed during implementation. The screenshots below are evidence of specific configuration or test steps; a screenshot of a configured component should not, by itself, be interpreted as proof that every end-to-end scenario is production-ready.

## 🎯 Problem Statement

Recruitment workflows can become fragmented when job information, candidate details, resumes, applications, and interviews are maintained in separate places. That fragmentation makes it harder to follow an applicant's progress, keep records consistent, and understand the state of a hiring pipeline.

TalentFlow addresses this problem by providing a shared application workflow and a cloud-hosted data layer. The intended result is a clearer view of hiring activity and a foundation that can be extended with stronger authorization, automation, and reporting.

## 🧭 Project Goals

- Centralize job, candidate, application, and interview information.
- Provide a web-based interface for common recruitment tasks.
- Persist business records in a relational database.
- Store resume files separately from application records using Amazon S3.
- Use an API-based architecture to separate frontend and backend responsibilities.
- Use containerization and AWS compute components to support deployment.
- Explore asynchronous processing through AWS messaging and serverless services.
- Improve operational visibility with logs, alarms, and AWS identity/security controls.
- Document implementation evidence, issues encountered, and validation performed.

## ✨ Features

| Feature | Description |
|---|---|
| User registration and login | API endpoints support registration and login workflows. Authentication and authorization should be enforced by the backend, not only by frontend navigation. |
| Candidate management | Create and retrieve candidate records and update recruitment-stage information. |
| Job management | Retrieve job listings and create job records with job details. |
| Application tracking | Create and retrieve application records associated with candidates and jobs. |
| Interview management | Create and retrieve interview records and update interview status. |
| Resume upload | Upload resume files through the backend workflow and store them in Amazon S3. |
| Resume retrieval | Retrieve a resume through a backend-controlled link or endpoint, depending on the configured implementation. |
| Relational persistence | Keep structured application data in Amazon RDS for MySQL. |
| Container deployment | Package the backend using Docker and publish images to Amazon ECR as shown in the evidence. |
| Load balancing and scaling | Use an ALB, target group, launch template, and Auto Scaling Group in the documented deployment architecture. |
| Asynchronous workflow | Use API Gateway/Lambda/SQS components for the documented resume-processing handoff. |
| Monitoring | Use CloudWatch logs and alarms to support operational diagnosis. |

> **Implementation note:** The feature list describes the project’s documented scope and endpoints. Optional enhancements such as production-grade role-based access control, real AI resume matching, OTP verification, and a complete processing pipeline must not be assumed unless their implementation is present in the source code and validated end-to-end.

## 🧰 Technology Stack

| Area | Technology / AWS service | Role in the project |
|---|---|---|
| Frontend | HTML, CSS, JavaScript | User interface and API requests |
| API/backend | REST API and backend application | Business logic and data access |
| Database | Amazon RDS for MySQL | Structured application records |
| Resume object storage | Amazon S3 | Resume files and object storage |
| Containerization | Docker | Package the backend application |
| Container registry | Amazon ECR | Store container images |
| Compute | Amazon EC2 | Run the backend container/application |
| Scaling | Launch Template, Auto Scaling Group | Define and manage EC2 capacity |
| Load balancing | Application Load Balancer and Target Group | Route incoming requests to healthy targets |
| API entry point | Amazon API Gateway | Expose the resume-processing endpoint |
| Event processing | AWS Lambda | Handle event-driven processing steps |
| Messaging | Amazon SQS | Queue work asynchronously |
| Notifications | Amazon SNS | Notification delivery path |
| Event routing | Amazon EventBridge | Event-driven integration where configured |
| Observability | Amazon CloudWatch | Logs, metrics, and alarms |
| Identity and permissions | AWS IAM | Control AWS service permissions |
| Infrastructure as Code | Terraform | Define infrastructure resources |
| CI/CD | GitHub Actions (where configured) | Automate repository workflows |

## 🏗️ Architecture

The architecture separates the web application, relational data, object storage, and asynchronous processing path.

```mermaid
flowchart TB
    User[Recruiter / User] --> Web[Web Frontend]
    Web --> DNS[DNS / CDN layer, if configured]
    DNS --> ALB[Application Load Balancer]
    ALB --> TG[Target Group]
    TG --> ASG[Auto Scaling Group]
    ASG --> EC2[EC2 instances running containerized backend]
    EC2 --> RDS[(Private Amazon RDS for MySQL)]
    EC2 --> S3[(Amazon S3 resume bucket)]
    EC2 --> APIGW[Amazon API Gateway]
    APIGW --> Receiver[Lambda: request/queue handler]
    Receiver --> Queue[[Amazon SQS]]
    Queue --> Worker[Lambda: processing worker, if configured]
    Worker --> S3
    Worker --> RDS
    Worker --> SNS[Amazon SNS]
    EC2 --> CW[CloudWatch logs/metrics]
    Worker --> CW
    IaC[Terraform] -. provisions .-> ALB
    IaC -. provisions .-> ASG
    IaC -. provisions .-> RDS
    IaC -. provisions .-> S3
```

**How to read the diagram**

1. A user interacts with the frontend.
2. The frontend calls the backend API for authentication and recruitment operations.
3. The backend reads and writes structured records in RDS.
4. Resume files are stored in S3, while database rows retain the related metadata or object key.
5. The API Gateway → Lambda → SQS path provides a queue-based handoff for asynchronous work.
6. A downstream worker can process queued work and update status or send notifications when that worker and its integrations are deployed and configured.
7. CloudWatch supports troubleshooting through logs, metrics, and alarms.
8. Terraform files describe infrastructure resources; they should be reviewed against the actual AWS account before being applied.

**Network boundary:** The RDS database is intended to remain private. Do not make it publicly accessible just to simplify a local database-client connection. Use a controlled path such as an SSM-managed session/port-forwarding setup where configured.

## 🔄 Application Workflow

### 1. User access

The user opens the frontend and submits login or registration details. The frontend sends the request to the backend authentication endpoint. The backend should validate input, verify credentials, and return the appropriate response or token.

### 2. Candidate and job management

Candidate and job screens call the relevant backend endpoints. The backend validates the request and persists the resulting data in the relational database. Frontend-only navigation or role hiding is not a substitute for backend authorization.

### 3. Application lifecycle

An application links a candidate to a job. Creating a user account does not automatically create an application: the application workflow must be submitted separately. The application record should reference the appropriate candidate and job records.

### 4. Resume upload

The resume workflow uploads the file to S3 and stores the object key or related status in the database. The UI should show a completed state only after the relevant API/storage operation has succeeded; a queued response means work was accepted for processing, not necessarily that processing finished.

### 5. Asynchronous processing

The documented event-driven handoff uses API Gateway, Lambda, and SQS. The request handler accepts an API request and places a message on the queue. If a downstream worker is configured, it consumes the SQS message, processes it, and updates the relevant result/status. Failures should be observable through logs and, where configured, a dead-letter queue and notification path.

### 6. Interview tracking

Interview records are created and retrieved through the API. Status changes are sent to the backend so that the persisted state, rather than only the visible UI, represents the current interview status.

## ☁️ AWS Components

<details>
<summary><strong>Compute, load balancing, and scaling</strong></summary>

- **Amazon EC2:** Hosts the backend application/container.
- **Launch Template:** Defines the instance configuration used by the scaling group.
- **Auto Scaling Group (ASG):** Manages the desired EC2 capacity.
- **Application Load Balancer (ALB):** Accepts application traffic and forwards it to the target group.
- **Target Group:** Tracks registered targets and health-check status.

Healthy targets indicate that the configured health check is passing. They do not prove that every API endpoint, database write, or resume-processing scenario works correctly.
</details>

<details>
<summary><strong>Amazon RDS for MySQL</strong></summary>

RDS stores structured records such as users, candidates, jobs, applications, and interviews. The database is designed to remain private inside the VPC and should be accessed through an approved network path. Credentials belong in a secrets manager or protected environment configuration, not in committed source files or screenshots.
</details>

<details>
<summary><strong>Amazon S3 and resume storage</strong></summary>

S3 stores resume objects. The application should use least-privilege IAM permissions and keep the bucket private unless a specific public-access requirement exists. Access to a resume should be mediated by the backend or a short-lived presigned URL, according to the implementation.
</details>

<details>
<summary><strong>API Gateway, Lambda, and SQS</strong></summary>

The documented resume API endpoint is:

`POST https://9my383mu6d.execute-api.us-east-1.amazonaws.com/resume/process`

This endpoint is intended to accept a processing request and hand work off to the asynchronous path. A `QUEUED` response and SQS message identifier confirm queue acceptance, not successful completion of every downstream processing step. Verify the worker logs and persisted result/status before describing a file as fully processed.
</details>

<details>
<summary><strong>SNS, EventBridge, and CloudWatch</strong></summary>

- **SNS:** Notification delivery when a configured workflow publishes a message.
- **EventBridge:** Event routing for configured events and targets.
- **CloudWatch Logs:** Runtime and diagnostic logs.
- **CloudWatch Alarms:** Signals for configured thresholds or health conditions.

The existence of a topic, rule, log group, or alarm alone does not establish that a complete business workflow is functioning.
</details>

<details>
<summary><strong>Terraform, IAM, and deployment</strong></summary>

Terraform describes infrastructure as code. IAM controls permissions for users, roles, and services. GitHub Actions can automate checks and deployment if the repository workflow files are configured. Review Terraform plans, account/region settings, and credentials before making infrastructure changes.
</details>

## 🗃️ Data Model

The project uses separate entities for distinct business concepts.

| Entity / table | Purpose |
|---|---|
| `users` | Login/registration and user account information |
| `candidates` | Candidate profile and recruitment-stage details |
| `jobs` | Job listings and job descriptions |
| `applications` | Candidate-to-job application records |
| `interviews` | Interview schedule/details and status |
| Resume metadata | Links a candidate/resume record to an S3 object key and processing status, where implemented |

A useful data-integrity check is to verify that an operation appears in the database table expected for that operation. A successful registration should be checked in `users`; a successful application should be checked in `applications`. The two operations are separate.

## 🔌 API Reference

The following endpoints are part of the documented backend API surface. Exact request fields, response bodies, validation rules, and authorization requirements depend on the backend implementation.

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Register a user |
| `POST` | `/api/auth/login` | Authenticate a user |

### Candidates

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/candidates` | List candidates |
| `GET` | `/api/candidates/:id` | Retrieve one candidate |
| `POST` | `/api/candidates` | Create a candidate |
| `PATCH` | `/api/candidates/:id/stage` | Update a candidate's recruitment stage |
| `POST` | `/api/candidates/:id/resume` | Upload/associate a resume |
| `GET` | `/api/candidates/:id/resume` | Retrieve resume access information |

### Jobs

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/jobs` | List jobs |
| `POST` | `/api/jobs` | Create a job |

### Applications

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/applications` | List applications |
| `POST` | `/api/applications` | Create an application |

### Interviews

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/interviews` | List interviews |
| `POST` | `/api/interviews` | Create an interview |
| `PATCH` | `/api/interviews/:id/status` | Update interview status |

**API base URL:** The deployed base URL depends on the environment. In the browser, configure the frontend to use the correct API origin and avoid hard-coding development URLs into production builds. Do not publish tokens, credentials, or private connection strings in examples.

## 📄 Resume Processing Flow

The resume path involves several distinct stages that should be tested independently:

1. **Request received:** API Gateway receives the processing request.
2. **Request parsed:** The Lambda handler reads the API Gateway event body correctly. An API Gateway body (`event.body`) and an SQS record body (`event.Records[n].body`) are different event shapes.
3. **Queue handoff:** The receiver Lambda sends a message to SQS.
4. **Worker execution:** A configured SQS-triggered Lambda consumes the message.
5. **Storage/data update:** The worker writes the output or processing status to the relevant storage/database.
6. **Notification:** SNS notification is published if the workflow's notification condition is met.
7. **Observability:** CloudWatch logs are checked for errors and successful completion.

A queue message ID is evidence of queueing, not evidence that every later stage has completed. When investigating a failed run, check each stage separately rather than assuming the whole pipeline succeeded.

## 🔐 Security Design

Security needs to be enforced by the backend and AWS configuration, not just by the user interface.

- Keep the RDS database private and limit inbound access to the required security group and port.
- Use IAM roles for AWS workloads and grant only the permissions each component needs.
- Keep the S3 bucket private and avoid public object access for resumes.
- Validate request payloads and authenticate protected API routes.
- Enforce role-based authorization on the backend; hiding a menu item in JavaScript is not a security boundary.
- Store secrets in environment configuration or a dedicated secrets service. Commit only a `.env.example` containing placeholder values.
- Never commit AWS access keys, database passwords, JWT secrets, private keys, session tokens, Terraform state, or secret-bearing `.tfvars` files.
- Redact sensitive values from screenshots, including database credential screens, JWT tokens, Docker environment settings, and AWS console pages.
- If a secret was ever committed or shared, rotate it. Deleting it from the latest commit does not remove it from Git history.
- Use HTTPS for public traffic and short-lived access URLs for private files where appropriate.

## 🚀 Deployment and Infrastructure

The project evidence covers infrastructure setup and deployment activities such as networking, RDS, S3, Docker/ECR, EC2 launch templates, Auto Scaling, ALB, and monitoring.

A safe deployment sequence is:

1. Review the Terraform files and variables.
2. Confirm the intended AWS account and region.
3. Check that credentials are valid and belong to the intended profile.
4. Run `terraform fmt` and `terraform validate`.
5. Review `terraform plan` carefully before applying.
6. Build and test the backend container.
7. Push the image to the intended ECR repository.
8. Deploy/update the compute resources and wait for target health checks.
9. Configure the frontend with the correct backend API origin.
10. Test authentication, CRUD operations, resume upload/retrieval, and asynchronous processing separately.
11. Inspect CloudWatch logs and database records for the test results.

**Important:** Do not run `terraform destroy` or a broad infrastructure change without reviewing the plan. Targeted destruction can leave dependencies behind, and manually deleting AWS resources does not automatically reconcile Terraform state. If the infrastructure has been manually removed, refresh/rebuild the state carefully before using Terraform again.

## 🧪 Testing and Validation

A practical validation checklist is below. Mark a test complete only after checking its actual result.

- [ ] Registration request returns the expected response.
- [ ] The new account appears in the `users` table.
- [ ] Login succeeds with valid credentials and fails safely with invalid credentials.
- [ ] Candidate creation persists in `candidates`.
- [ ] Job creation persists in `jobs`.
- [ ] Application creation persists in `applications`.
- [ ] Interview creation and status updates persist in `interviews`.
- [ ] Resume upload creates the expected S3 object.
- [ ] Resume metadata/object key is associated with the correct database record.
- [ ] Resume retrieval works only through the intended access path.
- [ ] API Gateway request reaches the receiver Lambda.
- [ ] Receiver Lambda successfully queues the message in SQS.
- [ ] The downstream worker completes successfully, if configured.
- [ ] Failure cases are visible in CloudWatch logs.
- [ ] The ALB target group reports healthy targets.
- [ ] No credentials or private tokens are present in Git history.

## 🖼️ Screenshots and Evidence

The following gallery uses relative links into `images/`. Each image caption describes the evidence expected from the filename. Make sure the image files exist in the repository under the exact names used here. Sensitive screenshots should be redacted before publishing.


### Database foundation

| Evidence | Evidence |
|---|---|
| <div align="center"><img src="./images/RDS_Homepage.png" alt="Amazon RDS console and database instance overview" width="340" /><br/><sub><strong>RDS_Homepage.png</strong><br/>Amazon RDS console and database instance overview</sub></div> | <div align="center"><img src="./images/RDS_Engine.png" alt="RDS database engine selection/configuration" width="340" /><br/><sub><strong>RDS_Engine.png</strong><br/>RDS database engine selection/configuration</sub></div> |
| <div align="center"><img src="./images/RDS_Availability.png" alt="RDS availability and deployment configuration" width="340" /><br/><sub><strong>RDS_Availability.png</strong><br/>RDS availability and deployment configuration</sub></div> | <div align="center"><img src="./images/DB_Identifier_Name_Password.png" alt="Database identifier and initial credentials screen — redact secrets before publishing" width="340" /><br/><sub><strong>DB_Identifier_Name_Password.png</strong><br/>Database identifier and initial credentials screen — redact secrets before publishing</sub></div> |
| <div align="center"><img src="./images/DB_Publicand_VPC.png" alt="RDS public-access setting and VPC selection" width="340" /><br/><sub><strong>DB_Publicand_VPC.png</strong><br/>RDS public-access setting and VPC selection</sub></div> | <div align="center"><img src="./images/DB_SG_and_Port.png" alt="Database security group and port configuration" width="340" /><br/><sub><strong>DB_SG_and_Port.png</strong><br/>Database security group and port configuration</sub></div> |
| <div align="center"><img src="./images/RDS_Database.png" alt="RDS database configuration" width="340" /><br/><sub><strong>RDS_Database.png</strong><br/>RDS database configuration</sub></div> | &nbsp; |


### Database validation

| Evidence | Evidence |
|---|---|
| <div align="center"><img src="./images/Registration_Tested_On_RDS_SQL.png" alt="Registration record verified through SQL" width="340" /><br/><sub><strong>Registration_Tested_On_RDS_SQL.png</strong><br/>Registration record verified through SQL</sub></div> | <div align="center"><img src="./images/USERS_Table.png" alt="Users table in the RDS database" width="340" /><br/><sub><strong>USERS_Table.png</strong><br/>Users table in the RDS database</sub></div> |
| <div align="center"><img src="./images/CANDIDATES_Table.png" alt="Candidates table in the RDS database" width="340" /><br/><sub><strong>CANDIDATES_Table.png</strong><br/>Candidates table in the RDS database</sub></div> | <div align="center"><img src="./images/JOB_Table.png" alt="Jobs table in the RDS database" width="340" /><br/><sub><strong>JOB_Table.png</strong><br/>Jobs table in the RDS database</sub></div> |
| <div align="center"><img src="./images/APPLICATIONS_Table.png" alt="Applications table in the RDS database" width="340" /><br/><sub><strong>APPLICATIONS_Table.png</strong><br/>Applications table in the RDS database</sub></div> | <div align="center"><img src="./images/INTERVIEWS_Table.png" alt="Interviews table in the RDS database" width="340" /><br/><sub><strong>INTERVIEWS_Table.png</strong><br/>Interviews table in the RDS database</sub></div> |


### API and authentication

| Evidence | Evidence |
|---|---|
| <div align="center"><img src="./images/JWT_Token_Connection_Candidate.png" alt="JWT-connected candidate API test — redact token values" width="340" /><br/><sub><strong>JWT_Token_Connection_Candidate.png</strong><br/>JWT-connected candidate API test — redact token values</sub></div> | <div align="center"><img src="./images/Candidate_Created_Tested.png" alt="Candidate creation test" width="340" /><br/><sub><strong>Candidate_Created_Tested.png</strong><br/>Candidate creation test</sub></div> |
| <div align="center"><img src="./images/API_Gateway.png" alt="API Gateway endpoint configuration" width="340" /><br/><sub><strong>API_Gateway.png</strong><br/>API Gateway endpoint configuration</sub></div> | &nbsp; |


### Resume storage

| Evidence | Evidence |
|---|---|
| <div align="center"><img src="./images/S3_Bucket_Created.png" alt="S3 resume bucket creation" width="340" /><br/><sub><strong>S3_Bucket_Created.png</strong><br/>S3 resume bucket creation</sub></div> | <div align="center"><img src="./images/S3_CLI_Connected.png" alt="S3 access verification using AWS CLI" width="340" /><br/><sub><strong>S3_CLI_Connected.png</strong><br/>S3 access verification using AWS CLI</sub></div> |
| <div align="center"><img src="./images/Resume_UploadedSuccessfully.png" alt="Resume upload success evidence" width="340" /><br/><sub><strong>Resume_UploadedSuccessfully.png</strong><br/>Resume upload success evidence</sub></div> | <div align="center"><img src="./images/RDS_Database_Updated_Resume.png" alt="Resume metadata updated in RDS" width="340" /><br/><sub><strong>RDS_Database_Updated_Resume.png</strong><br/>Resume metadata updated in RDS</sub></div> |
| <div align="center"><img src="./images/Resume_Retrieval_Link_Working.png" alt="Resume retrieval link test" width="340" /><br/><sub><strong>Resume_Retrieval_Link_Working.png</strong><br/>Resume retrieval link test</sub></div> | <div align="center"><img src="./images/s3_bucket.png" alt="S3 bucket evidence" width="340" /><br/><sub><strong>s3_bucket.png</strong><br/>S3 bucket evidence</sub></div> |


### Container and registry

| Evidence | Evidence |
|---|---|
| <div align="center"><img src="./images/Containerizing_Docker_File.png" alt="Dockerfile and container packaging" width="340" /><br/><sub><strong>Containerizing_Docker_File.png</strong><br/>Dockerfile and container packaging</sub></div> | <div align="center"><img src="./images/Running_Docker_Image.png" alt="Running Docker container" width="340" /><br/><sub><strong>Running_Docker_Image.png</strong><br/>Running Docker container</sub></div> |
| <div align="center"><img src="./images/NewDocker_Run_AWS_RDS_Pass_Config.png" alt="Docker runtime configuration — redact passwords" width="340" /><br/><sub><strong>NewDocker_Run_AWS_RDS_Pass_Config.png</strong><br/>Docker runtime configuration — redact passwords</sub></div> | <div align="center"><img src="./images/ECR_Push_Policy_Created.png" alt="ECR push policy configuration" width="340" /><br/><sub><strong>ECR_Push_Policy_Created.png</strong><br/>ECR push policy configuration</sub></div> |
| <div align="center"><img src="./images/ECR_Create_Docker_Login.png" alt="ECR Docker login" width="340" /><br/><sub><strong>ECR_Create_Docker_Login.png</strong><br/>ECR Docker login</sub></div> | <div align="center"><img src="./images/Docker_Image_Pushed_toECR.png" alt="Docker image pushed to ECR" width="340" /><br/><sub><strong>Docker_Image_Pushed_toECR.png</strong><br/>Docker image pushed to ECR</sub></div> |
| <div align="center"><img src="./images/New_Docker_Container_Added_to_ECR.png" alt="Container image available in ECR" width="340" /><br/><sub><strong>New_Docker_Container_Added_to_ECR.png</strong><br/>Container image available in ECR</sub></div> | &nbsp; |


### Infrastructure as Code

| Evidence | Evidence |
|---|---|
| <div align="center"><img src="./images/Terraform_Setup_for_Network_VPC.png" alt="Terraform network/VPC setup" width="340" /><br/><sub><strong>Terraform_Setup_for_Network_VPC.png</strong><br/>Terraform network/VPC setup</sub></div> | <div align="center"><img src="./images/RDS_Snapshotcreated_Before_Step_7.png" alt="RDS snapshot before infrastructure changes" width="340" /><br/><sub><strong>RDS_Snapshotcreated_Before_Step_7.png</strong><br/>RDS snapshot before infrastructure changes</sub></div> |
| <div align="center"><img src="./images/Terraform_Created_VPC.png" alt="VPC created through Terraform" width="340" /><br/><sub><strong>Terraform_Created_VPC.png</strong><br/>VPC created through Terraform</sub></div> | <div align="center"><img src="./images/Terraform_Created_Public_Subnet.png" alt="Public subnet configuration" width="340" /><br/><sub><strong>Terraform_Created_Public_Subnet.png</strong><br/>Public subnet configuration</sub></div> |
| <div align="center"><img src="./images/Terraform_Created_Private_Subnet.png" alt="Private subnet configuration" width="340" /><br/><sub><strong>Terraform_Created_Private_Subnet.png</strong><br/>Private subnet configuration</sub></div> | <div align="center"><img src="./images/Terraform_Created_IGW.png" alt="Internet Gateway configuration" width="340" /><br/><sub><strong>Terraform_Created_IGW.png</strong><br/>Internet Gateway configuration</sub></div> |
| <div align="center"><img src="./images/Terraform_Created_NAT_Gateways.png" alt="NAT Gateway configuration" width="340" /><br/><sub><strong>Terraform_Created_NAT_Gateways.png</strong><br/>NAT Gateway configuration</sub></div> | <div align="center"><img src="./images/Terraform_Created_Route_Tables.png" alt="Route table configuration" width="340" /><br/><sub><strong>Terraform_Created_Route_Tables.png</strong><br/>Route table configuration</sub></div> |
| <div align="center"><img src="./images/Terraform_Created_Security_Groups.png" alt="Security group configuration" width="340" /><br/><sub><strong>Terraform_Created_Security_Groups.png</strong><br/>Security group configuration</sub></div> | <div align="center"><img src="./images/Terraform_Created_NACLs.png" alt="Network ACL configuration" width="340" /><br/><sub><strong>Terraform_Created_NACLs.png</strong><br/>Network ACL configuration</sub></div> |


### Compute and scaling

| Evidence | Evidence |
|---|---|
| <div align="center"><img src="./images/Terraform_Created_EC2_Launch_Template.png" alt="EC2 launch template configuration" width="340" /><br/><sub><strong>Terraform_Created_EC2_Launch_Template.png</strong><br/>EC2 launch template configuration</sub></div> | <div align="center"><img src="./images/Launch_template.png" alt="Launch template details" width="340" /><br/><sub><strong>Launch_template.png</strong><br/>Launch template details</sub></div> |
| <div align="center"><img src="./images/ASG.png" alt="Auto Scaling Group configuration" width="340" /><br/><sub><strong>ASG.png</strong><br/>Auto Scaling Group configuration</sub></div> | <div align="center"><img src="./images/EC2_Instances.png" alt="EC2 instances" width="340" /><br/><sub><strong>EC2_Instances.png</strong><br/>EC2 instances</sub></div> |
| <div align="center"><img src="./images/ALB.png" alt="Application Load Balancer and target group" width="340" /><br/><sub><strong>ALB.png</strong><br/>Application Load Balancer and target group</sub></div> | &nbsp; |


### Networking

| Evidence | Evidence |
|---|---|
| <div align="center"><img src="./images/VPC_Peering_to_RDS.png" alt="VPC/RDS connectivity configuration" width="340" /><br/><sub><strong>VPC_Peering_to_RDS.png</strong><br/>VPC/RDS connectivity configuration</sub></div> | <div align="center"><img src="./images/RDS_Connectivity_Security.png" alt="RDS connectivity and security settings" width="340" /><br/><sub><strong>RDS_Connectivity_Security.png</strong><br/>RDS connectivity and security settings</sub></div> |


### Application UI

| Evidence | Evidence |
|---|---|
| <div align="center"><img src="./images/Website_Login_Dashboard.png" alt="TalentFlow login/dashboard interface" width="340" /><br/><sub><strong>Website_Login_Dashboard.png</strong><br/>TalentFlow login/dashboard interface</sub></div> | <div align="center"><img src="./images/Website_Login_Page.png" alt="Final website login page" width="340" /><br/><sub><strong>Website_Login_Page.png</strong><br/>Final website login page</sub></div> |
| <div align="center"><img src="./images/Create_Job_Page.png" alt="Job creation page" width="340" /><br/><sub><strong>Create_Job_Page.png</strong><br/>Job creation page</sub></div> | <div align="center"><img src="./images/Candidate_Page.png" alt="Candidate management page" width="340" /><br/><sub><strong>Candidate_Page.png</strong><br/>Candidate management page</sub></div> |


### Asynchronous processing

| Evidence | Evidence |
|---|---|
| <div align="center"><img src="./images/SQS_Queue.png" alt="SQS queue and message evidence" width="340" /><br/><sub><strong>SQS_Queue.png</strong><br/>SQS queue and message evidence</sub></div> | <div align="center"><img src="./images/AWS_Lambda_SS.png" alt="Lambda function configuration" width="340" /><br/><sub><strong>AWS_Lambda_SS.png</strong><br/>Lambda function configuration</sub></div> |


### Notifications

| Evidence | Evidence |
|---|---|
| <div align="center"><img src="./images/SNS.png" alt="SNS topic/notification configuration" width="340" /><br/><sub><strong>SNS.png</strong><br/>SNS topic/notification configuration</sub></div> | &nbsp; |


### Monitoring

| Evidence | Evidence |
|---|---|
| <div align="center"><img src="./images/CloudWatch_Alarm.png" alt="CloudWatch alarm configuration" width="340" /><br/><sub><strong>CloudWatch_Alarm.png</strong><br/>CloudWatch alarm configuration</sub></div> | <div align="center"><img src="./images/CloudWatch_Log_MANAGEMENT.png" alt="CloudWatch log management" width="340" /><br/><sub><strong>CloudWatch_Log_MANAGEMENT.png</strong><br/>CloudWatch log management</sub></div> |


### Security

| Evidence | Evidence |
|---|---|
| <div align="center"><img src="./images/IAM_Dashboard.png" alt="IAM configuration/dashboard" width="340" /><br/><sub><strong>IAM_Dashboard.png</strong><br/>IAM configuration/dashboard</sub></div> | &nbsp; |


## 🧠 Challenges and Lessons Learned

### Infrastructure and Terraform

Terraform commands can fail when PowerShell line continuations or target addresses are malformed. Resource references must match the declared Terraform addresses, and disabling or renaming a resource file can leave outputs referring to undeclared resources. The safe response is to restore a coherent configuration, run validation, and inspect the plan before applying changes.

### AWS credentials and permissions

An `InvalidClientTokenId` error indicates that the active AWS credentials/session are not accepted. IAM permission errors are different: valid credentials do not guarantee permission to attach policies or perform a requested action. Confirm the active identity and ask an administrator to grant missing privileges rather than repeatedly retrying with the same insufficient identity.

### Systems Manager connectivity

An SSM session requires both permission to start a session and a managed EC2 instance that is online in Systems Manager. `AccessDenied` and `TargetNotConnected` indicate different failure classes. The instance role, SSM Agent, network connectivity, and caller permissions all need to be checked.

### Private RDS connectivity

A private RDS database is not directly reachable from an arbitrary local computer. The correct solution is a controlled route, such as an SSM port-forwarding session through a managed instance, rather than making the database public simply to connect a desktop SQL client.

### API events and queue processing

API Gateway and SQS deliver different event structures to Lambda. Parse the API request body from the API Gateway event and parse SQS messages from each record's body. A successful API response that says a request is queued proves the handoff stage only; the worker and final database/storage result must be checked independently.

### Data validation

Registration, candidate creation, job creation, and application creation are separate operations and usually write to separate tables. Test each workflow independently and inspect the corresponding database record. A successful UI interaction is not sufficient proof that the expected record persisted.

## 🔭 Limitations and Future Improvements

Potential next steps, subject to the current source code and deployment, include:

- Add comprehensive backend role-based access control and authorization tests.
- Add request validation, rate limiting, and consistent API error responses.
- Add automated unit/integration tests for the API and data-access layer.
- Add database migrations and documented seed data for reproducible local development.
- Add structured logs, correlation IDs, and alarms for failed queue processing.
- Add retry handling and a dead-letter queue for messages that cannot be processed.
- Improve deployment automation with a protected GitHub Actions workflow and safe environment-specific configuration.
- Add health checks and deployment rollback procedures.
- Add audit history for candidate stage changes and interview status updates.
- Add real resume parsing or matching only after selecting and implementing a specific processing approach. Do not describe AI-based matching as available unless it is implemented and tested.
- Improve accessibility, responsive layouts, and frontend error/loading states.
- Add a documented data-retention and resume-deletion policy.

## 📁 Repository Structure

The exact source tree may differ by branch. A typical layout for this project could look like:

```text
TalentFlow/
├── images/                     # Ordered implementation and UI screenshots
├── frontend/                   # Frontend source, if organized separately
├── backend/                    # API source, if organized separately
├── terraform/                  # Infrastructure as Code, if organized separately
├── .github/
│   └── workflows/              # GitHub Actions workflows, if configured
├── .env.example                # Placeholder configuration only
├── .gitignore
└── README.md
```

Do not create empty folders just to match this diagram; update the structure section to match the actual repository layout before publishing.

## 💻 Local Development

The precise commands depend on how the backend and frontend folders are structured in the repository. The general workflow is:

1. Install the runtime dependencies documented by the application.
2. Copy `.env.example` to a local environment file and fill in local values privately.
3. Configure the API to connect to a development database or an approved private RDS access path.
4. Start the backend using the command defined in its `package.json`, process manager, or deployment documentation.
5. Serve the frontend and configure its API base URL.
6. Run the test checklist above before connecting to a shared AWS environment.

Do not put real credentials into this README. Avoid publishing a universal run command until it has been verified against the repository's actual package scripts and folder names.

## ⚙️ Configuration and Secrets

If the backend uses environment variables, document their names and meanings in `.env.example`, with placeholders only. For example:

```dotenv
# Example placeholders only — never use these as real credentials.
PORT=3000
DB_HOST=your-database-host
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=replace_me_locally
JWT_SECRET=replace_with_a_long_random_secret
AWS_REGION=us-east-1
S3_BUCKET=your-private-resume-bucket
```

This is a generic example, not a claim that every variable name exactly matches the current source. Align the names with the backend configuration before use. Never commit `.env`, AWS credentials, `.pem` files, Terraform state, or files containing actual secret values.

A suggested `.gitignore` baseline:

```gitignore
# Local secrets
.env
.env.*
!.env.example
.aws/
*.pem
*.key

# Terraform
.terraform/
*.tfstate
*.tfstate.*
*.tfvars
*.tfvars.json
crash.log
override.tf
override.tf.json

# Dependencies and generated output
node_modules/
dist/
build/
coverage/
*.log
.DS_Store
Thumbs.db
```

Review existing ignore rules before replacing them, and do not ignore files that the project genuinely needs to build.

## 💸 Cleanup and Cost Awareness

AWS resources can continue to incur charges even when the application is not being used. NAT Gateways, load balancers, public IPv4 addresses, RDS instances, EC2 instances, and data transfer are common items to review.

Before finishing a lab or temporary deployment:

- Identify resources in the correct AWS account and region.
- Back up any data that must be retained.
- Delete dependent resources in a safe order.
- Empty S3 buckets before deleting them if they contain objects.
- Confirm that NAT Gateways and their Elastic IP allocations are removed when no longer required.
- Review RDS snapshots and backups before deleting them.
- Check the AWS Billing/Cost Explorer view after cleanup.
- Reconcile Terraform configuration/state if resources were deleted manually.

Never assume that a resource is gone just because it was removed from a Terraform file or because a destroy command was attempted.

## 📚 Disclaimer

This is an internship and learning project demonstrating a recruitment workflow and AWS deployment concepts. The repository and screenshots are provided for educational and portfolio purposes. Actual feature availability depends on the source code and AWS configuration in the checked-out version. No production-readiness, compliance, or end-to-end processing claim should be made without independent testing.

---

<div align="center">

**TalentFlow — Recruitment workflow with cloud infrastructure and operational evidence**

<sub>Built as a hands-on cloud, backend, and DevOps learning project.</sub>

</div>
