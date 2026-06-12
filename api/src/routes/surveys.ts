import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie' // <--- NEW: Import the cookie reader
import { questions, responses, surveys } from '../db/schema'

type Bindings = {
  DB: D1Database
}

const surveysApi = new Hono<{ Bindings: Bindings }>()

// POST /api/surveys -> Creates a blank survey tied to the logged-in user
surveysApi.post('/', async (c) => {
  const db = drizzle(c.env.DB)

  try {
    // 1. Read the user ID directly from the cookie we set in auth.ts
    const currentUserId = getCookie(c, 'userId')

    // 2. If there's no cookie, block the request
    if (!currentUserId) {
      return c.json({ error: 'Unauthorized. Please log in.' }, 401)
    }

    const newSurveyId = crypto.randomUUID()

    await db.insert(surveys).values({
      id: newSurveyId,
      ownerId: currentUserId, // <--- Securely attaches to the real user!
      title: 'Untitled Survey',
    })

    return c.json({ id: newSurveyId }, 201)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to create survey' }, 500)
  }
})

// GET /api/surveys -> Fetches ONLY the surveys for the logged-in user
surveysApi.get('/', async (c) => {
  const db = drizzle(c.env.DB)

  try {
    const currentUserId = getCookie(c, 'userId')

    if (!currentUserId) {
      return c.json({ error: 'Unauthorized. Please log in.' }, 401)
    }

    // Add the .where() clause so it strictly filters out other users' surveys!
    const mySurveys = await db
      .select()
      .from(surveys)
      .where(eq(surveys.ownerId, currentUserId))
      .all()

    return c.json(mySurveys, 200)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch surveys' }, 500)
  }
})

// POST /api/surveys/:id/questions -> Adds a blank question
surveysApi.post('/:id/questions', async (c) => {
  const db = drizzle(c.env.DB);
  const surveyId = c.req.param('id');

  try {
    // 1. Fetch the current questions to figure out the correct position
    const existingQuestions = await db.select()
      .from(questions)
      .where(eq(questions.surveyId, surveyId))
      .all();
      
    // 2. The next position is simply the length of the array
    const nextPosition = existingQuestions.length; 

    const newQuestionId = crypto.randomUUID();

    await db.insert(questions).values({
      id: newQuestionId,
      surveyId: surveyId,
      type: 'text',
      questionText: '',
      position: nextPosition, // <--- FIX: Dynamically sets it to the bottom!
      options: ['Option 1'], 
      required: false,
    });

    return c.json({ 
      id: newQuestionId, 
      type: 'text', 
      questionText: '', 
      options: ['Option 1'] 
    }, 201);

  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to add question' }, 500);
  }
});

// PUT /api/surveys/:id -> Updates the survey metadata and questions
surveysApi.put('/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const surveyId = c.req.param('id')
  const body = await c.req.json()

  try {
    await db
      .update(surveys)
      .set({
        title: body.title,
        description: body.description,
        primaryColor: body.primaryColor,
        logoUrl: body.logoUrl,
      })
      .where(eq(surveys.id, surveyId))

    if (body.questions && Array.isArray(body.questions)) {
      for (let i = 0; i < body.questions.length; i++) {
        const q = body.questions[i]

        await db
          .update(questions)
          .set({
            questionText: q.questionText,
            type: q.type,
            options: q.options,
            position: i,
          })
          .where(eq(questions.id, q.id))
      }
    }

    return c.json({ success: true }, 200)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to save survey' }, 500)
  }
})

// GET /api/surveys/:id -> Fetches a single survey for the builder
surveysApi.get('/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const surveyId = c.req.param('id')

  try {
    const survey = await db.select().from(surveys).where(eq(surveys.id, surveyId)).get()

    if (!survey) {
      return c.json({ error: 'Survey not found' }, 404)
    }

    const surveyQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.surveyId, surveyId))
      .all()

    surveyQuestions.sort((a, b) => a.position - b.position)

    return c.json(
      {
        ...survey,
        questions: surveyQuestions,
      },
      200,
    )
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch survey details' }, 500)
  }
})

// GET /api/surveys/:id/public -> Safe route for anonymous users to load the survey
surveysApi.get('/:id/public', async (c) => {
  const db = drizzle(c.env.DB)
  const surveyId = c.req.param('id')

  try {
    const survey = await db.select().from(surveys).where(eq(surveys.id, surveyId)).get()
    if (!survey) return c.json({ error: 'Survey not found' }, 404)

    const surveyQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.surveyId, surveyId))
      .all()
    surveyQuestions.sort((a, b) => a.position - b.position)

    return c.json({ ...survey, questions: surveyQuestions }, 200)
  } catch (_error) {
    return c.json({ error: 'Failed to load survey' }, 500)
  }
})

// POST /api/surveys/:id/responses -> Saves the anonymous user's answers
surveysApi.post('/:id/responses', async (c) => {
  const db = drizzle(c.env.DB)
  const surveyId = c.req.param('id')
  const body = await c.req.json()

  try {
    const responseId = crypto.randomUUID()

    await db.insert(responses).values({
      id: responseId,
      surveyId: surveyId,
      answers: body.answers,
    })

    return c.json({ success: true, id: responseId }, 201)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to submit response' }, 500)
  }
})

// GET /api/surveys/:id/responses -> Fetches all submissions for the owner dashboard
surveysApi.get('/:id/responses', async (c) => {
  const db = drizzle(c.env.DB)
  const surveyId = c.req.param('id')

  try {
    const surveyResponses = await db
      .select()
      .from(responses)
      .where(eq(responses.surveyId, surveyId))
      .all()

    return c.json(surveyResponses, 200)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch responses' }, 500)
  }
})

export default surveysApi
