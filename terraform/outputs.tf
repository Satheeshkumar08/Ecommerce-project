output "alb_dns_name" {
  description = "The public Application Load Balancer DNS Name. Access your live website here!"
  value       = aws_lb.main.dns_name
}

output "public_website_url" {
  description = "The complete live public URL for the website"
  value       = "http://${aws_lb.main.dns_name}"
}

output "cloudfront_url" {
  description = "CloudFront CDN domain serving product images from S3"
  value       = "https://${aws_cloudfront_distribution.s3_distribution.domain_name}"
}

output "rds_endpoint" {
  description = "AWS RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "ecr_frontend_repository_url" {
  description = "Amazon ECR URL for Frontend image"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_backend_repository_url" {
  description = "Amazon ECR URL for Backend image"
  value       = aws_ecr_repository.backend.repository_url
}

output "s3_bucket_name" {
  description = "AWS S3 bucket for product images"
  value       = aws_s3_bucket.product_images.bucket
}

output "ecs_cluster_name" {
  description = "Amazon ECS Fargate Cluster Name"
  value       = aws_ecs_cluster.main.name
}
