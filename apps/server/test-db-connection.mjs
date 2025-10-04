import postgres from 'postgres';

const tests = [
  'postgresql://postgres:postgres@localhost:5432/zerodotemail',
  'postgresql://postgres:postgres@127.0.0.1:5432/zerodotemail',
  'postgresql://postgres@localhost:5432/zerodotemail',  // no password
  'postgresql://postgres@127.0.0.1:5432/zerodotemail',  // no password
];

for (const connString of tests) {
  console.log(`\nTesting: ${connString}`);
  try {
    const sql = postgres(connString, { max: 1 });
    const result = await sql`SELECT current_user`;
    console.log('✅ SUCCESS -', result[0].current_user);
    await sql.end();
    break;  // Exit on first success
  } catch (error) {
    console.log('❌ FAILED -', error.message);
  }
}
