import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth'
import surveysApi from './routes/surveys'

const app = new Hono()

app.use(
  '/*',
  cors({
    origin: 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
)

// Mount your auth routes
app.route('/api/auth', auth)
app.route('/api/surveys', surveysApi)

export default app
