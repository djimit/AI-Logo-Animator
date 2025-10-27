
import React from 'react';

interface ApiKeySelectorProps {
    onKeySelected: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-800 rounded-lg shadow-2xl text-center">
            <div className="max-w-md w-full space-y-6">
                <div className="p-4 bg-yellow-900/50 border border-yellow-500 rounded-lg">
                    <h2 className="text-2xl font-bold text-yellow-300">Action Required</h2>
                </div>
                <p className="text-gray-300">
                    To generate videos with the Veo model, you must select an API key associated with a project that has billing enabled.
                </p>
                <p className="text-sm text-gray-400">
                    This step is required to cover the computational costs of video generation. For more details, please review the 
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-1">
                        billing documentation
                    </a>.
                </p>
                <button
                    onClick={onKeySelected}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                >
                    Select API Key
                </button>
            </div>
        </div>
    );
};

export default ApiKeySelector;
