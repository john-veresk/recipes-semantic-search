import { createApp } from './app';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Create and start the server
const app = createApp();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 