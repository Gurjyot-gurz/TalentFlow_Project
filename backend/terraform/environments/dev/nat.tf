# ============================================================
# ELASTIC IPs FOR NAT GATEWAYS
# ============================================================

resource "aws_eip" "nat_a" {
  domain = "vpc"

  tags = {
    Name = "talentflow-nat-a-eip"
  }
}

resource "aws_eip" "nat_b" {
  domain = "vpc"

  tags = {
    Name = "talentflow-nat-b-eip"
  }
}


# ============================================================
# NAT GATEWAY - AVAILABILITY ZONE A
# ============================================================

resource "aws_nat_gateway" "nat_a" {
  allocation_id = aws_eip.nat_a.id
  subnet_id     = aws_subnet.public_a.id

  depends_on = [
    aws_internet_gateway.talentflow
  ]

  tags = {
    Name = "talentflow-nat-a"
  }
}


# ============================================================
# NAT GATEWAY - AVAILABILITY ZONE B
# ============================================================

resource "aws_nat_gateway" "nat_b" {
  allocation_id = aws_eip.nat_b.id
  subnet_id     = aws_subnet.public_b.id

  depends_on = [
    aws_internet_gateway.talentflow
  ]

  tags = {
    Name = "talentflow-nat-b"
  }
}


# ============================================================
# PRIVATE APPLICATION ROUTES
# ============================================================

resource "aws_route" "app_a_internet" {
  route_table_id         = aws_route_table.app_a.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_a.id
}

resource "aws_route" "app_b_internet" {
  route_table_id         = aws_route_table.app_b.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_b.id
}