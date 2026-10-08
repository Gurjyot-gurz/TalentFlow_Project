resource "aws_db_subnet_group" "talentflow" {
  name = "talentflow-db-subnet-group"
  subnet_ids = [
    aws_subnet.db_a.id,
    aws_subnet.db_b.id
  ]

  tags = {
    Name = "talentflow-db-subnet-group"
    Tier = "Private-DB"
  }
}