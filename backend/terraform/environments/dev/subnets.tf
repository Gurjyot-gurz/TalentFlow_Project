resource "aws_internet_gateway" "talentflow" {
  vpc_id = aws_vpc.talentflow.id

  tags = {
    Name = "talentflow-igw"
  }
}
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.talentflow.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "talentflow-public-a"
    Tier = "Public"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.talentflow.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name = "talentflow-public-b"
    Tier = "Public"
  }
}

resource "aws_subnet" "app_a" {
  vpc_id            = aws_vpc.talentflow.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "talentflow-app-a"
    Tier = "Private-App"
  }
}

resource "aws_subnet" "app_b" {
  vpc_id            = aws_vpc.talentflow.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "talentflow-app-b"
    Tier = "Private-App"
  }
}

resource "aws_subnet" "db_a" {
  vpc_id            = aws_vpc.talentflow.id
  cidr_block        = "10.0.21.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "talentflow-db-a"
    Tier = "Private-DB"
  }
}

resource "aws_subnet" "db_b" {
  vpc_id            = aws_vpc.talentflow.id
  cidr_block        = "10.0.22.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "talentflow-db-b"
    Tier = "Private-DB"
  }
}