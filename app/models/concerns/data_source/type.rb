# This module includes functionality for the data source type, including single
# table inheritance. Follow these steps to add a new data source type:
#
#   1. Define a class for the data source type in the DataSources module, for
#      example, DataSources::Odk.
#   2. Add the demodulized class name (for example, 'Odk') to TYPE_CLASS_NAMES.
#   3. See ModelAttributes::Settings for ways to store data source settings.
#   4. Define a data processor that can parse data from the data source type:
#      see DataSource::Type::Processor and DataProcessor::Base.
#   5. Define the rule types applicable to the data source type: see
#      DataSource::Type::HasRules and Rule::Base.
#
module DataSource::Type
  extend ActiveSupport::Concern

  include ModelAttributes::Type
  include ModelAttributes::Settings
  include DataSource::Type::Processor
  include DataSource::Type::HasRules

  # Whitelist of demodulized names of data source classes
  TYPE_CLASS_NAMES = %w[Odk].freeze

  class_methods do
    def type_class_names
      TYPE_CLASS_NAMES.map { |name| "DataSources::#{name}" }
    end
  end
end
