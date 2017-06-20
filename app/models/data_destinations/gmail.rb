class DataDestinations::Gmail < DataDestination
  with_messenger Messenger::Gmail

  with_settings :email_list
  before_validation :normalize_email_list
  validate :validate_email_list

  # Splits the String email_list to a String Array of email addresses, returning
  # nil if email_list is not String and cannot be split.
  def emails
    email_list.is_a?(String) ? email_list.split(',') : nil
  end

  protected

  def normalize_email_list
    emails = self.emails
    return if emails.nil?
    emails.each(&:strip!)
    emails.uniq!
    self.email_list = emails.join(',')
  end

  # TODO: Make this validation more robust?
  def validate_email_list
    emails = self.emails
    if emails.nil?
      message = 'Email list is invalid'
    elsif emails.blank?
      message = 'Email list can’t be blank'
    else
      emails.each do |email|
        message = if email.blank?
                    'Email can’t be blank'
                  elsif email =~ /\s/
                    'Email can’t contain whitespace'
                  end
        break if message.present?
      end
    end
    errors.add :settings, message if message.present?
  end
end
