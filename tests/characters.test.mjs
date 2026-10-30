import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { characterAssetPath, characterStorageId, getLearningCharacter, learningCharacters } from "../src/characters.ts";

test("every companion resolves to a real portrait and an accepted database identifier", () => {
  const migration = readFileSync(new URL("../supabase/migrations/005_expand_learning_characters.sql", import.meta.url), "utf8");
  for (const character of learningCharacters) {
    assert.ok(existsSync(new URL(`../public${characterAssetPath(character.id)}`, import.meta.url)), `${character.id} portrait is missing`);
    assert.ok(migration.includes(`'${characterStorageId(character.id)}'`), `${character.id} cannot be saved`);
  }
  assert.equal(getLearningCharacter("berrus").id, "Berrus");
  assert.equal(getLearningCharacter("Berrus").id, "Berrus");
});
