# frozen_string_literal: true

# lightweight Twitter api calls
class TwitterApi

  class << self
    include ActionView::Helpers::NumberHelper

    def prettify_tweet(tweet)
      text = tweet["full_text"].dup
      if (entities = tweet["entities"]) && (urls = entities["urls"])
        urls.each do |url|
          text.gsub!(url["url"], "<a target='_blank' href='#{url["expanded_url"]}'>#{url["display_url"]}</a>")
        end
      end

      text = link_hashtags_in link_handles_in text

      result = Rinku.auto_link(text, :all, 'target="_blank"').to_s

      if tweet['extended_entities'] && media = tweet['extended_entities']['media']
        media.each do |m|
          if m['type'] == 'photo'
            if large = m['sizes']['large']
              result << "<div class='tweet-images'><img class='tweet-image' src='#{m['media_url_https']}' width='#{large['w']}' height='#{large['h']}'></div>"
            end
          elsif m['type'] == 'video' || m['type'] == 'animated_gif'
            video_to_display = m['video_info']['variants']
              .select { |v| v['content_type'] == 'video/mp4' }
              .sort { |v| v['bitrate'] }.last # choose highest bitrate

            if video_to_display && url = video_to_display['url']
              width = m['sizes']['large']['w']
              height = m['sizes']['large']['h']

              attributes =
                if m['type'] == 'animated_gif'
                  %w{
                    playsinline
                    loop
                    muted
                    autoplay
                    disableRemotePlayback
                    disablePictureInPicture
                  }
                else
                  %w{
                    controls
                    playsinline
                  }
                end.join(' ')

              result << <<~HTML
                <div class='tweet-images'>
                  <div class='aspect-image-full-size' style='--aspect-ratio:#{width}/#{height};'>
                    <video class='tweet-video' #{attributes}
                      width='#{width}'
                      height='#{height}'
                      poster='#{m['media_url_https']}'>
                      <source src='#{url}' type="video/mp4">
                    </video>
                  </div>
                </div>
              HTML
            end
          end
        end
      end

      result
    end

    def prettify_number(count)
      number_to_human(count, format: '%n%u', precision: 2, units: { thousand: 'K', million: 'M', billion: 'B' })
    end

    def user_timeline(screen_name)
      JSON.parse(twitter_get(user_timeline_uri_for screen_name))
    end

    def tweet_for(id)
      JSON.parse(twitter_get(tweet_uri_for id))
    end

    alias_method :status, :tweet_for

    def raw_tweet_for(id)
      twitter_get(tweet_uri_for id)
    end

    def twitter_credentials_missing?
      consumer_key.blank? || consumer_secret.blank?
    end

    protected

    def link_handles_in(text)
      text.gsub(/(?:^|\s)@\w+/) do |match|
        whitespace = match[0] == " " ? " " : ""
        handle     = match.strip[1..]
        "#{whitespace}<a href='https://twitter.com/#{handle}' target='_blank'>@#{handle}</a>"
      end.strip
    end

    def link_hashtags_in(text)
      text.gsub(/(?:^|\s)#\w+/) do |match|
        whitespace = match[0] == " " ? " " : ""
        hashtag    = match.strip[1..]
        "#{whitespace}<a href='https://twitter.com/search?q=%23#{hashtag}' target='_blank'>##{hashtag}</a>"
      end.strip
    end

    def user_timeline_uri_for(screen_name)
      URI.parse "#{BASE_URL}/1.1/statuses/user_timeline.json?screen_name=#{screen_name}&count=50&include_rts=false&exclude_replies=true"
    end

    def tweet_uri_for(id)
      URI.parse "#{BASE_URL}/1.1/statuses/show.json?id=#{id}&tweet_mode=extended"
    end

    unless defined? BASE_URL
      BASE_URL = 'https://api.twitter.com'
    end

    def twitter_get(uri)
      request = Net::HTTP::Get.new(uri)
      request.add_field 'Authorization', "Bearer #{bearer_token}"
      http(uri).request(request).body
    end

    def authorization
      request = Net::HTTP::Post.new(auth_uri)

      request.add_field 'Authorization',
        "Basic #{bearer_token_credentials}"
      request.add_field 'Content-Type',
        'application/x-www-form-urlencoded;charset=UTF-8'

      request.set_form_data 'grant_type' => 'client_credentials'

      http(auth_uri).request(request).body
    end

    def bearer_token
      @access_token ||= JSON.parse(authorization).fetch('access_token')
    end

    def bearer_token_credentials
      Base64.strict_encode64(
        "#{UrlHelper.encode_component(consumer_key)}:#{UrlHelper.encode_component(consumer_secret)}"
      )
    end

    def auth_uri
      URI.parse "#{BASE_URL}/oauth2/token"
    end

    def http(uri)
      Net::HTTP.new(uri.host, uri.port).tap { |http| http.use_ssl = true }
    end

    def consumer_key
      SiteSetting.twitter_consumer_key
    end

    def consumer_secret
      SiteSetting.twitter_consumer_secret
    end

  end
end
