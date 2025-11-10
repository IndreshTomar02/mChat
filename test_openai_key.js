require('dotenv').config();
const axios = require('axios');

(async () => {
  console.log('Testing key ->', process.env.OPENAI_API_KEY.slice(0, 8) + '...');
  try {
    const r = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say hello!' }]
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Success:', r.data.choices[0].message.content);
  } catch (err) {
    console.error('❌ OpenAI test error:',
      err.response?.status, err.response?.data || err.message);
  }
})();
