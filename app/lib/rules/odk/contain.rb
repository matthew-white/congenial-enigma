class Rules::Odk::Contain < Rules::Odk::StringOperator
  with_title 'contains the text'

  protected

  def test_submission_value(string_value)
    string_value.include? value
  end
end
