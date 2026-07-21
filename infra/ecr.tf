resource "aws_ecr_repository" "api" {
  name                 = "${var.project}-api"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
  tags                 = { Name = "${var.project}-api" }
}

output "ecr_repo_url" {
  value = aws_ecr_repository.api.repository_url
}
