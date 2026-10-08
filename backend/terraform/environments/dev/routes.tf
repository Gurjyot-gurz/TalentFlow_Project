# ============================================================
# PUBLIC ROUTE TABLE
# ============================================================

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.talentflow.id

  tags = {
    Name = "talentflow-public-rt"
    Tier = "Public"
  }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.talentflow.id
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}


# ============================================================
# PRIVATE APPLICATION ROUTE TABLES
# ============================================================

resource "aws_route_table" "app_a" {
  vpc_id = aws_vpc.talentflow.id

  tags = {
    Name = "talentflow-app-a-rt"
    Tier = "Private-App"
  }
}

resource "aws_route_table" "app_b" {
  vpc_id = aws_vpc.talentflow.id

  tags = {
    Name = "talentflow-app-b-rt"
    Tier = "Private-App"
  }
}


# ============================================================
# PRIVATE DATABASE ROUTE TABLES
# ============================================================

resource "aws_route_table" "db_a" {
  vpc_id = aws_vpc.talentflow.id

  tags = {
    Name = "talentflow-db-a-rt"
    Tier = "Private-DB"
  }
}

resource "aws_route_table" "db_b" {
  vpc_id = aws_vpc.talentflow.id

  tags = {
    Name = "talentflow-db-b-rt"
    Tier = "Private-DB"
  }
}


# ============================================================
# DATABASE SUBNET ASSOCIATIONS
# ============================================================

resource "aws_route_table_association" "db_a" {
  subnet_id      = aws_subnet.db_a.id
  route_table_id = aws_route_table.db_a.id
}

resource "aws_route_table_association" "db_b" {
  subnet_id      = aws_subnet.db_b.id
  route_table_id = aws_route_table.db_b.id
}


# ============================================================
# APPLICATION SUBNET ASSOCIATIONS
# ============================================================

resource "aws_route_table_association" "app_a" {
  subnet_id      = aws_subnet.app_a.id
  route_table_id = aws_route_table.app_a.id
}

resource "aws_route_table_association" "app_b" {
  subnet_id      = aws_subnet.app_b.id
  route_table_id = aws_route_table.app_b.id
}