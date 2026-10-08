resource "aws_lb_target_group" "talentflow" {
  name     = "talentflow-backend-tg"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = aws_vpc.talentflow.id

  target_type = "instance"

  health_check {
    enabled             = true
    path                = "/api/health"
    protocol            = "HTTP"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name = "talentflow-backend-tg"
  }
}
resource "aws_lb" "talentflow" {
  name               = "talentflow-alb"
  internal           = false
  load_balancer_type = "application"

  security_groups = [
    aws_security_group.alb.id
  ]

  subnets = [
    aws_subnet.public_a.id,
    aws_subnet.public_b.id
  ]

  enable_deletion_protection = false

  tags = {
    Name = "talentflow-alb"
  }
}
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.talentflow.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.talentflow.arn
  }
}