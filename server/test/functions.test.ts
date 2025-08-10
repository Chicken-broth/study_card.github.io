import * as admin from 'firebase-admin';
import * as functionsTest from 'firebase-functions-test';
import * as functions from '../index';

// Initialize firebase-functions-test to use a test project
const test = functionsTest();

describe('Firebase Functions', () => {
  let adminInitStub: jest.SpyInstance;

  beforeAll(() => {
    // Stub out admin.initializeApp() to prevent actual Firebase initialization
    adminInitStub = jest.spyOn(admin, 'initializeApp');
    adminInitStub.mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore the original admin.initializeApp() method
    adminInitStub.mockRestore();
    test.cleanup();
  });

  describe('getCategories', () => {
    it('should return a list of categories', async () => {
      const mockCategories = [
        { id: 'history', name: '歴史' },
        { id: 'science', name: '科学' },
      ];

      // Mock Firestore behavior
      const mockGet = jest.fn(() => Promise.resolve({
        forEach: (callback: (doc: any) => void) => {
          mockCategories.forEach(cat => callback({ id: cat.id, data: () => cat }));
        },
      }));
      const mockCollection = jest.fn(() => ({
        get: mockGet,
      }));
      jest.spyOn(admin, 'firestore').mockImplementation(() => ({
        collection: mockCollection,
      } as any));

      const req = { method: 'GET' } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

      await functions.getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { categories: mockCategories },
      });
    });

    it('should return 405 for non-GET requests', async () => {
      const req = { method: 'POST' } as any;
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

      await functions.getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.send).toHaveBeenCalledWith('Method Not Allowed');
    });
  });

  describe('getQuestions', () => {
    it('should return questions for specified categories and count', async () => {
      const mockQuestions = [
        { id: 'q1', category_id: 'history', question_text: 'Question 1' },
        { id: 'q2', category_id: 'history', question_text: 'Question 2' },
        { id: 'q3', category_id: 'science', question_text: 'Question 3' },
      ];

      const mockWhere = jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          forEach: (callback: (doc: any) => void) => {
            mockQuestions.forEach(q => callback({ id: q.id, data: () => q }));
          },
        })),
      }));
      const mockCollection = jest.fn(() => ({
        where: mockWhere,
      }));
      jest.spyOn(admin, 'firestore').mockImplementation(() => ({
        collection: mockCollection,
      } as any));

      const req = { method: 'GET', query: { categories: 'history,science', count: '2' } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

      await functions.getQuestions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          questions: expect.arrayContaining([
            expect.objectContaining({ category_id: expect.any(String) }),
          ]),
        }),
      }));
      expect(res.json.mock.calls[0][0].data.questions).toHaveLength(2);
    });

    it('should return 400 if categories or count are missing', async () => {
      const req1 = { method: 'GET', query: { count: '10' } } as any;
      const res1 = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      await functions.getQuestions(req1, res1);
      expect(res1.status).toHaveBeenCalledWith(400);

      const req2 = { method: 'GET', query: { categories: 'history' } } as any;
      const res2 = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      await functions.getQuestions(req2, res2);
      expect(res2.status).toHaveBeenCalledWith(400);
    });
  });

  describe('postQuizResults', () => {
    it('should save quiz results successfully', async () => {
      const mockResults = [
        { question_id: 'q1', is_correct: true },
        { question_id: 'q2', is_correct: false },
      ];

      const mockSet = jest.fn();
      const mockDoc = jest.fn(() => ({ set: mockSet }));
      const mockCollection = jest.fn(() => ({
        doc: mockDoc,
      }));
      const mockBatch = {
        set: mockSet,
        commit: jest.fn(() => Promise.resolve()),
      };
      jest.spyOn(admin, 'firestore').mockImplementation(() => ({
        collection: mockCollection,
        batch: jest.fn(() => mockBatch),
        FieldValue: { serverTimestamp: jest.fn(() => 'mockTimestamp') },
      } as any));

      const req = { method: 'POST', body: { results: mockResults } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

      await functions.postQuizResults(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Results saved successfully.' });
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledTimes(mockResults.length);
    });

    it('should return 400 if results is not an array', async () => {
      const req = { method: 'POST', body: { results: 'not an array' } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

      await functions.postQuizResults(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'INVALID_DATA', message: 'Results must be an array.' } });
    });
  });

  describe('getQuizSummary', () => {
    it('should return quiz summary data', async () => {
      const mockQuizResults = [
        { question_id: 'q1', is_correct: true, category_id: 'history' },
        { question_id: 'q2', is_correct: false, category_id: 'history' },
        { question_id: 'q3', is_correct: true, category_id: 'science' },
      ];
      const mockCategories = [
        { id: 'history', name: '歴史' },
        { id: 'science', name: '科学' },
      ];

      const mockGetResults = jest.fn(() => Promise.resolve({
        forEach: (callback: (doc: any) => void) => {
          mockQuizResults.forEach(r => callback({ data: () => r }));
        },
      }));
      const mockGetCategories = jest.fn(() => Promise.resolve({
        forEach: (callback: (doc: any) => void) => {
          mockCategories.forEach(c => callback({ id: c.id, data: () => c }));
        },
      }));

      const mockCollection = jest.fn((collectionName: string) => {
        if (collectionName === 'quiz_results') {
          return { get: mockGetResults };
        } else if (collectionName === 'categories') {
          return { get: mockGetCategories };
        }
        return {};
      });
      jest.spyOn(admin, 'firestore').mockImplementation(() => ({
        collection: mockCollection,
      } as any));

      const req = { method: 'GET' } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

      await functions.getQuizSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          overall_stats: {
            total_questions_answered: 3,
            average_correct_rate: 2 / 3,
          },
          category_stats: expect.arrayContaining([
            expect.objectContaining({ category_id: 'history', total_questions_answered: 2, correct_rate: 0.5 }),
            expect.objectContaining({ category_id: 'science', total_questions_answered: 1, correct_rate: 1 }),
          ]),
        },
      });
    });
  });
});
