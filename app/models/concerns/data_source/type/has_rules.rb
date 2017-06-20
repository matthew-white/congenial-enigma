# This module includes functionality for accessing the data source type's list
# of supported rules. An alert associated with a data source can be triggered
# only by one of the supported rules of the data source's type. For example, a
# rule designed to evaluate something ODK-specific cannot be applied to incoming
# data from another data source type.
#
# We can distinguish between a rule type -- represented by a rule class -- and a
# fully parameterized rule, which is represented by a rule object. The word
# "rule" can refer to either concept, similar to how the word "filter" can mean
# either a filtering process or an application of such a process. However, this
# module is concerned solely with rule types: you should read references to
# "supported rules" as having to do with rule types. That said, in general,
# unless specified otherwise, the term "rule" usually refers to a parameterized
# rule: the app uses rule types in fewer places.
#
# An Alert object validates that its rule type is supported by the alert's
# associated data sources, and it also validates its rule object in other ways.
#
module DataSource::Type::HasRules
  extend ActiveSupport::Concern

  included do
    # Avoid accessing this class attribute directly: use ::supported_rules and
    # ::with_rules.
    class_attribute :_rules, instance_accessor: false, instance_predicate: false
    self._rules = [].freeze
  end

  class_methods do
    def with_rules(rule_classes)
      unless rule_classes.all? { |rule_class| rule_class < Rule::Base }
        raise ArgumentError
      end
      # The class inherits its superclass's supported rules.
      self._rules = superclass._rules + rule_classes
      _rules.freeze
    end

    def supported_rules
      _rules
    end
  end
end
