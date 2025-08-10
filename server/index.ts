import { Hono } from 'hono';
import { db } from './src/db';
import { questions, categories, choices, associations } from './src/schema';
import { eq, inArray } from 'drizzle-orm';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.get('/api/categories', async (c) => {
  try {
    const allCategories = await db.select().from(categories);
    return c.json({ success: true, data: { categories: allCategories } });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch categories.' } }, 500);
  }
});

app.get('/api/questions', async (c) => {
  const categoriesParam = c.req.query('categories');
  const countParam = c.req.query('count');

  if (!categoriesParam || !countParam) {
    return c.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Categories and count are required.' } }, 400);
  }

  const categoryIds = categoriesParam.split(',');
  const count = parseInt(countParam, 10);

  if (isNaN(count) || count <= 0) {
    return c.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Count must be a positive number.' } }, 400);
  }

  try {
    const allQuestionsForCategories = await db.select()
      .from(questions)
      .where(inArray(questions.categoryId, categoryIds));

    // Fisher-Yates (Knuth) shuffle algorithm
    for (let i = allQuestionsForCategories.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestionsForCategories[i], allQuestionsForCategories[j]] = [allQuestionsForCategories[j], allQuestionsForCategories[i]];
    }

    const selectedQuestions = allQuestionsForCategories.slice(0, count);

    const questionIds = selectedQuestions.map(q => q.id);

    const allChoices = await db.select()
      .from(choices)
      .where(inArray(choices.questionId, questionIds));

    const allAssociations = await db.select()
      .from(associations)
      .where(inArray(associations.questionId, questionIds));

    const questionsWithDetails = selectedQuestions.map(q => {
      if (q.type === 'multiple-choice') {
        const questionChoices = allChoices.filter(c => c.questionId === q.id);
        return {
          id: q.id,
          text: q.questionText,
          category_id: q.categoryId,
          question_type: q.type,
          choices: questionChoices.map(c => ({ id: c.id, text: c.choiceText, is_correct: c.isCorrect })),
        };
      } else if (q.type === 'association') {
        const questionAssociations = allAssociations.filter(a => a.questionId === q.id);
        return {
          id: q.id,
          text: q.questionText,
          category_id: q.categoryId,
          question_type: q.type,
          associations: questionAssociations.map(a => ({ id: a.id, key: a.keyText, value: a.valueText })),
        };
      }
      return {
        id: q.id,
        text: q.questionText,
        category_id: q.categoryId,
        question_type: q.type,
      };
    });

    return c.json({ success: true, data: { questions: questionsWithDetails } });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return c.json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch questions.' } }, 500);
  }
});

export default app;