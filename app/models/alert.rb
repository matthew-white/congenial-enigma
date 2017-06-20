class Alert < ApplicationRecord
  has_many :data_source_alerts, dependent: :destroy
  has_many :data_sources, through: :data_source_alerts

  belongs_to :data_destination
  validates :data_destination, presence: true

  validate :rule_must_be_supported
  validate :rule_data_must_be_well_structured
  validate :rule_must_instantiate

  validates :message, presence: true

  # #create_for_data_source is similar to #create, but it also creates a
  # DataSourceAlert record to associate the new alert with a data source. The
  # two creations are wrapped in a transaction, so neither object is created
  # unless both are. Specify the same arguments as for #create, but also specify
  # a data_source_id as part of the attributes Hash. Like #create,
  # #create_for_data_source returns the Alert object regardless of whether it
  # was successfully saved to the database.
  def self.create_for_data_source(attributes, &block)
    attributes = attributes.dup
    source_id = attributes.delete(:data_source_id)
    raise ArgumentError unless source_id

    alert = nil
    ActiveRecord::Base.transaction do
      alert = Alert.new(attributes, &block)
      if alert.save
        data_source_alert = DataSourceAlert.new(
          data_source_id: source_id,
          alert_id: alert.id
        )
        if data_source_alert.save
          AlertDraft.first&.destroy
        else
          raise ActiveRecord::Rollback
        end
      end
    end
    alert
  end

  def self.draft
    AlertDraft.first || AlertDraft.new
  end

  # Returns the cached rule.
  def rule
    @rule ||= reload_rule
  end

  # Resets the rule.
  def reload_rule
    @rule = rule_type.constantize.new(**rule_data.symbolize_keys)
  end

  protected

  def supported_rule?
    data_sources.distinct.pluck(:type).each do |source_type|
      supported_rules = source_type.constantize.supported_rules
      if supported_rules.none? { |rule_class| rule_class.name == rule_type }
        return false
      end
    end
    true
  end

  # #rule_must_be_supported validates that the rule type is supported by each of
  # the alert's data sources. It implicitly validates that rule_type is the name
  # of a Rule::Base subclass.
  def rule_must_be_supported
    unless supported_rule?
      errors.add :rule_type, 'is not supported by one or more of the alert’s data sources'
    end
  end

  # #valid_rule_data_structure? returns true if rule_data is well-structured and
  # false if not. rule_data must be a Hash whose keys and non-Enumerable values
  # are String. It may store Hash and Array values, but they must have a similar
  # structure: keys and non-Enumerable values/elements must be String, including
  # recursively.
  def valid_rule_data_structure?
    return false unless rule_data.is_a? Hash
    # Depth-first search
    stack = [rule_data]
    while stack.any?
      element = stack.pop
      if element.is_a? Hash
        element.each do |key, value|
          return false unless key.is_a? String
          stack << value
        end
      elsif element.is_a? Array
        stack.concat element
      else
        return false unless element.is_a? String
      end
    end
    true
  end

  def rule_data_must_be_well_structured
    unless valid_rule_data_structure?
      errors.add :rule_data, 'has an invalid structure'
    end
  end

  def safe_to_instantiate_rule?
    supported_rule? && valid_rule_data_structure?
  end

  def rule_must_instantiate
    return unless safe_to_instantiate_rule?
    begin
      reload_rule
    rescue => e
      Rails.logger.error e.backtrace.join("\n")
      errors.add :base, 'Invalid rule'
    end
  end
end
