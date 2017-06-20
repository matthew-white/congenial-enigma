class Rules::Odk::GreaterThan < Rules::Odk::NumericOperator
  with_title 'is greater than'

  protected

  def test_submission_value(numeric_value)
    numeric_value > value
  end
end
