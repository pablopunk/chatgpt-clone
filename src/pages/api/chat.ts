import crypto from 'node:crypto';
import ImageKit from 'imagekit';
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import OpenAI from 'openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const { messages, model, imageModel, type, openaiApiKey } = req.body;

        if (!openaiApiKey) {
            return res.status(400).json({ error: 'OpenAI API key is required' });
        }

        const openai = new OpenAI({
            apiKey: openaiApiKey,
            dangerouslyAllowBrowser: false,
        });

        if (type === 'image') {
            // Handle image generation
            const functions = [
                {
                    name: 'generate_image',
                    description: 'Generates an image based on the conversation',
                    parameters: {
                        type: 'object',
                        properties: {
                            prompt: {
                                type: 'string',
                                description: 'The prompt for the image generation',
                            },
                        },
                        required: ['prompt'],
                    },
                },
            ];

            const completion = await openai.chat.completions.create({
                model,
                messages,
                functions,
                function_call: { name: 'generate_image' },
            });

            const functionCall = completion.choices[0].message?.function_call;
            if (functionCall && functionCall.name === 'generate_image') {
                const functionArgs = JSON.parse(functionCall.arguments || '{}');
                const imagePrompt = functionArgs.prompt || '';

                // Call the image generation API
                const response = await openai.images.generate({
                    prompt: imagePrompt,
                    n: 1,
                    size: imageModel === 'dall-e-3' ? '1024x1024' : '512x512',
                    model: imageModel,
                });

                const openaiImageUrl = response.data[0].url;

                // Upload the image to ImageKit
                const imagekit = new ImageKit({
                    publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
                    privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
                    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT as string,
                });

                const fetchResponse = await fetch(openaiImageUrl);
                if (!fetchResponse.ok) {
                    throw new Error('Failed to fetch image from OpenAI');
                }
                const buffer = await fetchResponse.buffer();

                const uploadResponse = await imagekit.upload({
                    file: buffer,
                    folder: 'chatgpt-clone',
                    fileName: `${Date.now()}-${crypto.randomBytes(16).toString('hex')}.jpg`,
                });

                return res.status(200).json({
                    role: 'assistant',
                    content: "Here's your generated image:",
                    imageUrl: uploadResponse.url,
                    type: 'image',
                });
            }
            return res.status(500).json({ error: 'Failed to generate image' });
        }
        // Handle text generation
        const completion = await openai.chat.completions.create({
            model,
            messages,
            stream: false,
        });

        const assistantMessage = completion.choices[0].message;

        return res.status(200).json(assistantMessage);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Failed to process the request' });
    }
}
