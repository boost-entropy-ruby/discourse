import {
  acceptance,
  exists,
  fakeTime,
  query,
  queryAll,
} from "discourse/tests/helpers/qunit-helpers";
import { click, fillIn, visit } from "@ember/test-helpers";
import selectKit from "discourse/tests/helpers/select-kit-helper";
import { test } from "qunit";
import I18n from "I18n";

acceptance("Admin - Suspend User", function (needs) {
  needs.user();
  needs.pretender((server, helper) => {
    server.put("/admin/users/:user_id/suspend", () =>
      helper.response(200, {
        suspension: {
          suspended_till: "2099-01-01T12:00:00.000Z",
        },
      })
    );

    server.put("/admin/users/:user_id/unsuspend", () =>
      helper.response(200, {
        suspension: {
          suspended_till: null,
        },
      })
    );
  });

  test("suspend a user - cancel", async function (assert) {
    await visit("/admin/users/1234/regular");
    await click(".suspend-user");

    assert.equal(queryAll(".suspend-user-modal:visible").length, 1);

    await click(".d-modal-cancel");

    assert.equal(queryAll(".suspend-user-modal:visible").length, 0);
  });

  test("suspend a user - cancel with input", async function (assert) {
    await visit("/admin/users/1234/regular");
    await click(".suspend-user");

    assert.equal(queryAll(".suspend-user-modal:visible").length, 1);

    await fillIn("input.suspend-reason", "for breaking the rules");
    await fillIn(".suspend-message", "this is an email reason why");

    await click(".d-modal-cancel");

    assert.equal(queryAll(".bootbox.modal:visible").length, 1);

    await click(".modal-footer .btn-default");
    assert.equal(queryAll(".suspend-user-modal:visible").length, 1);
    assert.equal(
      queryAll(".suspend-message")[0].value,
      "this is an email reason why"
    );

    await click(".d-modal-cancel");
    assert.equal(queryAll(".bootbox.modal:visible").length, 1);
    assert.equal(queryAll(".suspend-user-modal:visible").length, 0);
    await click(".modal-footer .btn-primary");
    assert.equal(queryAll(".bootbox.modal:visible").length, 0);
  });

  test("suspend, then unsuspend a user", async function (assert) {
    const suspendUntilCombobox = selectKit(".suspend-until .combobox");

    await visit("/admin/flags/active");

    await visit("/admin/users/1234/regular");

    assert.ok(!exists(".suspension-info"));

    await click(".suspend-user");

    assert.equal(
      queryAll(".perform-suspend[disabled]").length,
      1,
      "disabled by default"
    );

    await suspendUntilCombobox.expand();
    await suspendUntilCombobox.selectRowByValue("tomorrow");

    await fillIn("input.suspend-reason", "for breaking the rules");
    await fillIn(".suspend-message", "this is an email reason why");

    assert.equal(
      queryAll(".perform-suspend[disabled]").length,
      0,
      "no longer disabled"
    );

    await click(".perform-suspend");

    assert.equal(queryAll(".suspend-user-modal:visible").length, 0);
    assert.ok(exists(".suspension-info"));

    await click(".unsuspend-user");

    assert.ok(!exists(".suspension-info"));
  });
});

acceptance("Admin - Suspend User - timeframe choosing", function (needs) {
  let clock = null;
  needs.user();

  needs.hooks.beforeEach(() => {
    clock = fakeTime("2021-05-03T08:00:00", "UTC", true); // Monday morning
  });

  needs.hooks.afterEach(() => {
    clock.restore();
  });

  test("shows correct timeframe options", async function (assert) {
    await visit("/admin/users/1234/regular");
    await click(".suspend-user");
    await click(".future-date-input-selector-header");

    assert.equal(
      query(".future-date-input-selector-header").getAttribute("aria-expanded"),
      "true",
      "selector is expanded"
    );

    const options = Array.from(
      queryAll(`ul.select-kit-collection li span.name`).map((_, x) =>
        x.innerText.trim()
      )
    );

    const expected = [
      I18n.t("time_shortcut.later_today"),
      I18n.t("time_shortcut.tomorrow"),
      I18n.t("time_shortcut.next_week"),
      I18n.t("time_shortcut.two_weeks"),
      I18n.t("time_shortcut.next_month"),
      I18n.t("time_shortcut.two_months"),
      I18n.t("time_shortcut.three_months"),
      I18n.t("time_shortcut.four_months"),
      I18n.t("time_shortcut.six_months"),
      I18n.t("time_shortcut.one_year"),
      I18n.t("time_shortcut.forever"),
      I18n.t("time_shortcut.custom"),
    ];

    assert.deepEqual(options, expected, "options are correct");
  });
});
