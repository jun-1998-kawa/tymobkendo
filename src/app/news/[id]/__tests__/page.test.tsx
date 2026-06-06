import { render, screen } from "@testing-library/react";
import { generateClient } from "aws-amplify/data";
import { getUrl } from "aws-amplify/storage";
import NewsDetailPage from "../page";

jest.mock("aws-amplify/data");
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "n1" }),
  useRouter: () => ({ push: jest.fn() }),
}));
// react-markdown / remark-gfm は ESM のためテストではプレーンなモックに差し替える
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => () => {} }));

const mockGenerateClient = generateClient as unknown as jest.Mock;

const news = {
  id: "n1",
  title: "全国大会出場",
  excerpt: "概要",
  content: "本文",
  category: "お知らせ",
  isPublished: true,
  isPinned: false,
  imagePaths: [],
  publishedAt: "2026-01-01T00:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  (getUrl as jest.Mock).mockResolvedValue({
    url: new URL("https://example.com/i.jpg"),
  });
  mockGenerateClient.mockReturnValue({
    models: {
      News: { get: jest.fn().mockResolvedValue({ data: news }) },
      Reaction: {
        observeQuery: jest.fn().mockReturnValue({
          subscribe: (cb: any) => {
            setTimeout(() => cb.next({ items: [] }), 0);
            return { unsubscribe: jest.fn() };
          },
        }),
        create: jest.fn().mockResolvedValue({ data: {} }),
        delete: jest.fn().mockResolvedValue({ data: null }),
      },
    },
  });
});

describe("ニュース詳細ページのリアクション", () => {
  it("ログイン会員には記事にリアクションバー（絵文字ボタン）を表示する", async () => {
    render(<NewsDetailPage />);
    expect(await screen.findByText("全国大会出場")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /👍/ })
    ).toBeInTheDocument();
  });
});
