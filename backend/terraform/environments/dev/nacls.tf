# ============================================================
# PUBLIC SUBNET NACL
# ============================================================

resource "aws_network_acl" "public" {
  vpc_id = aws_vpc.talentflow.id

  tags = {
    Name = "talentflow-public-nacl"
    Tier = "Public"
  }
}

resource "aws_network_acl_rule" "public_ingress_http" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

resource "aws_network_acl_rule" "public_ingress_https" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_ingress_ephemeral" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 120
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "public_ingress_app" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 130
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 5000
  to_port        = 5000
}

resource "aws_network_acl_rule" "public_egress_http" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

resource "aws_network_acl_rule" "public_egress_https" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 110
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_egress_ephemeral" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 120
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "public_egress_app" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 130
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 5000
  to_port        = 5000
}


# ============================================================
# APPLICATION SUBNET NACL
# ============================================================

resource "aws_network_acl" "app" {
  vpc_id = aws_vpc.talentflow.id

  tags = {
    Name = "talentflow-app-nacl"
    Tier = "Private-App"
  }
}

resource "aws_network_acl_rule" "app_ingress_http" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "app_ingress_backend" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 5000
  to_port        = 5000
}

resource "aws_network_acl_rule" "app_ingress_mysql_response" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 120
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.21.0/24"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "app_ingress_mysql_response_b" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 121
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.22.0/24"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "app_egress_mysql" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 100
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.21.0/24"
  from_port      = 3306
  to_port        = 3306
}

resource "aws_network_acl_rule" "app_egress_mysql_b" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 101
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.22.0/24"
  from_port      = 3306
  to_port        = 3306
}

resource "aws_network_acl_rule" "app_egress_http" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 110
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

resource "aws_network_acl_rule" "app_egress_https" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 120
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "app_egress_ephemeral" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 130
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}


# ============================================================
# DATABASE SUBNET NACL
# ============================================================

resource "aws_network_acl" "db" {
  vpc_id = aws_vpc.talentflow.id

  tags = {
    Name = "talentflow-db-nacl"
    Tier = "Private-DB"
  }
}

resource "aws_network_acl_rule" "db_ingress_mysql_a" {
  network_acl_id = aws_network_acl.db.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.11.0/24"
  from_port      = 3306
  to_port        = 3306
}

resource "aws_network_acl_rule" "db_ingress_mysql_b" {
  network_acl_id = aws_network_acl.db.id
  rule_number    = 101
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.12.0/24"
  from_port      = 3306
  to_port        = 3306
}

resource "aws_network_acl_rule" "db_egress_ephemeral_a" {
  network_acl_id = aws_network_acl.db.id
  rule_number    = 100
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.11.0/24"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "db_egress_ephemeral_b" {
  network_acl_id = aws_network_acl.db.id
  rule_number    = 101
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.12.0/24"
  from_port      = 1024
  to_port        = 65535
}


# ============================================================
# NACL ASSOCIATIONS
# ============================================================

resource "aws_network_acl_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  network_acl_id = aws_network_acl.public.id
}

resource "aws_network_acl_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  network_acl_id = aws_network_acl.public.id
}

resource "aws_network_acl_association" "app_a" {
  subnet_id      = aws_subnet.app_a.id
  network_acl_id = aws_network_acl.app.id
}

resource "aws_network_acl_association" "app_b" {
  subnet_id      = aws_subnet.app_b.id
  network_acl_id = aws_network_acl.app.id
}

resource "aws_network_acl_association" "db_a" {
  subnet_id      = aws_subnet.db_a.id
  network_acl_id = aws_network_acl.db.id
}

resource "aws_network_acl_association" "db_b" {
  subnet_id      = aws_subnet.db_b.id
  network_acl_id = aws_network_acl.db.id
}