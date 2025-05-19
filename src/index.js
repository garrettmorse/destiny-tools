import express from 'express';
import 'dotenv/config';
import { d2 } from "./api/routes/d2.js";
import path from "node:path";
import cors from 'cors';
const app = express();

const __dirname = import.meta.dirname;

if (process.env.NODE_ENV === 'development') {
  app.use(cors({ origin: 'http://localhost:5173' }));
}

app.use('/api/d2', d2);

app.use('/raidlytics', express.static('dist', { extensions: ['html'] }));

app.disable('x-powered-by');

app.listen(8080, () => console.log('server listening on 8080'));

app.get('/', (_, res) => res.send('hey'));

app.get('*none', (_, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

