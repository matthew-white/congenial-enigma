class ChangeAlertDraft < ActiveRecord::Migration[5.0]
  def change
    remove_column :alert_drafts, :field_name, :text
    remove_column :alert_drafts, :rule_value, :decimal
    add_column :alert_drafts, :rule_data, :jsonb
  end
end
