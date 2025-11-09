// Mock Chrome APIs for testing
global.chrome = {
  tabGroups: {
    query: jest.fn(),
    update: jest.fn(),
    move: jest.fn(),
    TAB_GROUP_ID_NONE: -1
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    group: jest.fn(),
    TAB_ID_NONE: -1
  },
  windows: {
    create: jest.fn()
  },
  downloads: {
    download: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    }
  }
};

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve())
  },
  writable: true
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock Blob
global.Blob = class Blob {
  constructor(parts, options) {
    this.parts = parts;
    this.options = options;
  }
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
