const db = require('../src/config/db');
const supportService = require('../src/modules/support/support.service');

async function runTests() {
  console.log('--- STARTING SUPPORT CHAT SERVICE TESTS ---');
  try {
    // 1. Fetch a customer
    const user = await db.queryOne("SELECT id, email, full_name FROM users WHERE role = 'customer' LIMIT 1");
    if (!user) throw new Error('No customer found in DB to test with.');
    console.log(`Using customer: ${user.email} (ID: ${user.id})`);

    const sessionId = `test_session_${Date.now()}`;
    console.log(`Generated session ID: ${sessionId}`);

    // 2. Test sending a message from customer
    console.log('\nTest Case 1: Customer sending support message...');
    const message1 = await supportService.saveMessage(user.id, {
      session_id: sessionId,
      name: user.full_name,
      email: user.email,
      message: 'Hello, I have a question about shipping.',
      sender_type: 'customer'
    });
    console.log('SUCCESS: Customer message saved:', message1);

    // 3. Test listing messages for session
    console.log('\nTest Case 2: Fetching session messages (Customer)...');
    const messages = await supportService.getSessionMessages(sessionId);
    console.log(`SUCCESS: Fetched ${messages.length} messages.`);
    if (messages.length === 1 && messages[0].message === 'Hello, I have a question about shipping.') {
      console.log('Message content verified.');
    } else {
      console.error('FAIL: Message content mismatch.');
    }

    // 4. Test listing active threads for admin
    console.log('\nTest Case 3: Admin listing active threads...');
    const threads = await supportService.getActiveThreads();
    const testThread = threads.find(t => t.session_id === sessionId);
    if (testThread) {
      console.log('SUCCESS: Active thread found in list:', testThread);
    } else {
      console.error('FAIL: Active thread not found in list.');
    }

    // 5. Test admin replying
    console.log('\nTest Case 4: Admin replying to customer...');
    const adminUser = await db.queryOne("SELECT id, email FROM users WHERE role = 'admin' LIMIT 1");
    if (!adminUser) throw new Error('No admin user found to test with.');
    
    const replyMsg = await supportService.saveMessage(adminUser.id, {
      session_id: sessionId,
      name: 'Support Team',
      email: 'support@myshoes.com',
      message: 'Hello! How can we assist you today?',
      sender_type: 'admin'
    });
    console.log('SUCCESS: Admin reply saved:', replyMsg);

    // 6. Test listing messages again (both messages should exist)
    console.log('\nTest Case 5: Fetching session messages after admin reply...');
    const updatedMessages = await supportService.getSessionMessages(sessionId);
    console.log(`SUCCESS: Fetched ${updatedMessages.length} messages.`);
    if (updatedMessages.length === 2 && updatedMessages[1].sender_type === 'admin') {
      console.log('Conversation log verified.');
    } else {
      console.error('FAIL: Conversation log mismatch.');
    }

    // 7. Clean up database changes
    console.log('\nCleaning up database changes...');
    await db.query('DELETE FROM support_messages WHERE session_id = ?', [sessionId]);
    console.log('Cleaned up successfully.');

  } catch (error) {
    console.error('Test suite failed with error:', error);
  } finally {
    await db.pool.end();
  }
}

runTests();
