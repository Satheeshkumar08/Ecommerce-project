# Log Group for Backend Containers
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/apex-ecommerce-backend"
  retention_in_days = 14

  tags = {
    Name = "apex-backend-logs"
  }
}

# Log Group for Frontend Containers
resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/apex-ecommerce-frontend"
  retention_in_days = 14

  tags = {
    Name = "apex-frontend-logs"
  }
}

# High CPU Alarm for Backend ECS Service
resource "aws_cloudwatch_metric_alarm" "backend_cpu_high" {
  alarm_name          = "apex-backend-cpu-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggered when backend ECS CPU utilization exceeds 80%"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.backend.name
  }
}
