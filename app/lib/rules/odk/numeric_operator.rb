class Rules::Odk::NumericOperator < Rule::Base
  attr_reader :field_name, :value

  def initialize(field_name:, value:)
    @field_name = field_name.dup.freeze
    @value = Float(value)
  end

  def test(submission)
    test = TestResult.new
    unless submission.key? field_name
      return test.with_error "The submission does not include data for the field #{field_name}. Does the form include this field?"
    end
    submission_value = submission[field_name]
    if submission_value.nil?
      return test.failure!
    elsif !submission_value.is_a?(Numeric)
      return test.with_error "The submission included a non-numeric value for the field #{field_name}. Make sure the field has a numeric type in the form, such as integer or decimal."
    end
    test.with_result test_submission_value(submission_value)
  end

  protected

  # Evaluates the submitted value of a field using a numeric operator, returning
  # true or false.
  def test_submission_value(numeric_value)
    raise NotImplementedError
  end
end
