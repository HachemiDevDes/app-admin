const fs = require('fs');
try {
  const envFile = fs.readFileSync('D:\\Antigravity Projects\\Eventzone app\\supabase\\.env', 'utf8');
  console.log(envFile);
} catch (e) {
  console.log('Error', e);
}
