class Rules::Odk::EndWith < Rules::Odk::StringOperator
  with_title 'ends with the text'

  protected

  def test_submission_value(string_value)
    string_value.end_with? value
  end
end
