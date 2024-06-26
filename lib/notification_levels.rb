# frozen_string_literal: true

module NotificationLevels
  def self.all
    @all_levels ||= Enum.new(muted: 0,
                             regular: 1,
                             normal: 1, # alias for regular
                             tracking: 2,
                             watching: 3,
                             watching_first_post: 4)
  end

  def self.topic_levels
    @topic_levels ||= Enum.new(muted: 0,
                               regular: 1,
                               tracking: 2,
                               watching: 3)
  end
end
