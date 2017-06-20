class Rules::Odk::StartWith < Rules::Odk::StringOperator
  with_title 'starts with the text'

  protected

  def test_submission_value(string_value)
    string_value.start_with? value
  end
end
