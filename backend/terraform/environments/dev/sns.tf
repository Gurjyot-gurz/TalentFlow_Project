# ============================================================
# TalentFlow - SNS Notification Topic
# ============================================================

resource "aws_sns_topic" "talentflow_notifications" {
  name = "talentflow-notifications"

  tags = {
    Name    = "talentflow-notifications"
    Project = "TalentFlow"
  }
}
# ============================================================
# Lambda - SNS Publish Permission
# ============================================================

resource "aws_iam_role_policy" "talentflow_lambda_sns" {
  name = "TalentFlow-Lambda-SNS"
  role = aws_iam_role.talentflow_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "sns:Publish"
        ]

        Resource = aws_sns_topic.talentflow_notifications.arn
      }
    ]
  })
}