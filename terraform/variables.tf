variable "aws_region" {
  description = "The AWS region to deploy all resources into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Application deployment environment (e.g. prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "db_name" {
  description = "PostgreSQL Database name"
  type        = string
  default     = "ecommerce_db"
}

variable "db_username" {
  description = "PostgreSQL Master Username"
  type        = string
  default     = "dbadmin"
}

variable "db_password" {
  description = "PostgreSQL Master Password (at least 8 chars)"
  type        = string
  sensitive   = true
  default     = "StrongPass123_Apex"
}

variable "jwt_secret" {
  description = "JWT Secret token for auth cookies"
  type        = string
  sensitive   = true
  default     = "production_super_secret_jwt_key_99182374"
}

variable "stripe_secret_key" {
  description = "Stripe test mode Secret Key"
  type        = string
  sensitive   = true
  default     = "sk_test_placeholder"
}

variable "stripe_publishable_key" {
  description = "Stripe Publishable Key"
  type        = string
  default     = "pk_test_placeholder"
}

variable "domain_name" {
  description = "Optional custom Route 53 domain name (e.g. shop.example.com). Leave empty to use ALB default DNS."
  type        = string
  default     = ""
}
