const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
require('dotenv').config();

// ==== الإعدادات ====
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PORT = process.env.PORT || 3000;

if (!TOKEN) {
    console.error("❌ خطأ: ضع TELEGRAM_BOT_TOKEN في متغيرات البيئة على Railway");
    process.exit(1);
}

// ==== إنشاء البوت ====
const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

// ==== إعداد السيرفر لتقديم ملف HTML ====
app.use(express.static(__dirname));

// صفحة اللعبة (Web App)
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
});

// صفحة رئيسية للتأكد إن السيرفر شغال
app.get('/', (req, res) => {
    res.send(`
        <h1>🎮 بوت إكس-أو شغال!</h1>
        <p>استخدم البوت على تليجرام: <code>@${(await bot.getMe()).username}</code></p>
        <p>رابط اللعبة: <a href="/game">/game</a></p>
    `);
});

// ==== أوامر البوت ====
const webAppUrl = `https://${process.env.RAILWAY_STATIC_URL || 'localhost:' + PORT}/game`;

// أمر /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'صديقي';

    await bot.sendMessage(chatId, 
        `🎮 *أهلاً بك يا ${firstName}!* 🎮\n\n` +
        `مرحباً بك في بوت لعبة إكس-أو (Tic-Tac-Toe)!\n\n` +
        `✨ *المميزات:*\n` +
        `• وضعين للعب: لاعب ضد لاعب 🤝 أو ضد الكمبيوتر 🤖\n` +
        `• حفظ النقاط 🏆\n` +
        `• تصميم جميل وسهل 🎨\n\n` +
        `👇 اضغط على الزر للعب مباشرة!`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎮 ابدأ اللعب الآن", web_app: { url: webAppUrl } }],
                    [{ text: "📖 شرح اللعبة", callback_data: "help" }]
                ]
            }
        }
    );
});

// أمر /game
bot.onText(/\/game/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, "🎮 اضغط للعب إكس-أو", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎮 فتح اللعبة", web_app: { url: webAppUrl } }]
            ]
        }
    });
});

// أمر /help
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId,
        `📖 *شرح اللعبة*\n\n` +
        `🎯 *الهدف:* الحصول على 3 علامات متتالية (أفقي، رأسي، أو قطري).\n\n` +
        `🎮 *طريقة اللعب:*\n` +
        `• الوضع الأول (👥 لاعب ضد لاعب): تلعب مع صديقك على نفس الجهاز.\n` +
        `• الوضع الثاني (🤖 ضد الكمبيوتر): تلعب ضد الذكاء الاصطناعي.\n\n` +
        `🏆 *النقاط:* البوت يحتفظ بنقاط الفوز لكل لاعب.\n\n` +
        `🔄 *أزرار التحكم:*\n` +
        `• "بداية جديدة" - يبدأ جولة جديدة\n` +
        `• "تصفير النقاط" - يعيد ضبط النقاط\n\n` +
        `✨ استمتع باللعبة!`,
        { parse_mode: 'Markdown' }
    );
});

// التعامل مع الأزرار (Callback Queries)
bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = message.chat.id;

    if (data === 'help') {
        await bot.sendMessage(chatId,
            `🎮 *قواعد اللعبة:*\n` +
            `• اضغط على أي خانة فارغة لتضع علامتك (X أو O).\n` +
            `• أول لاعب يكمل 3 علامات متتالية يفوز.\n` +
            `• إذا امتلأت جميع الخانات بدون فائز، تنتهي الجولة بالتعادل.\n\n` +
            `🔁 غير وضع اللعب من داخل اللعبة!`,
            { parse_mode: 'Markdown' }
        );
    }

    // الرد على الكال بك عشان يختفي التحميل
    await bot.answerCallbackQuery(callbackQuery.id);
});

// أمر /info
bot.onText(/\/info/, async (msg) => {
    const chatId = msg.chat.id;
    const botInfo = await bot.getMe();
    await bot.sendMessage(chatId,
        `🤖 *معلومات البوت*\n\n` +
        `• الاسم: ${botInfo.first_name}\n` +
        `• اليوزر: @${botInfo.username}\n` +
        `• الإصدار: 1.0.0\n` +
        `• المطور: @${msg.from.username || 'المطور'}\n\n` +
        `🚀 مطور بـ Node.js + Express\n` +
        `🎨 لعبة إكس-أو بواجهة حديثة`,
        { parse_mode: 'Markdown' }
    );
});

// ==== تشغيل السيرفر ====
app.listen(PORT, () => {
    console.log(`✅ السيرفر شغال على http://localhost:${PORT}`);
    console.log(`🤖 البوت شغال...`);
    bot.getMe().then(botInfo => {
        console.log(`✅ تم تشغيل البوت: @${botInfo.username}`);
        console.log(`🔗 رابط ويب آب: ${webAppUrl}`);
    });
});

// معالجة الأخطاء
process.on('uncaughtException', (error) => {
    console.error('⚠️ خطأ غير متوقع:', error);
});