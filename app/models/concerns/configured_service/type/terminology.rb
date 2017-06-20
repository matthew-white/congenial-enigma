# This module includes functionality for accessing the name of the service
# technology.
# TODO: Update comment.
module ConfiguredService::Type::Terminology
  extend ActiveSupport::Concern

  TERMINOLOGY = [:service, :configured_service, :data_source, :data_destination]

  included do
    # Avoid accessing this class attribute directly: use ::terminology and
    # ::with_terminology.
    class_attribute :_terminology, instance_accessor: false,
                    instance_predicate: false
    self._terminology = {
      service: 'Service',
      configured_service: 'configured service',
      data_source: 'data source',
      data_destination: 'data destination'
    }.freeze
  end

  class_methods do
    def with_terminology(terminology)
      clone_superclass_terminology
      terminology.each do |key, value|
        sym_key = key.to_sym
        raise ArgumentError unless TERMINOLOGY.include? sym_key
        if sym_key == :data_source || sym_key == :data_destination
          provides! sym_key
        end
        _terminology[sym_key] = value.dup.freeze
      end
      _terminology.freeze
    end

    def terminology
      terminology = OpenStruct.new(_terminology)
      terminology.delete_field :data_source unless provides? :data_source
      unless provides? :data_destination
        terminology.delete_field :data_destination
      end
      terminology.freeze
    end

    private

    def clone_superclass_terminology
      # The class's terminology is the same object as the terminology of its
      # superclass if and only if the class's terminology has not been cloned
      # yet.
      return unless _terminology.equal? superclass._terminology
      # The class inherits its superclass's terminology.
      self._terminology = superclass._terminology.dup
    end
  end
end
