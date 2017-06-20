class AlertDraft < ApplicationRecord
  # TODO: Fix these.
  # validate :validate_count
  # validate :validate_dependencies
  # validate :data_source_must_match_configured_service
  # validate :data_destination_must_match_configured_service

  validate :rule_must_be_supported

  # The order of ATTRIBUTES matters: an attribute can be updated only if all
  # previous attributes are set. For example, :data_source_id can be updated
  # only if :data_source_configured_service_id is set: see
  # #validate_dependencies. If one attribute follows another, it is "dependent"
  # on that attribute, as it can be updated only if the other is set.
  ATTRIBUTES = %i[
    data_source_configured_service_id
    data_source_id
    rule_type
    rule_data
    message
    data_destination_configured_service_id
    data_destination_id
  ].freeze

  def data_source_configured_service
    if data_source_configured_service_id.present?
      ConfiguredService.find(data_source_configured_service_id)
    else
      nil
    end
  end

  def data_source
    data_source_id.present? ? DataSource.find(data_source_id) : nil
  end

  def data_destination_configured_service
    if data_destination_configured_service_id.present?
      ConfiguredService.find(data_destination_configured_service_id)
    else
      nil
    end
  end

  def data_destination
    if data_destination_id.present?
      DataDestination.find(data_destination_id)
    else
      nil
    end
  end

  def rule_class
    rule_type.present? ? rule_type.constantize : nil
  end

  # Updates a set of adjacent attributes, then sets their dependent attributes
  # to nil.
  def dependably_update(attributes)
    seen_attribute_to_update = seen_attribute_not_to_update = false
    AlertDraft::ATTRIBUTES.each do |name|
      if attributes.key? name
        value = !seen_attribute_not_to_update ? attributes[name] : nil
        write_attribute name, value
        seen_attribute_to_update = true
      elsif seen_attribute_to_update
        seen_attribute_not_to_update = true
        write_attribute name, nil
      else
        next
      end
    end
    save
  end

  protected

  def validate_count
    if AlertDraft.all.any? && new_record?
      errors.add :base, 'Only one draft can be saved'
    end
  end

  def validate_dependencies
    previous_value = read_attribute(ATTRIBUTES.first)
    1.upto(ATTRIBUTES.size - 1) do |i|
      current_attribute = ATTRIBUTES[i]
      current_value = read_attribute(current_attribute)
      if previous_value.nil? && !current_value.nil?
        errors.add current_attribute, "has a nil dependency"
        return
      end
      previous_value = current_value
    end
  end

  def data_source_must_match_configured_service
    return unless data_source_configured_service_id && data_source_id
    data_source = self.data_source
    return if data_source.nil?
    unless data_source_configured_service_id ==
           data_source.configured_service_id
      errors.add :data_source_id, 'must match configured_service'
    end
  end

  def data_destination_must_match_configured_service
    return unless data_destination_configured_service_id && data_destination_id
    destination = self.data_destination
    return if destination.nil?
    unless data_destination_configured_service_id ==
           destination.configured_service_id
      errors.add :data_destination_id, 'must match configured_service'
    end
  end

  def rule_must_be_supported
    return if rule_type.nil?
    is_supported = DataSource.type_classes.any? do |data_source_class|
      data_source_class.supported_rules.any? do |rule_class|
        rule_class.name == rule_type
      end
    end
    unless is_supported
      errors.add :rule_type, 'is not supported'
    end
  end
end
