class AlertDraft < ApplicationRecord
  # TODO: Fix these.
  # validate :validate_count
  # validate :validate_dependencies
  # validate :data_source_must_match_configured_service
  # validate :data_destination_must_match_configured_service

  # The order of ATTRIBUTES matters: an attribute can be updated only if all
  # previous attributes are present. For example, :data_source_id can be updated
  # only if :data_source_configured_service_id is present: see
  # #validate_dependencies. If one attribute follows another, it is "dependent"
  # on that attribute, as it can be updated only if the other is present.
  ATTRIBUTES = [
    :data_source_configured_service_id,
    :data_source_id,
    :field_name,
    :rule_type,
    :rule_value,
    :message,
    :data_destination_configured_service_id,
    :data_destination_id
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
    data_destination.present? ? DataDestination.find(data_destination_id) : nil
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
      if previous_value.blank? && current_value.present?
        errors.add current_attribute, "has a blank dependency"
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
end
