resource "aws_iam_role" "talentflow_api_lambda" {
  name = "TalentFlow-API-Lambda-Role"

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
    Name    = "TalentFlow-API-Lambda-Role"
    Project = "TalentFlow"
  }
}


resource "aws_iam_role_policy" "talentflow_api_lambda" {

  name = "TalentFlow-API-Lambda-SQS-Policy"

  role = aws_iam_role.talentflow_api_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [

      {
        Effect = "Allow"

        Action = [
          "sqs:SendMessage"
        ]

        Resource = aws_sqs_queue.talentflow_resume_processing.arn
      },

      {
        Effect = "Allow"

        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]

        Resource = "*"
      }
    ]
  })
}


resource "aws_lambda_function" "talentflow_api" {

  function_name = "talentflow-api-receiver"

  role = aws_iam_role.talentflow_api_lambda.arn

  runtime = "nodejs24.x"

  handler = "index.handler"

  filename = abspath("${path.module}/../../../lambda-api/resumeApi.zip")

  source_code_hash = filebase64sha256(
    abspath("${path.module}/../../../lambda-api/resumeApi.zip")
  )

  timeout = 10

  memory_size = 128

  environment {
    variables = {
      QUEUE_URL = aws_sqs_queue.talentflow_resume_processing.id
    }
  }

  tags = {
    Name    = "talentflow-api-receiver"
    Project = "TalentFlow"
  }
}
resource "aws_apigatewayv2_api" "talentflow_api" {

  name = "talentflow-api"

  protocol_type = "HTTP"

  description = "TalentFlow serverless API integration"
}


resource "aws_apigatewayv2_integration" "talentflow_api_lambda" {

  api_id = aws_apigatewayv2_api.talentflow_api.id

  integration_type = "AWS_PROXY"

  integration_uri = aws_lambda_function.talentflow_api.invoke_arn

  payload_format_version = "2.0"
}


resource "aws_apigatewayv2_route" "talentflow_resume_process" {

  api_id = aws_apigatewayv2_api.talentflow_api.id

  route_key = "POST /resume/process"

  target = "integrations/${aws_apigatewayv2_integration.talentflow_api_lambda.id}"
}


resource "aws_apigatewayv2_stage" "talentflow_api" {

  api_id = aws_apigatewayv2_api.talentflow_api.id

  name = "$default"

  auto_deploy = true
}


resource "aws_lambda_permission" "talentflow_api_gateway" {

  statement_id = "AllowTalentFlowAPIGateway"

  action = "lambda:InvokeFunction"

  function_name = aws_lambda_function.talentflow_api.function_name

  principal = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.talentflow_api.execution_arn}/*/*"
}