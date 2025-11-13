import React, { useState } from 'react';

interface CreatePasswordScreenProps {
    onBack: () => void;
    onNext: () => void;
}

const CreatePasswordScreen: React.FC<CreatePasswordScreenProps> = ({ onBack, onNext }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(true);

    // Don't show mismatch error until the user starts typing in the second box
    const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
    const isNextDisabled = password.length < 8 || password !== confirmPassword;

    const getBorderColor = () => {
        return passwordsMismatch ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-400';
    };

    return (
        <div className="bg-black h-screen w-screen text-white flex flex-col px-8 pt-16 pb-8 font-sans">
            <div className="flex-grow flex flex-col">
                <div className="w-full max-w-md mx-auto">
                    <h1 className="text-2xl mb-8">Google</h1>
                    
                    <h2 className="text-3xl text-white mb-2">Crie uma senha forte</h2>
                    <p className="text-gray-400 text-base mb-10">
                        Crie uma senha forte com uma combinação de letras, números e símbolos
                    </p>

                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                id="password-input"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-4 py-3.5 bg-transparent rounded border ${getBorderColor()} focus:ring-1 focus:ring-blue-400 outline-none peer transition-colors text-base`}
                                autoFocus
                            />
                             <label
                                htmlFor="password-input"
                                className={`absolute left-4 transition-all duration-200 ease-in-out pointer-events-none ${
                                    password
                                    ? 'top-[-10px] text-xs bg-black px-1'
                                    : 'top-3.5 text-base text-gray-400'
                                } ${passwordsMismatch ? 'text-red-500' : 'peer-focus:text-blue-400'} peer-focus:top-[-10px] peer-focus:text-xs peer-focus:bg-black peer-focus:px-1`}
                            >
                                Senha
                            </label>
                        </div>
                        
                        <div className="relative">
                            <input
                                id="confirm-password-input"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-4 py-3.5 bg-transparent rounded border ${getBorderColor()} focus:ring-1 focus:ring-blue-400 outline-none peer transition-colors text-base`}
                            />
                             <label
                                htmlFor="confirm-password-input"
                                className={`absolute left-4 transition-all duration-200 ease-in-out pointer-events-none ${
                                    confirmPassword
                                    ? 'top-[-10px] text-xs bg-black px-1'
                                    : 'top-3.5 text-base text-gray-400'
                                } ${passwordsMismatch ? 'text-red-500' : 'peer-focus:text-blue-400'} peer-focus:top-[-10px] peer-focus:text-xs peer-focus:bg-black peer-focus:px-1`}
                            >
                                Confirmar
                            </label>
                        </div>

                         {passwordsMismatch && (
                            <div className="flex items-center space-x-2 text-red-500 text-xs">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>As senhas não são iguais. Tente novamente.</span>
                            </div>
                        )}
                        
                        <label className="flex items-center space-x-3 cursor-pointer pt-2">
                            <div className="relative flex items-center justify-center w-5 h-5">
                                <input
                                    type="checkbox"
                                    checked={showPassword}
                                    onChange={() => setShowPassword(!showPassword)}
                                    className="sr-only"
                                />
                                <div className={`w-5 h-5 rounded border-2 transition-colors ${showPassword ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}></div>
                                {showPassword && (
                                    <svg className="absolute w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-base text-gray-200">Mostrar senha</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end items-center flex-shrink-0 w-full max-w-md mx-auto">
                <button
                    onClick={onNext}
                    disabled={isNextDisabled}
                    className="bg-[#8ab4f8] text-black font-semibold px-6 py-2.5 rounded-md text-sm hover:opacity-90 transition-opacity disabled:bg-[#3c4043] disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    Avançar
                </button>
            </div>
        </div>
    );
};

export default CreatePasswordScreen;