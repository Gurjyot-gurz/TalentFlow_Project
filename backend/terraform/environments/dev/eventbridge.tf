# ============================================================
# TalentFlow - S3 EventBridge Notifications
# ============================================================

resource "aws_s3_bucket_notification" "talentflow_resume_events" {
  bucket = "talentflow-resumes-gurjyot-2026"

  eventbridge = true
}
# ============================================================
# TalentFlow - Resume Upload EventBridge Rule
# ============================================================

resource "aws_cloudwatch_event_rule" "talentflow_resume_uploaded" {
  name        = "talentflow-resume-uploaded"
  description = "Routes TalentFlow resume uploads from S3 to SQS"

  event_pattern = jsonencode({
    source = [
      "aws.s3"
    ]

    detail-type = [
      "Object Created"
    ]

    detail = {
      bucket = {
        name = [
          "talentflow-resumes-gurjyot-2026"
        ]
      }
    }
  })

  tags = {
    Name    = "talentflow-resume-uploaded"
    Project = "TalentFlow"
  }
}
# ============================================================
# TalentFlow - EventBridge → SQS Target
# ============================================================

resource "aws_cloudwatch_event_target" "talentflow_resume_sqs" {
  rule = aws_cloudwatch_event_rule.talentflow_resume_uploaded.name
  arn  = aws_sqs_queue.talentflow_resume_processing.arn
}
# ============================================================
# TalentFlow - SQS Policy for EventBridge
# ============================================================

resource "aws_sqs_queue_policy" "talentflow_resume_eventbridge" {
  queue_url = aws_sqs_queue.talentflow_resume_processing.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid    = "AllowEventBridgeSendMessage"
        Effect = "Allow"

        Principal = {
          Service = "events.amazonaws.com"
        }

        Action = "sqs:SendMessage"

        Resource = aws_sqs_queue.talentflow_resume_processing.arn

        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.talentflow_resume_uploaded.arn
          }
        }
      }
    ]
  })
}