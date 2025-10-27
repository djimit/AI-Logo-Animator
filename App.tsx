
import React, { useState, useEffect, useCallback } from 'react';
import type { AspectRatio } from './types';
import { generateLogoImage, generateAnimatedVideo, fileToBase64 } from './services/geminiService';
import ApiKeySelector from './components/ApiKeySelector';
import Spinner from './components/Spinner';

// FIX: Correctly type `window.aistudio` by declaring a global `AIStudio` interface.
// This resolves a conflict with a pre-existing declaration for `window.aistudio` which
// expects a named type `AIStudio` instead of an anonymous object type.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio: AIStudio;
    }
}

const App: React.FC = () => {
    const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
    const [logoDescription, setLogoDescription] = useState<string>('');
    const [animationPrompt, setAnimationPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');

    const [logoImageBase64, setLogoImageBase64] = useState<string | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    const [isGeneratingLogo, setIsGeneratingLogo] = useState<boolean>(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
    const [videoStatus, setVideoStatus] = useState<string>('');
    
    const [error, setError] = useState<string | null>(null);
    
    const checkApiKey = useCallback(async () => {
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
        } else {
            // Fallback for environments where aistudio is not available
            console.warn("AI Studio context not found. Assuming API key is set via environment variables.");
            setApiKeySelected(true);
        }
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    const handleSelectKey = async () => {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true); // Assume success to avoid race conditions
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setError(null);
            setGeneratedVideoUrl(null);
            try {
                const base64 = await fileToBase64(file);
                setLogoImageBase64(base64);
            } catch (err) {
                setError("Failed to read image file.");
                console.error(err);
            }
        }
    };

    const handleGenerateLogo = async () => {
        if (!logoDescription) {
            setError("Please enter a description for your logo.");
            return;
        }
        setError(null);
        setIsGeneratingLogo(true);
        setLogoImageBase64(null);
        setGeneratedVideoUrl(null);

        try {
            const imageB64 = await generateLogoImage(logoDescription);
            setLogoImageBase64(imageB64);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Logo generation failed: ${errorMessage}`);
            console.error(err);
        } finally {
            setIsGeneratingLogo(false);
        }
    };

    const handleGenerateVideo = async () => {
        if (!logoImageBase64) {
            setError("Please generate or upload a logo first.");
            return;
        }
        if (!animationPrompt) {
            setError("Please enter a prompt for the animation.");
            return;
        }
        setError(null);
        setIsGeneratingVideo(true);
        setGeneratedVideoUrl(null);

        try {
            const videoUrl = await generateAnimatedVideo(logoImageBase64, animationPrompt, aspectRatio, setVideoStatus);
            setGeneratedVideoUrl(videoUrl);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during video generation.";
            console.error(err);

            if (errorMessage.includes("Requested entity was not found")) {
                setError("API Key not found or invalid. Please re-select your API Key.");
                setApiKeySelected(false); 
            } else {
                setError(`Video generation failed: ${errorMessage}`);
            }
        } finally {
            setIsGeneratingVideo(false);
            setVideoStatus('');
        }
    };

    if (!apiKeySelected) {
        return <ApiKeySelector onKeySelected={handleSelectKey} />;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                        AI Logo Animator
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">Design your brand's identity, then bring it to life.</p>
                </header>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Controls Column */}
                    <div className="space-y-8">
                        {/* Step 1: Logo Generation */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h2 className="text-2xl font-bold mb-1 text-purple-300">Step 1: Create Your Logo</h2>
                            <p className="text-gray-400 mb-4">Describe your logo or upload an existing one.</p>
                            <textarea
                                className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                                rows={4}
                                placeholder="e.g., A minimalist fox icon for a tech startup called 'FoxKit', using shades of orange and blue."
                                value={logoDescription}
                                onChange={(e) => setLogoDescription(e.target.value)}
                            />
                            <button
                                onClick={handleGenerateLogo}
                                disabled={isGeneratingLogo || isGeneratingVideo}
                                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center disabled:bg-gray-500"
                            >
                                {isGeneratingLogo ? <><Spinner /> <span className="ml-2">Generating...</span></> : 'Generate Logo'}
                            </button>
                            <div className="relative flex py-5 items-center">
                                <div className="flex-grow border-t border-gray-600"></div>
                                <span className="flex-shrink mx-4 text-gray-400">OR</span>
                                <div className="flex-grow border-t border-gray-600"></div>
                            </div>
                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                onChange={handleImageUpload}
                                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                            />
                        </div>

                        {/* Step 2: Video Animation */}
                        <div className={`bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 transition-opacity duration-500 ${!logoImageBase64 ? 'opacity-50 pointer-events-none' : ''}`}>
                             <h2 className="text-2xl font-bold mb-1 text-blue-300">Step 2: Animate It</h2>
                             <p className="text-gray-400 mb-4">Describe how your logo should animate.</p>
                            <textarea
                                className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                rows={4}
                                placeholder="e.g., The fox winks and its tail swishes, leaving a trail of sparkling code."
                                value={animationPrompt}
                                onChange={(e) => setAnimationPrompt(e.target.value)}
                                disabled={!logoImageBase64}
                            />
                            <div className="mt-4">
                                <label className="block text-gray-400 mb-2">Aspect Ratio:</label>
                                <div className="flex space-x-4">
                                    <button onClick={() => setAspectRatio('16:9')} className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${aspectRatio === '16:9' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Landscape (16:9)</button>
                                    <button onClick={() => setAspectRatio('9:16')} className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${aspectRatio === '9:16' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Portrait (9:16)</button>
                                </div>
                            </div>
                            <button
                                onClick={handleGenerateVideo}
                                disabled={isGeneratingVideo || !logoImageBase64}
                                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center disabled:bg-gray-500"
                            >
                                {isGeneratingVideo ? <><Spinner /> <span className="ml-2">Generating Video...</span></> : 'Generate Animation'}
                            </button>
                        </div>
                    </div>

                    {/* Results Column */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center justify-center min-h-[400px] lg:min-h-full">
                        {!logoImageBase64 && !isGeneratingLogo && <div className="text-center text-gray-500"><p>Your generated content will appear here.</p></div>}
                        
                        {isGeneratingLogo && <div className="text-center"><Spinner className="w-12 h-12 mx-auto text-purple-400" /><p className="mt-4 text-lg">Generating your logo...</p></div>}
                        
                        {logoImageBase64 && !isGeneratingVideo && !generatedVideoUrl && (
                            <div className="w-full max-w-sm">
                                <h3 className="text-xl font-bold text-center mb-4">Your Logo</h3>
                                <img src={`data:image/png;base64,${logoImageBase64}`} alt="Generated Logo" className="rounded-lg shadow-2xl mx-auto" />
                            </div>
                        )}

                        {isGeneratingVideo && (
                            <div className="text-center">
                                <Spinner className="w-12 h-12 mx-auto text-blue-400" />
                                <p className="mt-4 text-lg">Animating your logo...</p>
                                <p className="mt-2 text-gray-400 animate-pulse">{videoStatus}</p>
                            </div>
                        )}

                        {generatedVideoUrl && (
                             <div className="w-full">
                                <h3 className="text-xl font-bold text-center mb-4">Your Animation</h3>
                                <video
                                    src={generatedVideoUrl}
                                    controls
                                    autoPlay
                                    loop
                                    className={`w-full rounded-lg shadow-2xl mx-auto ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16] max-h-[70vh]'}`}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;