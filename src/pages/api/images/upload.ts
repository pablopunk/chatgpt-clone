import crypto from 'node:crypto';
import ImageKit from 'imagekit';
import type { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const bodyJson = JSON.parse(req.body);
    const imageUrl = bodyJson.imageUrl;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT as string,
    });

    // Fetch the image data from OpenAI's URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image from OpenAI');
    }
    const buffer = await response.buffer();

    // Upload the image to ImageKit
    const uploadResponse = await imagekit.upload({
      file: buffer, // Image buffer
      folder: 'chatgpt-clone',
      fileName: `${Date.now()}-${crypto.randomBytes(16).toString('hex')}.jpg`,
    });

    return res.status(200).json({ url: uploadResponse.url });
  } catch (error) {
    console.error('Error uploading image to ImageKit:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
}
