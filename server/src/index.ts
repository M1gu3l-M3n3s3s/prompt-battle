import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import { setupSocket } from './socket';
import { getImage } from './imageProxy';

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.ALLOWED_ORIGIN || '*', methods: ['GET', 'POST'] },
});

setupSocket(io);

app.get('/api/images/:roomId/:hash', (req, res) => {
  const { roomId, hash } = req.params;
  const image = getImage(roomId, hash);
  if (!image) {
    return res.status(404).send('Image not found');
  }
  res.set('Content-Type', 'image/png');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(image);
});

app.get('*', (_req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).send('Not found');
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
