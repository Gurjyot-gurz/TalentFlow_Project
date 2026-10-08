resource "aws_autoscaling_policy" "talentflow_cpu" {
  name                   = "talentflow-cpu-target-tracking"
  autoscaling_group_name = aws_autoscaling_group.talentflow.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }

    target_value = 60.0
  }
}