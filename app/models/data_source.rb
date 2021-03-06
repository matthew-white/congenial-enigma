class DataSource < ApplicationRecord
  include Draftable
  include ModelAttributes::Name
  include ServiceProvided
  include DataSource::Type

  with_draft_attribute :data_source_id

  has_many :data_source_alerts
  has_many :alerts, through: :data_source_alerts
  before_destroy :destroy_alerts

  protected

  def destroy_alerts
    multi_source_alerts = DataSourceAlert
                            .group(:alert_id)
                            .having('bool_or(data_source_id = ?)', id)
                            .having('count(*) > 1')
    # TODO: Develop an approach for destroying multi-source alerts.
    return false if multi_source_alerts.any?
    alerts.destroy_all
  end
end
