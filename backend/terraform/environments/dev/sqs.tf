resource "aws_sqs_queue" "talentflow_resume_dlq" {
  name = "talentflow-resume-processing-dlq"

  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name    = "talentflow-resume-processing-dlq"
    Project = "TalentFlow"
  }
}

resource "aws_sqs_queue" "talentflow_resume_processing" {
  name = "talentflow-resume-processing"

  visibility_timeout_seconds = 60
  message_retention_seconds  = 345600 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.talentflow_resume_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name    = "talentflow-resume-processing"
    Project = "TalentFlow"
  }
}