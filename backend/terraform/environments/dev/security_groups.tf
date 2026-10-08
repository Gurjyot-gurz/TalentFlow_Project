resource "aws_security_group" "alb" {
  name        = "talentflow-alb-sg"
  description = "Security group for TalentFlow Application Load Balancer"
  vpc_id      = aws_vpc.talentflow.id

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "talentflow-alb-sg"
    Tier = "Public"
  }
}


resource "aws_security_group" "app" {
  name        = "talentflow-app-sg"
  description = "Security group for TalentFlow application EC2 instances"
  vpc_id      = aws_vpc.talentflow.id

  ingress {
    description     = "Node.js application from ALB"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "talentflow-app-sg"
    Tier = "Private-App"
  }
}


resource "aws_security_group" "rds" {
  name        = "talentflow-rds-sg"
  description = "Security group for TalentFlow RDS MySQL"
  vpc_id      = aws_vpc.talentflow.id

  ingress {
    description     = "MySQL from application servers"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "talentflow-rds-sg"
    Tier = "Private-DB"
  }
}