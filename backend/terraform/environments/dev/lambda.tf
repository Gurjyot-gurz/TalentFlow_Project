# ============================================================
# TalentFlow - Resume Processor Lambda
# ============================================================

resource "aws_lambda_function" "talentflow_resume_processor" {
  function_name = "talentflow-resume-processor"

  role = aws_iam_role.talentflow_lambda.arn

  runtime = "nodejs24.x"
  handler = "resumeProcessor.handler"

  filename         = "../../../lambda/resumeProcessor.zip"
  source_code_hash = filebase64sha256("../../../lambda/resumeProcessor.zip")

  timeout     = 30
  memory_size = 256
  vpc_config {
    subnet_ids = [
      "subnet-0d89138e381621b34",
      "subnet-08b5c74e247ba65f6"
    ]

    security_group_ids = [
      aws_security_group.talentflow_lambda.id
    ]
  }

  environment {
    variables = {
      S3_BUCKET     = "talentflow-resumes-gurjyot-2026"
      SNS_TOPIC_ARN = aws_sns_topic.talentflow_notifications.arn

      DB_HOST     = var.db_host
      DB_PORT     = tostring(var.db_port)
      DB_USER     = var.db_user
      DB_PASSWORD = var.db_password
      DB_NAME     = var.db_name
    }
  }

  tags = {
    Name    = "talentflow-resume-processor"
    Project = "TalentFlow"
  }
}
# ============================================================
# TalentFlow - SQS → Lambda Event Source Mapping
# ============================================================

resource "aws_lambda_event_source_mapping" "talentflow_resume_sqs" {
  event_source_arn = aws_sqs_queue.talentflow_resume_processing.arn
  function_name    = aws_lambda_function.talentflow_resume_processor.arn

  batch_size = 1

  enabled = true
}