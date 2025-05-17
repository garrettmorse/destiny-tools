import express from 'express';
import 'dotenv/config';
import { d2 } from "./api/routes/d2.js";
import cors from 'cors';
const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));

app.use('/api/d2', d2);

app.use(express.static('public', { index: false, extensions: ['html'] }));

app.disable('x-powered-by');

app.get('/', (_, res) => res.send('hey'));

app.listen(8080, () => console.log('server listening on 8080'));