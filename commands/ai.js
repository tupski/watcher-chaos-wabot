const fetch = require('node-fetch');

module.exports = async (client, message) => {
    try {
        // Extract prompt from message
        const args = message.body.split(' ').slice(1); // Remove !ai
        const prompt = args.join(' ').trim();
        
        if (!prompt) {
            await message.reply('Please provide a prompt. Usage: !ai <your question>');
            return;
        }
        
        // Check if Gemini API key is configured
        if (!process.env.GEMINI_API_KEY) {
            await message.reply('AI service is not configured. Please contact administrator.');
            return;
        }
        
        // Send "thinking" message
        await message.reply('🤖 *AI is thinking...*');
        
        // Prepare Gemini API request
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };
        
        // Make API request to Gemini
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API error:', errorData);
            await message.reply('Sorry, AI service is temporarily unavailable. Please try again later.');
            return;
        }
        
        const data = await response.json();
        
        // Extract AI response
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            
            // Get user info for quote
            const contact = await message.getContact();
            const userName = contact.pushname || contact.number;
            
            // Format response with quote
            const replyMessage = `🤖 *AI Response*\n\n` +
                `*Question from ${userName}:*\n` +
                `"${prompt}"\n\n` +
                `*Answer:*\n` +
                `${aiResponse}`;
            
            await message.reply(replyMessage);
            
        } else if (data.candidates && data.candidates[0].finishReason === 'SAFETY') {
            await message.reply('🚫 Sorry, I cannot respond to that request due to safety guidelines.');
        } else {
            await message.reply('Sorry, I could not generate a response. Please try rephrasing your question.');
        }
        
    } catch (error) {
        console.error('Error in AI command:', error);
        await message.reply('An error occurred while processing your request. Please try again later.');
    }
};
