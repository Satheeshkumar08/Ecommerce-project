# 1. ALB Security Group (Internet-facing)
resource "aws_security_group" "alb" {
  name        = "apex-alb-security-group"
  description = "Controls inbound HTTP/HTTPS traffic to Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "apex-alb-sg"
  }
}

# 2. ECS Tasks Security Group (Private containers)
resource "aws_security_group" "ecs_tasks" {
  name        = "apex-ecs-tasks-security-group"
  description = "Allows traffic ONLY from the Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow frontend port 3000 from ALB only"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Allow backend port 5000 from ALB only"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow outbound internet traffic for S3, ECR, Stripe"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "apex-ecs-tasks-sg"
  }
}

# 3. RDS Security Group (Isolated Database)
resource "aws_security_group" "rds" {
  name        = "apex-rds-security-group"
  description = "Controls database access exclusively from ECS backend tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow PostgreSQL 5432 strictly from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "apex-rds-sg"
  }
}
