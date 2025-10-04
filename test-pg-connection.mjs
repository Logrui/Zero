import postgres from 'postgres';

const connectionString = 'postgresql://postgres:postgres@localhost:5432/zerodotemail?sslmode=disable';

console.log('Testing PostgreSQL connection with Node.js postgres library...');
console.log('Connection string:', connectionString);

try {
  const sql = postgres(connectionString);
  
  const result = await sql`SELECT current_user, current_database(), version()`;
  
  console.log('\n✅ Connection successful!');
  console.log('User:', result[0].current_user);
  console.log('Database:', result[0].current_database);
  console.log('Version:', result[0].version.substring(0, 50) + '...');
  
  await sql.end();
  process.exit(0);
} catch (error) {
  console.error('\n❌ Connection failed!');
  console.error('Error:', error.message);
  console.error('Code:', error.code);
  process.exit(1);
}
