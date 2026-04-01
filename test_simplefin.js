import 'dotenv/config';
import fs from 'fs';
import path from 'path';

async function testSimpleFin() {
  let token = process.env.SimpleFIN;
  if (!token) {
    console.error('SimpleFIN token not found in .env');
    return;
  }

  // Check if it's a base64 encoded SETUP_TOKEN or an ACCESS_URL
  let decoded;
  try {
    decoded = Buffer.from(token, 'base64').toString('utf8');
  } catch (e) {
    decoded = token;
  }

  let accessUrl = '';
  // SimpleFIN claim URLs have /claim/ in them
  if (decoded.startsWith('http') && (decoded.includes('/claim/') || decoded.includes('/simplefin/claim/'))) {
    console.log('Claiming Setup Token...');
    try {
      const response = await fetch(decoded, {
        method: 'POST',
        headers: { 'Content-Length': '0' }
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to claim token (${response.status}): ${text}`);
      }

      accessUrl = await response.text();
      console.log('Successfully claimed! Access URL received.');
      
      // Update .env file
      const envPath = path.resolve('.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace the SimpleFIN value with the new Access URL
      // We will escape characters if necessary, but SimpleFIN access URLs are usually fine
      const updatedEnv = envContent.replace(/^SimpleFIN=.*/m, `SimpleFIN=${accessUrl}`);
      fs.writeFileSync(envPath, updatedEnv);
      
      console.log('Successfully updated .env with the new Access URL.');
      process.env.SimpleFIN = accessUrl; // Update process.env for the rest of this run
    } catch (error) {
      console.error('Error claiming token:', error.message);
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
          console.log('NOTE: Setup tokens can only be claimed once.');
      }
      return;
    }
  } else {
    console.log('Token is not a Setup Token. Using existing Access URL.');
    accessUrl = token;
  }

  if (!accessUrl) return;

  // Now let's try to fetch accounts
  // Access URL looks like: https://user:pass@host/path
  console.log('Fetching accounts...');

  try {
    // Extract credentials just in case Node fetch doesn't handle them
    const url = new URL(accessUrl);
    const authHeader = `Basic ${Buffer.from(`${url.username}:${url.password}`).toString('base64')}`;
    const cleanUrl = `${url.protocol}//${url.host}${url.pathname}/accounts?version=2`;

    const response = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Account fetch failed (${response.status}): ${JSON.stringify(data)}`);
    }

    console.log('Successfully fetched accounts!');
    console.log('Accounts detected:', data.accounts?.length || 0);
    
    if (data.accounts) {
        data.accounts.forEach(acc => {
            console.log(`- ${acc.name}${acc.org ? ` (${acc.org.name})` : ''}: ${acc.balance} ${acc.currency || ''}`);
            if (acc.transactions && acc.transactions.length > 0) {
                console.log('  [SAMPLE TRANSACTION]');
                console.log(JSON.stringify(acc.transactions[0], null, 2));
            }
        });
    }

    if (data.errors && data.errors.length > 0) {
        console.warn('SimpleFIN errors:', data.errors);
    }
    
    console.log('\n--- ALL SET ---');
    console.log('The Access URL is now saved in your .env file under SimpleFIN.');
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

testSimpleFin();
