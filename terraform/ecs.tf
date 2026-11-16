# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "apex-ecommerce-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# 1. Backend Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "apex-backend-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 5000
          hostPort      = 5000
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "5000" },
        { name = "DATABASE_URL", value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${var.db_name}?schema=public" },
        { name = "JWT_SECRET", value = var.jwt_secret },
        { name = "JWT_EXPIRES_IN", value = "7d" },
        { name = "FRONTEND_URL", value = "http://${aws_lb.main.dns_name}" },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "AWS_S3_BUCKET", value = aws_s3_bucket.product_images.bucket },
        { name = "CLOUDFRONT_URL", value = "https://${aws_cloudfront_distribution.s3_distribution.domain_name}" },
        { name = "STRIPE_SECRET_KEY", value = var.stripe_secret_key },
        { name = "COOKIE_DOMAIN", value = "" },
        { name = "SECURE_COOKIES", value = "false" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])
}

# Backend Service
resource "aws_ecs_service" "backend" {
  name            = "apex-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 5000
  }

  depends_on = [
    aws_lb_listener.http,
    aws_lb_listener_rule.api_rule,
    aws_db_instance.postgres
  ]
}

# 2. Frontend Task Definition
resource "aws_ecs_task_definition" "frontend" {
  family                   = "apex-frontend-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "frontend"
      image     = "${aws_ecr_repository.frontend.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        { name = "NEXT_PUBLIC_API_URL", value = "http://${aws_lb.main.dns_name}/api" },
        { name = "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", value = var.stripe_publishable_key },
        { name = "NEXT_PUBLIC_SITE_NAME", value = "ApexCommerce" },
        { name = "NEXT_PUBLIC_SITE_URL", value = "http://${aws_lb.main.dns_name}" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "frontend"
        }
      }
    }
  ])
}

# Frontend Service
resource "aws_ecs_service" "frontend" {
  name            = "apex-frontend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3000
  }

  depends_on = [
    aws_lb_listener.http,
    aws_ecs_service.backend
  ]
}
