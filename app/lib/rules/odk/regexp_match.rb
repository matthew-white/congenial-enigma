class Rules::Odk::RegexpMatch < Rules::Odk::StringOperator
  with_title 'matches the regular expression'

  protected

  def test_submission_value(string_value)
    string_value.match? value
  end
end
