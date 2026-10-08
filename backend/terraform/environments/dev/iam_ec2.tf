resource "aws_iam_role" "talentflow_ec2" {
  name = "talentflow-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "talentflow-ec2-role"
    Tier = "Private-App"
  }
}
resource "aws_iam_role_policy" "talentflow_ec2_ecr" {
  name = "talentflow-ec2-ecr-read"
  role = aws_iam_role.talentflow_ec2.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "ecr:GetAuthorizationToken"
        ]

        Resource = "*"
      },
      {
        Effect = "Allow"

        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]

        Resource = "arn:aws:ecr:us-east-1:318003418338:repository/talentflow-backend"
      }
    ]
  })
}
resource "aws_iam_role_policy" "talentflow_ec2_s3" {
  name = "talentflow-ec2-s3-resume-access"
  role = aws_iam_role.talentflow_ec2.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]

        Resource = "arn:aws:s3:::talentflow-resumes-gurjyot-2026/*"
      },
      {
        Effect = "Allow"

        Action = [
          "s3:ListBucket"
        ]

        Resource = "arn:aws:s3:::talentflow-resumes-gurjyot-2026"
      }
    ]
  })
}
resource "aws_iam_instance_profile" "talentflow_ec2" {
  name = "talentflow-ec2-instance-profile"
  role = aws_iam_role.talentflow_ec2.name

  tags = {
    Name = "talentflow-ec2-instance-profile"
  }
}