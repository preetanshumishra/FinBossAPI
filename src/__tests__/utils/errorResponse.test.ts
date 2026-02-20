import { getErrorMessage } from '../../utils/errorResponse';

describe('getErrorMessage', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should return actual error message in development', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Database connection failed');
    expect(getErrorMessage(error, 'Something went wrong')).toBe(
      'Database connection failed'
    );
  });

  it('should return fallback message in production', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Database connection failed');
    expect(getErrorMessage(error, 'Something went wrong')).toBe(
      'Something went wrong'
    );
  });

  it('should return fallback for non-Error objects in development', () => {
    process.env.NODE_ENV = 'development';
    expect(getErrorMessage('string error', 'Fallback')).toBe('Fallback');
  });

  it('should return fallback for non-Error objects in production', () => {
    process.env.NODE_ENV = 'production';
    expect(getErrorMessage({ code: 500 }, 'Fallback')).toBe('Fallback');
  });

  it('should return fallback in test env for non-Error', () => {
    process.env.NODE_ENV = 'test';
    expect(getErrorMessage(null, 'Fallback')).toBe('Fallback');
  });

  it('should return actual message in test env for Error', () => {
    process.env.NODE_ENV = 'test';
    const error = new Error('Real error');
    expect(getErrorMessage(error, 'Fallback')).toBe('Real error');
  });
});
