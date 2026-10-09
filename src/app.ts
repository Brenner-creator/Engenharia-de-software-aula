import express from 'express';
import cors from 'cors';
import routes from './routes';
import errorHandler from '@/middlewares/errorHandler';
import { paginationMiddleware } from '@/middlewares/pagination';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '@/docs/swagger';

const app = express();

app.set('query parser', 'extended');

// Middleware
app.use(cors());
app.use(express.json());
app.use(paginationMiddleware);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

app.use(errorHandler);

export default app;