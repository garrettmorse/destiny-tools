import express from 'express';
import 'dotenv/config';
import { d2 } from "./api/routes/d2.js";
import path from "node:path";
import cors from 'cors';

const ports = [80, 443, 8080];

ports.forEach(port => {
  const app = express();
  
  const __dirname = import.meta.dirname;
  
  if (process.env.NODE_ENV === 'development') {
    app.use(cors({ origin: 'http://localhost:5173' }));
  }
  
  app.use('/api/d2', d2);
  
  app.disable('x-powered-by');

  app.set('trust proxy', 'process.env.TRUSTED_PROXY');

  app.use('/raidlytics', express.static('dist/raidlytics', { extensions: ['html'] }));
  
  app.use('/edgestats', express.static('dist/edgestats', { extensions: ['html'] }));

  app.listen(port, () => console.log(`server listening on ${port}`));
  
  app.get('/', (_, res) => res.send('hey'));
  
  app.get('/raidlytics*none', (_, res) => {
    res.sendFile(path.join(__dirname, "..", "dist/raidlytics", "index.html"));
  });

  app.get('/edgestats*none', (_, res) => {
    res.sendFile(path.join(__dirname, "..", "dist/edgestats", "index.html"));
  });
});

