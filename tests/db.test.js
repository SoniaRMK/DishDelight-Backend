const { Pool } = require('pg');
const db = require('../models/db');

// Mock the Pool class from pg
jest.mock('pg', () => {
  const mockQuery = jest.fn();
  return {
    Pool: jest.fn(() => ({
      query: mockQuery,
    })),
  };
});

describe('Database Model', () => {
  let mockPool;

  beforeEach(() => {
    mockPool = new Pool();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call pool.query with correct SQL query and parameters', async () => {
    const mockResult = { rows: [{ id: 1, name: 'Test Data' }] };
    mockPool.query.mockResolvedValue(mockResult);

    const text = 'SELECT * FROM test_table WHERE id = $1';
    const params = [1];

    const result = await db.query(text, params);

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    expect(mockPool.query).toHaveBeenCalledWith(text, params);
    expect(result).toEqual(mockResult);
  });

  it('should handle errors from pool.query', async () => {
    const mockError = new Error('Database error');
    mockPool.query.mockRejectedValue(mockError);

    const text = 'SELECT * FROM test_table WHERE id = $1';
    const params = [1];

    await expect(db.query(text, params)).rejects.toThrow(mockError);

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    expect(mockPool.query).toHaveBeenCalledWith(text, params);
  });
});
