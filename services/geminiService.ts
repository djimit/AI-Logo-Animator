
import { GoogleGenAI } from "@google/genai";
import type { AspectRatio } from "../types";

// Helper to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

export const generateLogoImage = async (prompt: string): Promise<string> => {
    // A new instance is created for each call to use the latest API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `a professional, modern, vector-style logo for a company. Description: "${prompt}". The logo should be on a clean, solid-colored background. Minimalist, flat design.`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
    }
    throw new Error("Image generation failed.");
};

const loadingMessages = [
    "Warming up the animation engine...",
    "Teaching pixels to dance...",
    "Composing a visual symphony...",
    "Rendering the final masterpiece...",
    "Almost there, adding the final sparkle...",
    "Finalizing the sequence...",
    "Polishing the frames..."
];

export const generateAnimatedVideo = async (
    imageB64: string,
    prompt: string,
    aspectRatio: AspectRatio,
    onStatusUpdate: (message: string) => void
): Promise<string> => {
    // A new instance is created for each call to use the latest API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let messageIndex = 0;
    onStatusUpdate(loadingMessages[messageIndex]);

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: {
            imageBytes: imageB64,
            mimeType: 'image/png',
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        onStatusUpdate(loadingMessages[messageIndex]);
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (!operation.response?.generatedVideos?.[0]?.video?.uri) {
        throw new Error("Video generation operation completed but no video URI was found.");
    }
    
    onStatusUpdate("Fetching generated video...");
    const downloadLink = operation.response.generatedVideos[0].video.uri;
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};
