resource "aws_security_group" "talentflow_lambda" {
  name        = "talentflow-lambda-sg"
  description = "Security group for TalentFlow Lambda functions"
  vpc_id      = aws_vpc.talentflow.id

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "talentflow-lambda-sg"
    Project = "TalentFlow"
  }
}
resource "aws_vpc_security_group_ingress_rule" "rds_from_lambda" {
  security_group_id            = "sg-01400c619c32d2d9b"
  referenced_security_group_id = aws_security_group.talentflow_lambda.id

  from_port   = 3306
  to_port     = 3306
  ip_protocol = "tcp"

  description = "Allow TalentFlow Lambda to access RDS MySQL"
}