import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { generateClient } from "aws-amplify/data";
import { getCurrentUser } from "aws-amplify/auth";
import { ReactionsProvider } from "../ReactionsProvider";
import ReactionBar from "../ReactionBar";

jest.mock("aws-amplify/data");
const mockGenerateClient = generateClient as unknown as jest.Mock;

const createMock = jest.fn();
const deleteMock = jest.fn();

function setup(reactionItems: any[] = []) {
  createMock.mockResolvedValue({ data: {} });
  deleteMock.mockResolvedValue({ data: null });
  mockGenerateClient.mockReturnValue({
    models: {
      Reaction: {
        observeQuery: jest.fn().mockReturnValue({
          subscribe: (cb: any) => {
            setTimeout(() => cb.next({ items: reactionItems }), 0);
            return { unsubscribe: jest.fn() };
          },
        }),
        create: createMock,
        delete: deleteMock,
      },
    },
  } as any);
}

const renderBar = () =>
  render(
    <ReactionsProvider>
      <ReactionBar targetType="HistoryEntry" targetId="h1" />
    </ReactionsProvider>
  );

describe("ReactionBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("未ログイン（ゲスト）ではリアクションバーを表示しない", async () => {
    (getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error("no user"));
    setup([]);
    renderBar();
    await waitFor(() => expect(getCurrentUser).toHaveBeenCalled());
    expect(
      screen.queryByRole("button", { name: /👍/ })
    ).not.toBeInTheDocument();
  });

  it("パレットの絵文字ボタンを表示する", async () => {
    setup([]);
    renderBar();
    expect(
      await screen.findByRole("button", { name: /👍/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /❤️/ })).toBeInTheDocument();
  });

  it("既存リアクションの件数を表示する", async () => {
    setup([
      { id: "a", targetType: "HistoryEntry", targetId: "h1", emoji: "👍", owner: "u1" },
      { id: "b", targetType: "HistoryEntry", targetId: "h1", emoji: "👍", owner: "u2" },
    ]);
    renderBar();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "👍 2" })).toBeInTheDocument()
    );
  });

  it("未リアクションの絵文字をクリックすると決定的IDで create を呼ぶ", async () => {
    setup([]);
    renderBar();
    const btn = await screen.findByRole("button", { name: /👍/ });
    await userEvent.click(btn);
    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "HistoryEntry#h1#👍#current-user",
          targetType: "HistoryEntry",
          targetId: "h1",
          emoji: "👍",
        })
      )
    );
  });

  it("自分が付けた絵文字を再クリックすると delete を呼ぶ（トグルOFF）", async () => {
    setup([
      {
        id: "HistoryEntry#h1#👍#current-user",
        targetType: "HistoryEntry",
        targetId: "h1",
        emoji: "👍",
        owner: "current-user",
      },
    ]);
    renderBar();
    const btn = await screen.findByRole("button", { name: "👍 1" });
    await userEvent.click(btn);
    await waitFor(() =>
      expect(deleteMock).toHaveBeenCalledWith({
        id: "HistoryEntry#h1#👍#current-user",
      })
    );
  });

  it("別の絵文字を押すと既存の自分のリアクションを消して切り替える（1投稿1リアクション）", async () => {
    setup([
      {
        id: "HistoryEntry#h1#👍#current-user",
        targetType: "HistoryEntry",
        targetId: "h1",
        emoji: "👍",
        owner: "current-user",
      },
    ]);
    renderBar();
    const heart = await screen.findByRole("button", { name: /❤️/ });
    await userEvent.click(heart);
    await waitFor(() => {
      // 既存の👍は削除される
      expect(deleteMock).toHaveBeenCalledWith({
        id: "HistoryEntry#h1#👍#current-user",
      });
      // 新しい❤️が作成される
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "HistoryEntry#h1#❤️#current-user",
          emoji: "❤️",
        })
      );
    });
  });

  it("他人のリアクションは切り替え時に削除しない", async () => {
    setup([
      {
        id: "HistoryEntry#h1#👍#current-user",
        targetType: "HistoryEntry",
        targetId: "h1",
        emoji: "👍",
        owner: "current-user",
      },
      {
        id: "HistoryEntry#h1#👍#other",
        targetType: "HistoryEntry",
        targetId: "h1",
        emoji: "👍",
        owner: "other",
      },
    ]);
    renderBar();
    const heart = await screen.findByRole("button", { name: /❤️/ });
    await userEvent.click(heart);
    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({ emoji: "❤️" })
      )
    );
    // 自分の👍だけ削除、他人の👍は触らない
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(deleteMock).toHaveBeenCalledWith({
      id: "HistoryEntry#h1#👍#current-user",
    });
  });

  it("自分が付けた絵文字ボタンは aria-pressed=true になる", async () => {
    setup([
      {
        id: "HistoryEntry#h1#❤️#current-user",
        targetType: "HistoryEntry",
        targetId: "h1",
        emoji: "❤️",
        owner: "current-user",
      },
    ]);
    renderBar();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "❤️ 1" })
      ).toHaveAttribute("aria-pressed", "true")
    );
  });
});
