class Rules::Odk::NumericEquality < Rules::Odk::NumericOperator
  with_title 'is equal to the number'

  protected

  def test_submission_value(numeric_value)
    numeric_value == value
  end
end
