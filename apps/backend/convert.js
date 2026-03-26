const fs = require('fs');
const content = fs.readFileSync('ts_errors.txt', 'utf16le');
fs.writeFileSync('ts_errors_utf8.txt', content, 'utf8');
