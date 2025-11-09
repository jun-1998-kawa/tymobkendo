import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateClient } from 'aws-amplify/data';
import { uploadData } from 'aws-amplify/storage';
import HistoryManagementPage from '../page';

jest.mock('aws-amplify/data');
jest.mock('aws-amplify/storage');

const mockGenerateClient = generateClient as jest.MockedFunction<typeof generateClient>;
const mockUploadData = uploadData as jest.MockedFunction<typeof uploadData>;

describe('History Management Page', () => {
  let mockCreate: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockObserveQuery: jest.Mock;
  let unsubscribeMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    global.confirm = jest.fn(() => true);
    global.alert = jest.fn();

    mockCreate = jest.fn().mockResolvedValue({ data: { id: 'new-entry' } });
    mockUpdate = jest.fn().mockResolvedValue({ data: { id: 'entry-1' } });
    mockDelete = jest.fn().mockResolvedValue({ data: null });
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
        HistoryEntry: {
          create: mockCreate,
          update: mockUpdate,
          delete: mockDelete,
          observeQuery: mockObserveQuery,
        },
      },
    } as any);
  });

  it('should render history management page', async () => {
    render(<HistoryManagementPage />);

    await waitFor(() => {
      expect(screen.getByText(/歴史管理/)).toBeInTheDocument();
    });
  });

  it('should display create button', async () => {
    render(<HistoryManagementPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /新規作成/ })).toBeInTheDocument();
    });
  });

  it('should display history entries list', async () => {
    const mockEntries = [
      {
        id: '1',
        year: 2023,
        title: 'Entry 2023',
        bodyMd: 'Content 2023',
        imagePaths: [],
        isPublic: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        year: 2024,
        title: 'Entry 2024',
        bodyMd: 'Content 2024',
        imagePaths: [],
        isPublic: false,
        createdAt: new Date().toISOString(),
      },
    ];

    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        setTimeout(() => {
          callbacks.next({ items: mockEntries });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    render(<HistoryManagementPage />);

    await waitFor(() => {
      expect(screen.getByText(/2023年/)).toBeInTheDocument();
      expect(screen.getByText('Entry 2023')).toBeInTheDocument();
      expect(screen.getByText(/2024年/)).toBeInTheDocument();
      expect(screen.getByText('Entry 2024')).toBeInTheDocument();
    });
  });

  it('should sort entries by year descending', async () => {
    const mockEntries = [
      {
        id: '1',
        year: 2020,
        title: 'Old Entry',
        bodyMd: 'Content',
        imagePaths: [],
        isPublic: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        year: 2024,
        title: 'New Entry',
        bodyMd: 'Content',
        imagePaths: [],
        isPublic: true,
        createdAt: new Date().toISOString(),
      },
    ];

    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        setTimeout(() => {
          callbacks.next({ items: mockEntries });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    render(<HistoryManagementPage />);

    await waitFor(() => {
      const years = screen.getAllByText(/\d{4}年/);
      expect(years[0]).toHaveTextContent('2024年');
      expect(years[1]).toHaveTextContent('2020年');
    });
  });

  it('should show public/member-only badges', async () => {
    const mockEntries = [
      {
        id: '1',
        year: 2023,
        title: 'Public Entry',
        bodyMd: 'Content',
        imagePaths: [],
        isPublic: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        year: 2024,
        title: 'Member Entry',
        bodyMd: 'Content',
        imagePaths: [],
        isPublic: false,
        createdAt: new Date().toISOString(),
      },
    ];

    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        setTimeout(() => {
          callbacks.next({ items: mockEntries });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    render(<HistoryManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('公開')).toBeInTheDocument();
      expect(screen.getByText('会員限定')).toBeInTheDocument();
    });
  });

  it('should toggle public status', async () => {
    const user = userEvent.setup();
    const mockEntry = {
      id: 'entry-1',
      year: 2023,
      title: 'Test Entry',
      bodyMd: 'Content',
      imagePaths: [],
      isPublic: true,
      createdAt: new Date().toISOString(),
    };

    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        setTimeout(() => {
          callbacks.next({ items: [mockEntry] });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    render(<HistoryManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Entry')).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button', { name: /会員限定に/ });
    await user.click(toggleButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        id: 'entry-1',
        isPublic: false,
      });
    });
  });

  it('should open create modal', async () => {
    const user = userEvent.setup();
    render(<HistoryManagementPage />);

    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /新規作成/ });
      expect(createButton).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /新規作成/ });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/新規歴史エントリー作成/)).toBeInTheDocument();
    });
  });

  it('should create new entry', async () => {
    const user = userEvent.setup();
    render(<HistoryManagementPage />);

    const createButton = screen.getByRole('button', { name: /新規作成/ });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('2023')).toBeInTheDocument();
    });

    const yearInput = screen.getByPlaceholderText('2023');
    await user.type(yearInput, '2024');

    const titleInput = screen.getByPlaceholderText(/例：全国大会出場/);
    await user.type(titleInput, '新しいエントリー');

    const bodyTextarea = screen.getByPlaceholderText(/歴史エントリーの内容/);
    await user.type(bodyTextarea, '本文内容');

    const submitButton = screen.getByRole('button', { name: /作成/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          year: 2024,
          title: '新しいエントリー',
          bodyMd: '本文内容',
          isPublic: true,
        })
      );
    });
  });

  it('should edit existing entry', async () => {
    const user = userEvent.setup();
    const mockEntry = {
      id: 'entry-1',
      year: 2023,
      title: 'Original Title',
      bodyMd: 'Original Content',
      imagePaths: [],
      isPublic: true,
      createdAt: new Date().toISOString(),
    };

    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        setTimeout(() => {
          callbacks.next({ items: [mockEntry] });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    render(<HistoryManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Original Title')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /編集/ });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue('Original Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');

    const updateButton = screen.getByRole('button', { name: /更新/ });
    await user.click(updateButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'entry-1',
          title: 'Updated Title',
        })
      );
    });
  });

  it('should delete entry with confirmation', async () => {
    const user = userEvent.setup();
    const mockEntry = {
      id: 'entry-1',
      year: 2023,
      title: 'Entry to Delete',
      bodyMd: 'Content',
      imagePaths: [],
      isPublic: true,
      createdAt: new Date().toISOString(),
    };

    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        setTimeout(() => {
          callbacks.next({ items: [mockEntry] });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    render(<HistoryManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Entry to Delete')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /削除/ });
    await user.click(deleteButton);

    expect(global.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith({ id: 'entry-1' });
    });
  });

  it('should not delete when user cancels', async () => {
    const user = userEvent.setup();
    global.confirm = jest.fn(() => false);

    const mockEntry = {
      id: 'entry-1',
      year: 2023,
      title: 'Entry',
      bodyMd: 'Content',
      imagePaths: [],
      isPublic: true,
      createdAt: new Date().toISOString(),
    };

    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn((callbacks: any) => {
        setTimeout(() => {
          callbacks.next({ items: [mockEntry] });
        }, 0);
        return { unsubscribe: unsubscribeMock };
      }),
    });

    render(<HistoryManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Entry')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /削除/ });
    await user.click(deleteButton);

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('should handle image upload in modal', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['image'], 'image.jpg', { type: 'image/jpeg' });

    mockUploadData.mockReturnValue({
      result: Promise.resolve({
        path: 'history/123-image.jpg',
      } as any),
      cancel: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      state: 'SUCCESS' as any,
    });

    render(<HistoryManagementPage />);

    const createButton = screen.getByRole('button', { name: /新規作成/ });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/画像アップロード/)).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(mockUploadData).toHaveBeenCalled();
    });
  });

  it('should display empty state', async () => {
    render(<HistoryManagementPage />);

    await waitFor(() => {
      expect(screen.getByText(/歴史エントリーがありません/)).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    mockObserveQuery.mockReturnValue({
      subscribe: jest.fn(() => {
        return { unsubscribe: unsubscribeMock };
      }),
    });

    render(<HistoryManagementPage />);

    expect(screen.getByText(/読み込み中/)).toBeInTheDocument();
  });
});
