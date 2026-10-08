# ============================================================
# TalentFlow - Lambda Execution Role
# ============================================================

resource "aws_iam_role" "talentflow_lambda" {
  name = "TalentFlow-Lambda-Execution-Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "lambda.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name    = "TalentFlow-Lambda-Execution-Role"
    Project = "TalentFlow"
  }
}
# ============================================================
# Lambda - CloudWatch Logs Permissions
# ============================================================

resource "aws_iam_role_policy" "talentflow_lambda_logs" {
  name = "TalentFlow-Lambda-CloudWatch-Logs"
  role = aws_iam_role.talentflow_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]

        Resource = "arn:aws:logs:us-east-1:318003418338:*"
      }
    ]
  })
}


# ============================================================
# Lambda - SQS Permissions
# ============================================================

resource "aws_iam_role_policy" "talentflow_lambda_sqs" {
  name = "TalentFlow-Lambda-SQS"
  role = aws_iam_role.talentflow_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]

        Resource = aws_sqs_queue.talentflow_resume_processing.arn
      }
    ]
  })
}


# ============================================================
# Lambda - S3 Resume Read Permissions
# ============================================================

resource "aws_iam_role_policy" "talentflow_lambda_s3" {
  name = "TalentFlow-Lambda-S3-Read"
  role = aws_iam_role.talentflow_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "s3:GetObject"
        ]

        Resource = "arn:aws:s3:::talentflow-resumes-gurjyot-2026/*"
      }
    ]
  })
}
resource "aws_iam_role_policy_attachment" "talentflow_lambda_vpc" {
  role       = aws_iam_role.talentflow_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}