import {
  buildReactionId,
  summarizeReactions,
  REACTION_EMOJIS,
} from "@/lib/reactions";
import type { Reaction } from "@/lib/amplifyClient";

const makeReaction = (over: Partial<Reaction>): Reaction => ({
  id: "id",
  targetType: "HistoryEntry",
  targetId: "h1",
  emoji: "👍",
  owner: "u1",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...over,
});

describe("buildReactionId", () => {
  it("targetType・targetId・emoji・userId から決定的なIDを生成する", () => {
    expect(buildReactionId("HistoryEntry", "h1", "👍", "u1")).toBe(
      "HistoryEntry#h1#👍#u1"
    );
  });

  it("同じ入力なら常に同じIDになる（冪等＝重複リアクションを防げる）", () => {
    expect(buildReactionId("Tweet", "t1", "❤️", "u9")).toBe(
      buildReactionId("Tweet", "t1", "❤️", "u9")
    );
  });
});

describe("summarizeReactions", () => {
  it("リアクションが無くてもパレットの全絵文字を定義順で返す", () => {
    const result = summarizeReactions([], "HistoryEntry", "h1", "u1");
    expect(result.map((r) => r.emoji)).toEqual([...REACTION_EMOJIS]);
    expect(result.every((r) => r.count === 0 && !r.reactedByMe)).toBe(true);
  });

  it("対象（targetType+targetId）が一致するものだけを絵文字ごとに集計する", () => {
    const reactions = [
      makeReaction({ id: "1", emoji: "👍", owner: "u1" }),
      makeReaction({ id: "2", emoji: "👍", owner: "u2" }),
      makeReaction({ id: "3", emoji: "❤️", owner: "u2" }),
      // 別の対象IDは無視される
      makeReaction({ id: "4", emoji: "👍", targetId: "h2", owner: "u3" }),
      // 別のtargetTypeは無視される
      makeReaction({ id: "5", emoji: "👍", targetType: "Tweet", owner: "u3" }),
    ];
    const result = summarizeReactions(reactions, "HistoryEntry", "h1", "u1");
    expect(result.find((r) => r.emoji === "👍")!.count).toBe(2);
    expect(result.find((r) => r.emoji === "❤️")!.count).toBe(1);
  });

  it("自分が付けた絵文字には reactedByMe=true を立てる", () => {
    const reactions = [
      makeReaction({ id: "1", emoji: "👍", owner: "me" }),
      makeReaction({ id: "2", emoji: "❤️", owner: "other" }),
    ];
    const result = summarizeReactions(reactions, "HistoryEntry", "h1", "me");
    expect(result.find((r) => r.emoji === "👍")!.reactedByMe).toBe(true);
    expect(result.find((r) => r.emoji === "❤️")!.reactedByMe).toBe(false);
  });

  it("currentUserId が無ければ reactedByMe は常に false", () => {
    const reactions = [makeReaction({ emoji: "👍", owner: "me" })];
    const result = summarizeReactions(reactions, "HistoryEntry", "h1", null);
    expect(result.every((r) => !r.reactedByMe)).toBe(true);
  });
});
