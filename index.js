const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
require('dotenv').config();

// ========== الإعدادات ==========
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PORT = process.env.PORT || 3000;

if (!TOKEN) {
    console.error("❌ خطأ: ضع TELEGRAM_BOT_TOKEN في متغيرات البيئة");
    process.exit(1);
}

// ========== إنشاء البوت والسيرفر ==========
const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

// ========== تسجيل الأوامر تلقائياً ==========
const commands = [
    { command: 'start', description: '🎮 بدء البوت والترحيب' },
    { command: 'game', description: '🎲 فتح لعبة إكس-أو' },
    { command: 'help', description: '📖 شرح قوانين اللعبة' },
    { command: 'info', description: 'ℹ️ معلومات عن البوت' },
    { command: 'about', description: '📝 عن البوت والمطور' },
    { command: 'commands', description: '📋 عرض جميع الأوامر' }
];

bot.setMyCommands(commands).then(() => {
    console.log('✅ تم تسجيل الأوامر بنجاح');
}).catch(err => {
    console.error('❌ خطأ في تسجيل الأوامر:', err.message);
});

// ========== إعداد السيرفر ==========
app.use(express.static(__dirname));

// صفحة اللعبة (Web App)
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
    bot.getMe().then(botInfo => {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>بوت إكس-أو</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 50px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }
                    .container {
                        background: rgba(255,255,255,0.9);
                        color: #333;
                        padding: 30px;
                        border-radius: 20px;
                        max-width: 600px;
                        margin: auto;
                    }
                    a {
                        display: inline-block;
                        background: #667eea;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 10px;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🎮 بوت إكس-أو شغال!</h1>
                    <p>استخدم البوت على تليجرام: <strong>@${botInfo.username}</strong></p>
                    <p>رابط اللعبة: <a href="/game">/game</a></p>
                    <hr>
                    <h3>📋 الأوامر المتاحة:</h3>
                    <ul style="text-align: right; direction: rtl;">
                        <li>/start - بدء البوت</li>
                        <li>/game - فتح اللعبة</li>
                        <li>/help - شرح اللعبة</li>
                        <li>/info - معلومات البوت</li>
                        <li>/about - عن البوت</li>
                        <li>/commands - عرض الأوامر</li>
                    </ul>
                </div>
            </body>
            </html>
        `);
    });
});

// ========== دالة للحصول على رابط اللعبة ==========
function getWebAppUrl() {
    if (process.env.RAILWAY_STATIC_URL) {
        return `https://${process.env.RAILWAY_STATIC_URL}/game`;
    }
    return `http://localhost:${PORT}/game`;
}

// ========== أوامر البوت ==========

// 1. أمر /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'صديقي';
    const gameUrl = getWebAppUrl();

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
                    [{ text: "🎮 ابدأ اللعب الآن", web_app: { url: gameUrl } }],
                    [{ text: "📖 شرح اللعبة", callback_data: "help" }],
                    [{ text: "📋 عرض الأوامر", callback_data: "commands" }]
                ]
            }
        }
    );
});

// 2. أمر /game
bot.onText(/\/game/, async (msg) => {
    const chatId = msg.chat.id;
    const gameUrl = getWebAppUrl();
    
    await bot.sendMessage(chatId, "🎮 اضغط للعب إكس-أو", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎮 فتح اللعبة", web_app: { url: gameUrl } }]
            ]
        }
    });
});

// 3. أمر /help
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

// 4. أمر /info
bot.onText(/\/info/, async (msg) => {
    const chatId = msg.chat.id;
    const botInfo = await bot.getMe();
    await bot.sendMessage(chatId,
        `🤖 *معلومات البوت*\n\n` +
        `• الاسم: ${botInfo.first_name}\n` +
        `• اليوزر: @${botInfo.username}\n` +
        `• الإصدار: 2.0.0\n` +
        `• المكتبات: Node.js, Express, node-telegram-bot-api\n\n` +
        `🚀 تم التطوير خصيصاً للعبة إكس-أو`,
        { parse_mode: 'Markdown' }
    );
});

// 5. أمر /about
bot.onText(/\/about/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId,
        `📝 *عن البوت*\n\n` +
        `هذا البوت مصمم خصيصاً للعبة إكس-أو (Tic-Tac-Toe).\n\n` +
        `🔧 *التقنيات المستخدمة:*\n` +
        `• Node.js للخادم\n` +
        `• Express لخدمة الويب\n` +
        `• Telegram Bot API للتفاعل\n` +
        `• HTML/CSS/JS للواجهة\n\n` +
        `🎨 تم التطوير بواجهة عربية بالكامل\n\n` +
        `✨ استمتع باللعب مع أصدقائك!`,
        { parse_mode: 'Markdown' }
    );
});

// 6. أمر /commands
bot.onText(/\/commands/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId,
        `📋 *قائمة الأوامر المتاحة*\n\n` +
        `/start - بدء البوت والترحيب 🎮\n` +
        `/game - فتح لعبة إكس-أو 🎲\n` +
        `/help - شرح قوانين اللعبة 📖\n` +
        `/info - معلومات عن البوت ℹ️\n` +
        `/about - عن البوت والمطور 📝\n` +
        `/commands - عرض هذه القائمة 📋\n\n` +
        `💡 *نصيحة:* اضغط على أي أمر لتنفيذه مباشرة!`,
        { parse_mode: 'Markdown' }
    );
});

// ========== التعامل مع الأزرار (Callback Queries) ==========
bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = message.chat.id;

    if (data === 'help') {
        await bot.sendMessage(chatId,
            `🎮 *قواعد اللعبة:*\n\n` +
            `1. اضغط على أي خانة فارغة لتضع علامتك (X أو O).\n` +
            `2. أول لاعب يكمل 3 علامات متتالية (أفقي/رأسي/قطري) يفوز.\n` +
            `3. إذا امتلأت جميع الخانات بدون فائز، تنتهي الجولة بالتعادل.\n\n` +
            `🔁 *كيف تغير وضع اللعب؟*\n` +
            `من داخل اللعبة، اضغط على "👥 لاعب ضد لاعب" أو "🤖 ضد الكمبيوتر".\n\n` +
            `🏆 *النقاط:* البوت يحتفظ بنقاط الفوز تلقائياً.`,
            { parse_mode: 'Markdown' }
        );
    }
    
    else if (data === 'commands') {
        await bot.sendMessage(chatId,
            `📋 *الأوامر المتاحة*\n\n` +
            `/start - بدء البوت\n` +
            `/game - فتح اللعبة\n` +
            `/help - شرح اللعبة\n` +
            `/info - معلومات البوت\n` +
            `/about - عن البوت\n` +
            `/commands - عرض الأوامر\n\n` +
            `💡 استخدم أي أمر من القائمة أعلاه!`,
            { parse_mode: 'Markdown' }
        );
    }

    await bot.answerCallbackQuery(callbackQuery.id);
});

// ========== تشغيل السيرفر ==========
app.listen(PORT, () => {
    console.log(`✅ السيرفر شغال على http://localhost:${PORT}`);
    console.log(`🤖 البوت شغال...`);
    bot.getMe().then(botInfo => {
        console.log(`✅ تم تشغيل البوت: @${botInfo.username}`);
        console.log(`🔗 رابط ويب آب: ${getWebAppUrl()}`);
        console.log(`📋 الأوامر المسجلة: ${commands.length} أمر`);
    }).catch(err => {
        console.error("❌ خطأ في الاتصال بالبوت:", err.message);
    });
});

// معالجة الأخطاء
process.on('uncaughtException', (error) => {
    console.error('⚠️ خطأ غير متوقع:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ خطأ في Promise:', reason);
});
