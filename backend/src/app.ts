import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.listen(3000, () => {
	console.log('Backend running on http://localhost:3000');
});
