import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateClient } from 'aws-amplify/data';
import BoardPage from '../page';

jest.mock('aws-amplify/data');

const mockGenerateClient = generateClient as jest.MockedFunction<typeof generateClient>;

describe('Board Page', () => {
  let mockCreate: jest.Mock;
  let mockObserveQuery: jest.Mock;
  let unsubscribeMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCreate = jest.fn().mockResolvedValue({ data: { id: 'new-thread' } });
    unsubscribeMock = jest.fn();

    mockObserveQuery = jest.fn().mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        setTimeout(() => {
          callbacks.next({ items: [] });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    mockGenerateClient.mockReturnValue({
      models: {
        BoardThread: {
          create: mockCreate,
          observeQuery: mockObserveQuery,
        },
      },
    } as any);
  });

  it('should render board thread list', () => {
    render(<BoardPage />);

    expect(screen.getByText(/掲示板/)).toBeInTheDocument();
  });

  it('should display create thread button', () => {
    render(<BoardPage />);

    expect(screen.getByRole('button', { name: /新規スレッド/ })).toBeInTheDocument();
  });

  it('should display thread list', async () => {
    const mockThreads = [
      {
        id: '1',
        title: 'Thread 1',
        pinned: false,
        createdAt: new Date().toISOString(),
        owner: 'user1',
      },
      {
        id: '2',
        title: 'Thread 2',
        pinned: true,
        createdAt: new Date().toISOString(),
        owner: 'user2',
      },
    ];

    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        setTimeout(() => {
          callbacks.next({ items: mockThreads });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    render(<BoardPage />);

    await waitFor(() => {
      expect(screen.getByText('Thread 1')).toBeInTheDocument();
      expect(screen.getByText('Thread 2')).toBeInTheDocument();
    });
  });

  it('should show pinned threads first', async () => {
    const mockThreads = [
      {
        id: '1',
        title: 'Normal Thread',
        pinned: false,
        createdAt: new Date('2024-01-01').toISOString(),
        owner: 'user1',
      },
      {
        id: '2',
        title: 'Pinned Thread',
        pinned: true,
        createdAt: new Date('2024-01-02').toISOString(),
        owner: 'user2',
      },
    ];

    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        setTimeout(() => {
          callbacks.next({ items: mockThreads });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    render(<BoardPage />);

    await waitFor(() => {
      const threads = screen.getAllByRole('link');
      expect(threads[0]).toHaveTextContent('Pinned Thread');
    });
  });

  it('should open create thread modal', async () => {
    const user = userEvent.setup();
    render(<BoardPage />);

    const createButton = screen.getByRole('button', { name: /新規スレッド/ });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/スレッドを作成/)).toBeInTheDocument();
    });
  });

  it('should create a new thread', async () => {
    const user = userEvent.setup();
    render(<BoardPage />);

    const createButton = screen.getByRole('button', { name: /新規スレッド/ });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/タイトル/)).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText(/タイトル/);
    await user.type(titleInput, '新しいスレッド');

    const submitButton = screen.getByRole('button', { name: /作成/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        title: '新しいスレッド',
        pinned: false,
      });
    });
  });

  it('should display empty state when no threads', async () => {
    render(<BoardPage />);

    await waitFor(() => {
      expect(screen.getByText(/スレッドがありません/)).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn(() => {
        return { unsubscribe: unsubscribeMock };
      }),
    });

    render(<BoardPage />);

    expect(screen.getByText(/読み込み中/)).toBeInTheDocument();
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = render(<BoardPage />);

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('should navigate to thread detail on click', async () => {
    const mockThreads = [
      {
        id: 'thread-123',
        title: 'Test Thread',
        pinned: false,
        createdAt: new Date().toISOString(),
        owner: 'user1',
      },
    ];

    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        setTimeout(() => {
          callbacks.next({ items: mockThreads });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    render(<BoardPage />);

    await waitFor(() => {
      const threadLink = screen.getByRole('link', { name: /Test Thread/ });
      expect(threadLink).toHaveAttribute('href', '/app/board/thread-123');
    });
  });
});
