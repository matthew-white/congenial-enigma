module DataDestination::Type::HasMessenger
  extend ActiveSupport::Concern

  included do
    class_attribute :_messenger, instance_accessor: false,
                    instance_predicate: false
    self._messenger = Messenger::Logger
  end

  class_methods do
    def with_messenger(messenger)
      self._messenger = messenger
    end

    def messenger_class
      _messenger
    end
  end

  def messenger
    self.class.messenger_class.new(self)
  end
end
