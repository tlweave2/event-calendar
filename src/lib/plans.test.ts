import { test } from "node:test";
import assert from "node:assert/strict";
import { getPlanConfig, hasFeature, isPaidPlan } from "./plans";

test("paid plans get the paid features", () => {
  for (const plan of ["PRO", "ENTERPRISE"]) {
    assert.equal(hasFeature(plan, "aiFlyer"), true, plan);
    assert.equal(hasFeature(plan, "removeBadge"), true, plan);
    assert.equal(isPaidPlan(plan), true, plan);
  }
});

test("free and unknown plans fall back to Free limits", () => {
  for (const plan of ["FREE", "SOMETHING_ELSE", ""]) {
    assert.equal(hasFeature(plan, "aiFlyer"), false, plan);
    assert.equal(getPlanConfig(plan).monthlyEvents, 5, plan);
    assert.equal(isPaidPlan(plan), false, plan);
  }
});

test("Enterprise allows a team; Free and Pro allow one admin", () => {
  assert.equal(getPlanConfig("FREE").adminUsers, 1);
  assert.equal(getPlanConfig("PRO").adminUsers, 1);
  assert.equal(getPlanConfig("ENTERPRISE").adminUsers, 25);
  assert.equal(getPlanConfig("ENTERPRISE").monthlyEvents, Infinity);
});
