import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import { setupSocket } from './socket';

const app = express();
app.use(cors());

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

setupSocket(io);

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
