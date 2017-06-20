module IntegrationsHelper
  def dynamic_rule_fields(rule_class)
    if rule_class < Rules::Odk::NumericOperator
      'numeric_rule_value'
    elsif rule_class == Rules::Odk::RegexpMatch
      'regexp_match_value rule_case_sensitive'
    elsif rule_class < Rules::Odk::StringOperator
      'string_rule_value rule_case_sensitive'
    else
      raise NotImplementedError
    end
  end

  def draft_rule_value(rule_class, except: nil)
    if @draft.rule_type.blank? || @draft.rule_data.blank? ||
      !(@draft.rule_class <= rule_class) || excepted_rule_class?(except)
      return nil
    end
    @draft.rule_data['value']
  end

  protected

  def excepted_rule_class?(except)
    return false unless except
    if except.is_a? Enumerable
      except.any? { |klass| @draft.rule_class <= klass }
    else
      @draft.rule_class <= except
    end
  end
end
