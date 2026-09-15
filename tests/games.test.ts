import test from "node:test";
import assert from "node:assert/strict";
import { conceptGames } from "../src/data/games.ts";

test("every CFA topic has one distinct learning game", () => {
  assert.equal(conceptGames.length, 10);
  assert.equal(new Set(conceptGames.map((game) => game.topicId)).size, 10);
  assert.equal(new Set(conceptGames.map((game) => game.title)).size, 10);
  assert.equal(new Set(conceptGames.map((game) => game.visual)).size, 10);
});

test("game simulations stay within their documented domains", () => {
  for (const game of conceptGames) {
    assert(game.min < game.start && game.start < game.max, game.title);
    assert(game.step > 0, game.title);
    for (const input of [game.min, game.start, game.max]) {
      const output = game.calculate(input);
      assert(output.value && output.label && output.note, game.title);
      assert(!/NaN|Infinity/.test(output.value), game.title);
    }
  }
});

test("core financial simulations reproduce independently checked values", () => {
  assert.equal(conceptGames.find((game) => game.topicId === "v1")!.calculate(5).value, "146.9");
  assert.equal(conceptGames.find((game) => game.topicId === "v3")!.calculate(10).value, "9.2");
  assert.equal(conceptGames.find((game) => game.topicId === "v6")!.calculate(8).value, "100.0");
  assert.equal(conceptGames.find((game) => game.topicId === "v7")!.calculate(120).value, "20");
});
