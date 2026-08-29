const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('jwtVerify')) {
     console.log(`${index + 1}: ${line.trim()}`);
  }
});
