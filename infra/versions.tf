terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# CloudFront certs must be requested in us-east-1, regardless of main region
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

variable "aws_region" {
  default = "us-west-2"
}

variable "domain_name" {
  default = "events.kevinlutes.com"
}

variable "root_domain" {
  description = "Root domain — used to look up the existing Route 53 hosted zone"
  default     = "kevinlutes.com"
}

variable "project" {
  default = "ticket-tracker"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "origin_verify_secret" {
  description = "Secret header value CloudFront sends to ALB"
  type        = string
  sensitive   = true
  default     = "changeme-random-secret"
}
