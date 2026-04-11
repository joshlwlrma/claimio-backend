import React, { useState } from 'react';
import { HelpCircle, X, ChevronDown, ChevronUp, Search, HandHelping, Shield, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const faqs = [
    {
        icon: Search,
        question: 'How do I claim an item?',
        answer: 'Find the item you lost in the Dashboard. If someone posted it as a "Found" item, click on it and fill out the claim form with proof of ownership (e.g., serial number, description of unique marks). An admin will review and approve or reject your claim.'
    },
    {
        icon: HandHelping,
        question: 'I found a lost item, what do I do?',
        answer: 'Search the Dashboard for a matching "Lost" report. Click on it and use the "I Found This Item" button to let the owner know. You can also create a new "Found" report if no matching lost report exists. Remember to surrender the item to the OSA office.'
    },
    {
        icon: Shield,
        question: 'What is a Sensitive Item?',
        answer: 'Items like IDs, documents, and cards are automatically flagged as sensitive. Their images are blurred, descriptions are hidden, and only initials + surname from the name on the item are shown publicly. This protects the owner\'s personal information.'
    },
    {
        icon: Building2,
        question: 'How do I get my item back?',
        answer: 'After you submit a claim, an admin from the Office of Student Affairs (OSA) will verify your proof. Once approved, you\'ll be notified (in-app and via SMS if you set up your phone number). Then, proceed to the OSA office at the campus where the item was found to pick it up.'
    }
];

const HelpGuide = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const toggleFaq = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <>
            {/* Floating Help Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent hover:bg-accent-dark text-black shadow-2xl flex items-center justify-center transition-colors"
                whileHover={prefersReduced ? {} : { scale: 1.1 }}
                whileTap={prefersReduced ? {} : { scale: 0.95 }}
                title="Help Guide"
            >
                <HelpCircle size={24} />
            </motion.button>

            {/* Side Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={prefersReduced ? { opacity: 0 } : { x: '100%' }}
                            animate={prefersReduced ? { opacity: 1 } : { x: 0 }}
                            exit={prefersReduced ? { opacity: 0 } : { x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                        <HelpCircle size={20} className="text-accent" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white uppercase tracking-wide">Claimio Guide</h2>
                                        <p className="text-xs text-text-muted">How to use Lost & Found</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-9 h-9 rounded-lg bg-card-alt flex items-center justify-center text-text-muted hover:text-white hover:bg-border transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* FAQ List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                                {faqs.map((faq, index) => {
                                    const Icon = faq.icon;
                                    const isExpanded = expandedIndex === index;

                                    return (
                                        <div
                                            key={index}
                                            className={`rounded-xl border transition-colors ${
                                                isExpanded
                                                    ? 'bg-card-alt border-accent/30'
                                                    : 'bg-card-alt/50 border-border hover:border-accent/20'
                                            }`}
                                        >
                                            <button
                                                onClick={() => toggleFaq(index)}
                                                className="w-full flex items-center gap-3 p-4 text-left"
                                            >
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                    isExpanded ? 'bg-accent/20' : 'bg-card'
                                                }`}>
                                                    <Icon size={16} className={isExpanded ? 'text-accent' : 'text-text-muted'} />
                                                </div>
                                                <span className={`text-sm font-semibold flex-1 transition-colors ${
                                                    isExpanded ? 'text-white' : 'text-gray-300'
                                                }`}>
                                                    {faq.question}
                                                </span>
                                                {isExpanded
                                                    ? <ChevronUp size={16} className="text-accent shrink-0" />
                                                    : <ChevronDown size={16} className="text-text-muted shrink-0" />
                                                }
                                            </button>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={prefersReduced ? {} : { height: 0, opacity: 0 }}
                                                        animate={prefersReduced ? {} : { height: 'auto', opacity: 1 }}
                                                        exit={prefersReduced ? {} : { height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <p className="px-4 pb-4 pl-16 text-sm text-text-muted leading-relaxed">
                                                            {faq.answer}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-border shrink-0">
                                <p className="text-xs text-text-muted text-center leading-relaxed">
                                    Need more help? Visit the <strong className="text-accent">OSA Office</strong> at your campus for in-person assistance.
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default HelpGuide;
