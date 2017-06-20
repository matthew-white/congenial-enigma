class IntegrationsController < ApplicationController
  add_breadcrumb 'My Integrations', :integrations_path, except: :index

  # For draft updates, maps rule_data keys to their associated parameter keys.
  RULE_DATA_DRAFT_PARAMS = {
    field_name: [:rule_field_name],
    value: %i[numeric_rule_value string_rule_value regexp_match_value],
    case_sensitive: [:rule_case_sensitive]
  }.freeze

  def index
    @source_alerts = DataSourceAlert
                       .joins(:alert, data_source: :configured_service)
                       .reorder(<<-SQL)
                         configured_services.name,
                         data_sources.name,
                         alerts.rule_data ->> 'field_name',
                         data_source_alerts.created_at
                         SQL
                       .load
    add_breadcrumb 'My Integrations' if @source_alerts.any?
  end

  def new
    @source_services = ConfiguredServices::Odk.order_by_name
    @sources = DataSources::Odk.order_by_name
    @destination_services = ConfiguredServices::Gmail.order_by_name.load
    @destinations = DataDestinations::Gmail.order_by_name.load
    @alert = Alert.new
    set_draft
    add_breadcrumb 'Add Integration'
  end

  def create
    Alert.create_for_data_source(integration_params)
    # TODO: Error handling.
    redirect_to integrations_path
  end

  def destroy
    Alert.find(params[:id]).destroy
    redirect_to integrations_path
  end

  def save_draft
    Alert.draft.dependably_update(draft_params)
    head :ok
  end

  protected

  def set_draft
    @draft = Alert.draft
    service = @draft.data_destination_configured_service
    if service && service.class.oauthable? && !service.safely_connected?
      @draft.dependably_update(data_destination_configured_service_id: nil)
    end
  end

  def validate_rule_type_param!
    source = DataSource.find(params[:data_source_id])
    supported_rules = source.class.supported_rules
    if supported_rules.none? { |rule_class| rule_class.name == params[:rule_type] }
      raise ArgumentError
    end
  end

  def integration_params
    validate_rule_type_param!
    rule_data_keys = params.require(:rule_data).keys
    # Permit rule_data parameters whose values are permitted scalars.
    params.permit :data_source_id, :data_destination_id, :rule_type,
                  { rule_data: rule_data_keys }, :message
  end

  def draft_rule_data
    RULE_DATA_DRAFT_PARAMS.reduce({}) do |rule_data, (rule_data_key, param_keys)|
      param_keys.each do |param_key|
        if params.key? param_key
          rule_data[rule_data_key] = params.permit(param_key).fetch(param_key)
          break
        end
      end
      rule_data
    end
  end

  def draft_params
    draft_params = params.permit(
      :data_source_configured_service_id, :data_source_id, :rule_type, :message,
      :data_destination_configured_service_id, :data_destination_id
    )
    draft_params[:rule_data] = draft_rule_data if params.key?(:rule_type)
    draft_params
  end
end
