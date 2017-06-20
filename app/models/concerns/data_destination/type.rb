# This module includes functionality for the data destination type, including
# single table inheritance. Follow these steps to add a new data destination
# type:
#
#   1. Define a class for the data destination type in the DataDestinations
#      module, for example, DataDestinations::Gmail.
#   2. Add the demodulized class name (for example, 'Gmail') to
#      TYPE_CLASS_NAMES.
#   3. See ModelAttributes::Settings for ways to store data destination
#      settings.
#
module DataDestination::Type
  extend ActiveSupport::Concern

  include ModelAttributes::Type
  include ModelAttributes::Settings
  include DataDestination::Type::HasMessenger

  # Whitelist of demodulized names of data destination classes
  TYPE_CLASS_NAMES = %w[Gmail].freeze

  class_methods do
    def type_class_names
      TYPE_CLASS_NAMES.map { |name| "DataDestinations::#{name}" }
    end
  end
end
