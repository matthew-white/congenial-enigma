class Rules::Odk::StringEquality < Rules::Odk::StringOperator
  with_title 'equals the exact text'

  protected

  def test_submission_value(string_value)
    string_value == value
  end
end
