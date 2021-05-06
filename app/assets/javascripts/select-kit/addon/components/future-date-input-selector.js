import ComboBoxComponent from "select-kit/components/combo-box";
import I18n from "I18n";
import { computed } from "@ember/object";
import { equal } from "@ember/object/computed";
import { isEmpty } from "@ember/utils";

const TIMEFRAME_BASE = {
  enabled: () => true,
  when: () => null,
  icon: "briefcase",
};

function buildTimeframe(opts) {
  return jQuery.extend({}, TIMEFRAME_BASE, opts);
}

export const TIMEFRAMES = [
  buildTimeframe({
    id: "later_today",
    format: "h a",
    enabled: (opts) => opts.canScheduleLaterToday,
    when: moment().hour(18).minute(0),
    icon: "far-moon",
  }),
  buildTimeframe({
    id: "tomorrow",
    format: "ddd, h a",
    when: moment().add(1, "day").hour(8).minute(0),
    icon: "far-sun",
  }),
  buildTimeframe({
    id: "later_this_week",
    format: "ddd, h a",
    enabled: (opts) => opts.canScheduleLaterThisWeek,
    when: moment().add(2, "day").hour(8).minute(0),
  }),
  buildTimeframe({
    id: "this_weekend",
    format: "ddd, h a",
    enabled: (opts) => opts.canScheduleThisWeekend,
    when: moment().day(6).hour(8).minute(0),
    icon: "bed",
  }),
  buildTimeframe({
    id: "next_week",
    format: "ddd, h a",
    enabled: (opts) => opts.canScheduleNextWeek,
    when: moment().add(1, "week").day(1).hour(8).minute(0),
    icon: "briefcase",
  }),
  buildTimeframe({
    id: "two_weeks",
    format: "MMM D",
    when: moment().add(2, "week").hour(8).minute(0),
    icon: "briefcase",
  }),
  buildTimeframe({
    id: "next_month",
    format: "MMM D",
    enabled: (opts) => opts.canScheduleNextMonth,
    when: moment().add(1, "month").startOf("month").hour(8).minute(0),
    icon: "briefcase",
  }),
  buildTimeframe({
    id: "two_months",
    format: "MMM D",
    when: moment().add(2, "month").startOf("month").hour(8).minute(0),
    icon: "briefcase",
  }),
  buildTimeframe({
    id: "three_months",
    format: "MMM D",
    when: moment().add(3, "month").startOf("month").hour(8).minute(0),
    icon: "briefcase",
  }),
  buildTimeframe({
    id: "four_months",
    format: "MMM D",
    when: moment().add(4, "month").startOf("month").hour(8).minute(0),
    icon: "briefcase",
  }),
  buildTimeframe({
    id: "six_months",
    format: "MMM D",
    when: moment().add(6, "month").startOf("month").hour(8).minute(0),
    icon: "briefcase",
  }),
  buildTimeframe({
    id: "one_year",
    format: "MMM D",
    enabled: (opts) => opts.includeFarFuture,
    when: moment().add(1, "year").startOf("day").hour(8).minute(0),
    icon: "briefcase",
  }),
  buildTimeframe({
    id: "forever",
    enabled: (opts) => opts.includeFarFuture,
    when: moment().add(1000, "year").hour(8).minute(0),
    icon: "gavel",
  }),
  buildTimeframe({
    id: "custom",
    enabled: (opts) => opts.includeDateTime,
    icon: "far-calendar-plus",
    when: null,
  }),
];

let _timeframeById = null;
export function timeframeDetails(id) {
  if (!_timeframeById) {
    _timeframeById = {};
    TIMEFRAMES.forEach((t) => (_timeframeById[t.id] = t));
  }
  return _timeframeById[id];
}

export const FORMAT = "YYYY-MM-DD HH:mmZ";

export default ComboBoxComponent.extend({
  pluginApiIdentifiers: ["future-date-input-selector"],
  classNames: ["future-date-input-selector"],
  isCustom: equal("value", "custom"),

  selectKitOptions: {
    autoInsertNoneItem: false,
    headerComponent:
      "future-date-input-selector/future-date-input-selector-header",
  },

  modifyComponentForRow() {
    return "future-date-input-selector/future-date-input-selector-row";
  },

  content: computed("statusType", function () {
    const now = moment();
    const canScheduleLaterToday = 24 - now.hour() > 6;
    const canScheduleLaterThisWeek = !canScheduleLaterToday && now.day() < 4;
    const canScheduleThisWeekend = now.day() < 5 && this.includeWeekend;
    const canScheduleNextWeek = now.day() !== 0;
    const canScheduleNextMonth = now.date() !== moment().endOf("month").date();

    const opts = {
      includeFarFuture: this.includeFarFuture,
      includeDateTime: this.includeDateTime,
      canScheduleLaterToday: canScheduleLaterToday,
      canScheduleLaterThisWeek: canScheduleLaterThisWeek,
      canScheduleThisWeekend: canScheduleThisWeekend,
      canScheduleNextWeek: canScheduleNextWeek,
      canScheduleNextMonth: canScheduleNextMonth,
    };

    return TIMEFRAMES.filter((tf) => tf.enabled(opts)).map((option) => {
      return {
        id: option.id,
        name: I18n.t(`time_shortcut.${option.id}`),
        datetime: this._timeFormatted(option),
        icons: [timeframeDetails(option.id).icon],
      };
    });
  }),

  _timeFormatted(option) {
    if (option.when && option.format) {
      return option.when.format(option.format);
    }

    return null;
  },

  actions: {
    onChange(value) {
      if (value !== "custom") {
        const time = timeframeDetails(value).when;
        if (time && !isEmpty(value)) {
          this.attrs.onChangeInput &&
            this.attrs.onChangeInput(time.locale("en").format(FORMAT));
        }
      }

      this.attrs.onChange && this.attrs.onChange(value);
    },
  },
});
