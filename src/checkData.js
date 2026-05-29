const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'predictions.json');

try {
  const data = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(data);
  console.log("Data is array?", Array.isArray(json));
  if (Array.isArray(json)) {
    console.log("Length:", json.length);
    console.log("First item:", JSON.stringify(json[0], null, 2));
  } else {
    console.log("Keys:", Object.keys(json));
    const firstKey = Object.keys(json)[0];
    console.log("First item:", JSON.stringify(json[firstKey][0] || json[firstKey], null, 2));
  }
} catch (e) {
  console.error("Error reading file:", e.message);
  
  // try to list public directory
  try {
    const pubDir = path.join(__dirname, '..', 'public');
    const files = fs.readdirSync(pubDir);
    console.log("Files in public:", files);
  } catch (err) {
    console.error("Error listing public dir:", err.message);
  }
}
