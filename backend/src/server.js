'use strict';

// Load local dev env vars from backend/.env
require('dotenv').config({ path: __dirname + '/../.env' });

const app  = require('../../api/index');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Dev Server] Running on http://localhost:${PORT}`);
});
