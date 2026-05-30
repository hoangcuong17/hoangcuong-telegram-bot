const TelegramBot = require('node-telegram-bot-api');
const Anthropic = require('@anthropic-ai/sdk');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const conversations = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  if (!userMessage) return;

  if (!conversations[chatId]) {
    conversations[chatId] = [];
  }

  try {
    await bot.sendChatAction(chatId, 'typing');

    conversations[chatId].push({
      role: 'user',
      content: userMessage
    });

    const response = await client.messages.create({
      model: 'claude-opus-4-20250805',
      max_tokens: 1024,
      system: `Bạn là trợ lý AI thân thiện cho GĐKD Bất động sản.
Hãy trả lời ngắn gọn, rõ ràng, hữu ích.
Sử dụng tiếng Việt.`,
      messages: conversations[chatId]
    });

    const reply = response.content[0].text;

    conversations[chatId].push({
      role: 'assistant',
      content: reply
    });

    if (conversations[chatId].length > 20) {
      conversations[chatId] = conversations[chatId].slice(-20);
    }

    bot.sendMessage(chatId, reply);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    bot.sendMessage(chatId, '❌ Xin lỗi, có lỗi xảy ra.');
  }
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  conversations[chatId] = [];
  bot.sendMessage(chatId, 
    '👋 Xin chào! Tôi là trợ lý AI của anh.\n\n' +
    '📝 Gửi câu hỏi, tôi sẽ hỗ trợ.\n\n' +
    '/clear - Xóa lịch sử chat'
  );
});

bot.onText(/\/clear/, (msg) => {
  const chatId = msg.chat.id;
  conversations[chatId] = [];
  bot.sendMessage(chatId, '✅ Đã xóa lịch sử.');
});

console.log('🤖 Bot Telegram đang chạy...');
