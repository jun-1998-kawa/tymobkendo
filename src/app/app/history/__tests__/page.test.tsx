import { render, screen } from "@testing-library/react";
import { generateClient } from "aws-amplify/data";
import { getUrl } from "aws-amplify/storage";
import { ReactionsProvider } from "@/components/reactions/ReactionsProvider";
import HistoryPage from "../page";

jest.mock("aws-amplify/data");
// react-markdown / remark-gfm は ESM のためテストではプレーンなモックに差し替える
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => () => {} }));

const mockGenerateClient = generateClient as unknown as jest.Mock;

const entries = [
  {
    id: "h1",
    year: 2020,
    title: "創部",
    bodyMd: "本文",
    isPublic: true,
    imagePaths: [],
    videoPaths: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

const observe = (items: any[]) =>
  jest.fn().mockReturnValue({
    subscribe: (cb: any) => {
      setTimeout(() => cb.next({ items }), 0);
      return { unsubscribe: jest.fn() };
    },
  });

beforeEach(() => {
  jest.clearAllMocks();
  (getUrl as jest.Mock).mockResolvedValue({
    url: new URL("https://example.com/v.mp4"),
  });
  mockGenerateClient.mockReturnValue({
    models: {
      HistoryEntry: { observeQuery: observe(entries) },
      Reaction: {
        observeQuery: observe([]),
        create: jest.fn().mockResolvedValue({ data: {} }),
        delete: jest.fn().mockResolvedValue({ data: null }),
      },
    },
  } as any);
});

const renderPage = () =>
  render(
    <ReactionsProvider>
      <HistoryPage />
    </ReactionsProvider>
  );

describe("歴史ページのリアクション", () => {
  it("各エントリにリアクションバー（絵文字ボタン）を表示する", async () => {
    renderPage();
    expect(await screen.findByText("創部")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /👍/ })
    ).toBeInTheDocument();
  });
});
