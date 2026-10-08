data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

resource "aws_launch_template" "talentflow" {
  name_prefix   = "talentflow-backend-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  iam_instance_profile {
    name = aws_iam_instance_profile.talentflow_ec2.name
  }

  vpc_security_group_ids = [
    aws_security_group.app.id
  ]

  user_data = base64encode(<<-EOF
    #!/bin/bash

    set -e

    dnf update -y
    dnf install -y docker

    systemctl enable docker
    systemctl start docker

    usermod -aG docker ec2-user

    aws ecr get-login-password --region ${var.aws_region} | \
      docker login --username AWS --password-stdin \
      318003418338.dkr.ecr.${var.aws_region}.amazonaws.com

    docker pull 318003418338.dkr.ecr.${var.aws_region}.amazonaws.com/talentflow-backend:1.1

    docker run -d \
      --name talentflow-backend \
      --restart unless-stopped \
      -p 5000:5000 \
      -e PORT=5000 \
      -e DB_HOST="${var.db_host}" \
      -e DB_PORT="${var.db_port}" \
      -e DB_USER="${var.db_user}" \
      -e DB_PASSWORD="${var.db_password}" \
      -e DB_NAME="${var.db_name}" \
      -e JWT_SECRET="${var.jwt_secret}" \
      -e AWS_REGION="${var.aws_region}" \
      -e S3_BUCKET_NAME="${var.s3_bucket_name}" \
      318003418338.dkr.ecr.${var.aws_region}.amazonaws.com/talentflow-backend:1.1
  EOF
  )

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name = "talentflow-backend"
      Tier = "Private-App"
    }
  }

  tags = {
    Name = "talentflow-backend-launch-template"
  }
}
resource "aws_autoscaling_group" "talentflow" {
  name = "talentflow-asg"

  min_size         = 2
  desired_capacity = 2
  max_size         = 4

  vpc_zone_identifier = [
    aws_subnet.app_a.id,
    aws_subnet.app_b.id
  ]

  target_group_arns = [
    aws_lb_target_group.talentflow.arn
  ]

  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.talentflow.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "talentflow-backend"
    propagate_at_launch = true
  }

  tag {
    key                 = "Tier"
    value               = "Private-App"
    propagate_at_launch = true
  }
}