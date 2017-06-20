# Rule::Base encapsulates an alert's parameterized rule, against which incoming
# data is evaluated. Following these steps to add a new rule type:
#
#   1. Define a subclass of Rule::Base. If the rule type is associated with a
#      single data source type, define the class in the data source type's
#      associated Rules module. For example, define a rule type for ODK data
#      sources in the Rules::Odk module: something like Rules::Odk::Example.
#   2. Give the rule type a human-friendly title using ::with_title.
#   3. Override #test.
#
# The Alert model instantiates Rule::Base objects by passing a Hash as keyword
# arguments. Thus, the constructor of a Rule::Base subclass must accept keyword
# arguments. The Alert model passes String scalars: non-Enumerable values of the
# Hash are String. It is the constructor's responsibility to parse and validate
# arguments. (At some point this last step may be automated using an approach
# similar to ModelAttributes::Settings.)
#
# See also DataSource::Type::HasRules for a discussion of the difference between
# a rule type and a parameterized rule. (The word "rule" can mean either, but
# they are two different concepts.)
#
class Rule::Base
  # Avoid accessing this class attribute directly: use ::title and ::with_title.
  class_attribute :_title

  # Sets a human-friendly title for the rule type.
  def self.with_title(title)
    self._title = title.dup.freeze
  end

  # Returns a human-friendly title for the rule type.
  def self.title
    _title || name
  end

  # Evaluates data against the parameterized rule, returning a TestResult.
  def test(data)
    raise NotImplementedError
  end

  # TestResult encapsulates the result of a parameterized rule's test. The
  # result of a test is either success (true) or failure (false), and a
  # TestResult may be set only once before becoming immutable. If the test is
  # passed invalid data, a TestResult may also be given an error message for
  # display.
  class TestResult
    attr_reader :result

    def initialize
      @error = nil
    end

    def success?
      @result == true
    end

    def failure?
      @result == false
    end

    def unknown?
      @result.nil?
    end

    def with_result(result)
      @result = !!result
      @error.freeze
      freeze
    end

    def success!
      with_result true
    end

    def failure!
      with_result false
    end

    def error
      @error
    end

    def error?
      error.present?
    end

    def with_error(text)
      @error = text.dup.freeze
      freeze
    end
  end
end
