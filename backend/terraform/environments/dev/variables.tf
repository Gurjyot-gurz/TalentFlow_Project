variable "aws_region" {
  description = "AWS region for TalentFlow infrastructure"
  type        = string
  default     = "us-east-1"
}


variable "vpc_cidr" {
  description = "CIDR block for the TalentFlow VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability Zones used by TalentFlow"
  type        = list(string)

  default = [
    "us-east-1a",
    "us-east-1b"
  ]
}
variable "db_host" {
  description = "TalentFlow RDS endpoint"
  type        = string
}

variable "db_port" {
  description = "TalentFlow RDS MySQL port"
  type        = number
  default     = 3306
}

variable "db_user" {
  description = "TalentFlow RDS username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "TalentFlow RDS password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "TalentFlow database name"
  type        = string
  default     = "talentflow"
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "s3_bucket_name" {
  description = "TalentFlow resume S3 bucket"
  type        = string
}