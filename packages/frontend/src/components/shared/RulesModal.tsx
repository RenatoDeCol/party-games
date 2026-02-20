'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/providers/LanguageContext';

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: string;
}

export default function RulesModal({ isOpen, onClose, initialTab }: RulesModalProps) {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<string>(initialTab || 'HIGHER_LOWER');

    if (!isOpen) return null;

    const tabs = [
        { id: 'HIGHER_LOWER', label: t('rules.higherLower') },
        { id: 'CACHITO', label: t('rules.cachito') },
        { id: 'GENERAL', label: t('rules.general') },
    ];

    const renderRules = () => {
        switch (activeTab) {
            case 'HIGHER_LOWER':
                return (
                    <ul className="list-disc pl-5 space-y-3 text-gray-300">
                        <li>{t('hl.rule1')}</li>
                        <li>{t('hl.rule2')}</li>
                        <li>{t('hl.rule3')}</li>
                        <li>{t('hl.rule4')}</li>
                        <li>{t('hl.rule5')}</li>
                        <li>{t('hl.rule6')}</li>
                        <li>{t('hl.rule7')}</li>
                    </ul>
                );
            case 'CACHITO':
                return (
                    <ul className="list-disc pl-5 space-y-3 text-gray-300">
                        <li>{t('ca.rule1')}</li>
                        <li>{t('ca.rule2')}</li>
                        <li>{t('ca.rule3')}</li>
                        <li>{t('ca.rule4')}</li>
                        <li>{t('ca.rule5')}</li>
                        <li>{t('ca.rule6')}</li>
                        <li>{t('ca.rule7')}</li>
                        <li>{t('ca.rule8')}</li>
                    </ul>
                );
            case 'GENERAL':
                return (
                    <ul className="list-none pl-1 space-y-3 text-gray-300">
                        <li>{t('gen.rule1')}</li>
                        <li>{t('gen.rule2')}</li>
                        <ul className="pl-4 space-y-2 mt-2">
                            <li>{t('gen.rule3')}</li>
                            <li>{t('gen.rule4')}</li>
                            <li>{t('gen.rule5')}</li>
                            <li>{t('gen.rule6')}</li>
                            <li>{t('gen.rule7')}</li>
                            <li>{t('gen.rule8')}</li>
                        </ul>
                    </ul>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
            <div className="w-full max-w-md bg-[#141414] border border-gray-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-zoom-in">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1a]">
                    <h2 className="text-xl font-black text-white px-2 flex-1">{t('rules.title')}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-red-500/80 hover:text-white text-gray-400 font-bold transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex border-b border-gray-800 overflow-x-auto hide-scrollbar bg-[#1a1a1a]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 font-bold whitespace-nowrap transition-colors border-b-2 flex-1 text-center ${activeTab === tab.id
                                ? 'text-[#256af4] border-[#256af4] bg-[#256af4]/10'
                                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 overflow-y-auto flex-1 text-left">
                    {renderRules()}
                </div>

                <div className="p-4 border-t border-gray-800 bg-[#1a1a1a]">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
                    >
                        {t('rules.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
