class Rules::Odk::StringOperator < Rule::Base
  attr_reader :field_name, :value

  def initialize(field_name:, value:, case_sensitive:)
    @field_name = field_name.dup.freeze
    @case_sensitive = case case_sensitive
                      when 'true'
                        true
                      when 'false'
                        false
                      else
                        raise ArgumentError
                      end
    @value = @case_sensitive ? value.dup : value.downcase
    @value.freeze
  end

  def case_sensitive?
    @case_sensitive
  end

  def case_insensitive?
    !case_sensitive?
  end

  def test(submission)
    test = TestResult.new
    unless submission.key? field_name
      return test.with_error "The submission does not include data for the field #{field_name}. Does the form include this field?"
    end
    submission_value = submission[field_name]
    if submission_value.nil?
      return test.failure!
    elsif !submission_value.is_a?(String)
      return test.with_error "The submission included a non-string value for the field #{field_name}. Make sure the field has the correct type in the form."
    end
    submission_value = submission_value.downcase if case_insensitive?
    test.with_result test_submission_value(submission_value)
  end

  protected

  # Evaluates the submitted value of a field using a string operator, returning
  # true or false.
  def test_submission_value(string_value)
    raise NotImplementedError
  end
end
