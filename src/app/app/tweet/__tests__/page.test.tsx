import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl } from 'aws-amplify/storage';
import TweetPage from '../page';

jest.mock('aws-amplify/data');
jest.mock('aws-amplify/storage');

const mockGenerateClient = generateClient as jest.MockedFunction<typeof generateClient>;
const mockUploadData = uploadData as jest.MockedFunction<typeof uploadData>;
const mockGetUrl = getUrl as jest.MockedFunction<typeof getUrl>;

describe('Tweet Page', () => {
  let mockCreate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockObserveQuery: jest.Mock;
  let unsubscribeMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCreate = jest.fn().mockResolvedValue({ data: { id: 'new-tweet' } });
    mockDelete = jest.fn().mockResolvedValue({ data: null });
    unsubscribeMock = jest.fn();

    mockObserveQuery = jest.fn().mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        // 初期データを即座に返す
        setTimeout(() => {
          callbacks.next({ items: [] });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    mockGenerateClient.mockReturnValue({
      models: {
        Tweet: {
          create: mockCreate,
          delete: mockDelete,
          observeQuery: mockObserveQuery,
        },
      },
    } as any);
  });

  it('should render tweet input form', () => {
    render(<TweetPage />);

    expect(screen.getByPlaceholderText(/近況を共有/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /投稿/ })).toBeInTheDocument();
  });

  it('should show character count', async () => {
    const user = userEvent.setup();
    render(<TweetPage />);

    const textarea = screen.getByPlaceholderText(/近況を共有/);
    await user.type(textarea, 'テスト投稿');

    expect(screen.getByText(/5\/140/)).toBeInTheDocument();
  });

  it('should disable submit button when content is empty', () => {
    render(<TweetPage />);

    const submitButton = screen.getByRole('button', { name: /投稿/ });
    expect(submitButton).toBeDisabled();
  });

  it('should disable submit button when content exceeds 140 characters', async () => {
    const user = userEvent.setup();
    render(<TweetPage />);

    const textarea = screen.getByPlaceholderText(/近況を共有/);
    const longText = 'あ'.repeat(141);
    await user.type(textarea, longText);

    const submitButton = screen.getByRole('button', { name: /投稿/ });
    expect(submitButton).toBeDisabled();
  });

  it('should create a tweet successfully', async () => {
    const user = userEvent.setup();
    render(<TweetPage />);

    const textarea = screen.getByPlaceholderText(/近況を共有/);
    await user.type(textarea, 'テスト投稿です');

    const submitButton = screen.getByRole('button', { name: /投稿/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        content: 'テスト投稿です',
        imagePaths: null,
      });
    });
  });

  it('should clear form after successful tweet creation', async () => {
    const user = userEvent.setup();
    render(<TweetPage />);

    const textarea = screen.getByPlaceholderText(/近況を共有/) as HTMLTextAreaElement;
    await user.type(textarea, 'テスト投稿');

    const submitButton = screen.getByRole('button', { name: /投稿/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(textarea.value).toBe('');
    });
  });

  it('should display tweets list', async () => {
    const mockTweets = [
      {
        id: '1',
        content: 'Tweet 1',
        imagePaths: [],
        createdAt: new Date().toISOString(),
        owner: 'user1',
      },
      {
        id: '2',
        content: 'Tweet 2',
        imagePaths: [],
        createdAt: new Date().toISOString(),
        owner: 'user2',
      },
    ];

    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        setTimeout(() => {
          callbacks.next({ items: mockTweets });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    render(<TweetPage />);

    await waitFor(() => {
      expect(screen.getByText('Tweet 1')).toBeInTheDocument();
      expect(screen.getByText('Tweet 2')).toBeInTheDocument();
    });
  });

  it('should handle image upload', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    mockUploadData.mockReturnValue({
      result: Promise.resolve({
        path: 'tweets/test.jpg',
      } as any),
      cancel: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      state: 'SUCCESS' as any,
    });

    render(<TweetPage />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(mockUploadData).toHaveBeenCalled();
    });
  });

  it('should limit image uploads to 4', async () => {
    const user = userEvent.setup();
    render(<TweetPage />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Upload 5 files
    const files = Array.from({ length: 5 }, (_, i) =>
      new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
    );

    mockUploadData.mockReturnValue({
      result: Promise.resolve({
        path: 'tweets/test.jpg',
      } as any),
      cancel: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      state: 'SUCCESS' as any,
    });

    await user.upload(fileInput, files);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/画像は最大4枚/)).toBeInTheDocument();
    });
  });

  it('should delete a tweet', async () => {
    const user = userEvent.setup();
    const mockTweet = {
      id: 'tweet-1',
      content: 'Test tweet to delete',
      imagePaths: [],
      createdAt: new Date().toISOString(),
      owner: 'current-user',
    };

    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        setTimeout(() => {
          callbacks.next({ items: [mockTweet] });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    // Mock window.confirm
    global.confirm = jest.fn(() => true);

    render(<TweetPage />);

    await waitFor(() => {
      expect(screen.getByText('Test tweet to delete')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /削除/ });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith({ id: 'tweet-1' });
    });
  });

  it('should cancel delete when user cancels confirmation', async () => {
    const user = userEvent.setup();
    const mockTweet = {
      id: 'tweet-1',
      content: 'Test tweet',
      imagePaths: [],
      createdAt: new Date().toISOString(),
      owner: 'current-user',
    };

    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        setTimeout(() => {
          callbacks.next({ items: [mockTweet] });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    global.confirm = jest.fn(() => false);

    render(<TweetPage />);

    await waitFor(() => {
      expect(screen.getByText('Test tweet')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /削除/ });
    await user.click(deleteButton);

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('should display loading state initially', () => {
    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn(() => {
        // Don't call callbacks - simulate loading
        return { unsubscribe: unsubscribeMock };
      }),
    });

    render(<TweetPage />);

    expect(screen.getByText(/読み込み中/)).toBeInTheDocument();
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = render(<TweetPage />);

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('should show error message when upload fails', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    mockUploadData.mockReturnValue({
      result: Promise.reject(new Error('Upload failed')),
      cancel: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      state: 'ERROR' as any,
    });

    // Mock window.alert
    global.alert = jest.fn();

    render(<TweetPage />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('アップロード'));
    });
  });
});
