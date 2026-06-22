export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  const body = req.body;
  if (!body || !body.message) {
    return res.status(200).send('OK');
  }

  const chatId = body.message.chat.id;
  const userText = body.message.text;

  if (!userText) {
    return res.status(200).send('OK');
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (userText === '/start') {
    await sendTelegramMessage(chatId, "Привет! Я умный помощник детской модельной школы развития. Задайте мне любой вопрос о направлениях обучения, расписании, ценах или записи на пробное занятие.", botToken);
    return res.status(200).send('OK');
  }

  try {
    const aiResponse = await getGeminiResponse(userText, geminiApiKey);
    await sendTelegramMessage(chatId, aiResponse, botToken);
  } catch (error) {
    console.error(error);
    await sendTelegramMessage(chatId, "Извините, произошла техническая ошибка. Пожалуйста, попробуйте написать позже или свяжитесь с администратором школы.", botToken);
  }

  return res.status(200).send('OK');
}

async function getGeminiResponse(prompt, apiKey) {
  // База знаний модельной школы. Ваша подруга может изменить этот текст прямо в файле на GitHub в любое время.
  const systemInstruction = `Вы — вежливый, заботливый и профессиональный администратор детской модельной школы развития. 
Ваша задача — отвечать на вопросы родителей и учеников. 
Используйте только достоверную информацию из базы знаний ниже. Если вы чего-то не знаете, вежливо предложите написать администратору или позвонить по телефону.

База знаний модельной школы:
- Возраст детей: принимаем мальчиков и девочек от 4 до 17 лет. Группы делятся по возрастам: младшая (4-7 лет), средняя (8-12 лет), старшая (13-17 лет).
- Направления обучения: дефиле, фотопозирование (с практикой на съемочной площадке), актерское мастерство, основы стиля, детский этикет, пластика и осанка.
- Пробное занятие: первое пробное занятие всегда БЕСПЛАТНОЕ, но требуется предварительная запись.
- Стоимость обучения: абонемент на 8 занятий (1 месяц, занятия 2 раза в неделю по 1.5 часа) стоит 5000 рублей.
- Адрес: ул. Ленина, д. 10, оф. 305 (в центре города).
- Контакты: телефон +7 (999) 123-45-67, Instagram @example_model_school.
- Частые вопросы: Родителям присутствовать на занятиях нельзя, чтобы дети не отвлекались. В конце каждого курса мы проводим отчетный показ и выдаем фирменный сертификат.`;

  // Мы обновили ссылку на современную и поддерживаемую модель gemini-2.0-flash:
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemInstruction },
            { text: `Вопрос пользователя: ${prompt}` }
          ]
        }
      ]
    })
  });

  const data = await response.json();
  
  console.error("ОТВЕТ ОТ GOOGLE GEMINI:", JSON.stringify(data, null, 2));

  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
    return data.candidates[0].content.parts[0].text;
  }
  throw new Error('Invalid Gemini API response');
}

async function sendTelegramMessage(chatId, text, token) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });
}
