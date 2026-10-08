output "vpc_id" {
  description = "TalentFlow VPC ID"
  value       = aws_vpc.talentflow.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value = [
    aws_subnet.public_a.id,
    aws_subnet.public_b.id
  ]
}

output "app_private_subnet_ids" {
  description = "Private application subnet IDs"
  value = [
    aws_subnet.app_a.id,
    aws_subnet.app_b.id
  ]
}

output "db_private_subnet_ids" {
  description = "Private database subnet IDs"
  value = [
    aws_subnet.db_a.id,
    aws_subnet.db_b.id
  ]
}

output "internet_gateway_id" {
  description = "TalentFlow Internet Gateway ID"
  value       = aws_internet_gateway.talentflow.id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value = [
    aws_nat_gateway.nat_a.id,
    aws_nat_gateway.nat_b.id
  ]
}

output "public_route_table_id" {
  description = "Public route table ID"
  value       = aws_route_table.public.id
}

output "app_route_table_ids" {
  description = "Private application route table IDs"
  value = [
    aws_route_table.app_a.id,
    aws_route_table.app_b.id
  ]
}

output "db_route_table_ids" {
  description = "Private database route table IDs"
  value = [
    aws_route_table.db_a.id,
    aws_route_table.db_b.id
  ]
}

output "alb_security_group_id" {
  description = "Application Load Balancer security group ID"
  value       = aws_security_group.alb.id
}

output "app_security_group_id" {
  description = "Application EC2 security group ID"
  value       = aws_security_group.app.id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "public_nacl_id" {
  description = "Public subnet NACL ID"
  value       = aws_network_acl.public.id
}

output "app_nacl_id" {
  description = "Application subnet NACL ID"
  value       = aws_network_acl.app.id
}

output "db_nacl_id" {
  description = "Database subnet NACL ID"
  value       = aws_network_acl.db.id
}
output "talentflow_api_url" {
  value = aws_apigatewayv2_stage.talentflow_api.invoke_url
}