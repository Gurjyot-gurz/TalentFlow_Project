terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket = "talentflow-terraform-state-318003418338"
    key    = "talentflow/dev/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "TalentFlow"
      Environment = "Development"
      ManagedBy   = "Terraform"
    }
  }
}