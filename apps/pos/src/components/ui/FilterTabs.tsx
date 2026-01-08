import { motion } from 'framer-motion';

export interface FilterOption<T extends string> {
    label: string;
    value: T;
}

interface FilterTabsProps<T extends string> {
    options: FilterOption<T>[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
}

export const FilterTabs = <T extends string>({ options, value, onChange, className = '' }: FilterTabsProps<T>) => {
    return (
        <div className={`flex bg-gray-50 p-1 rounded-xl border border-gray-200 ${className}`}>
            {options.map((option) => {
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`
                            relative px-4 py-1.5 text-xs font-bold rounded-lg transition-all z-10
                            ${isActive ? 'text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        {isActive && (
                            <motion.div
                                layoutId={`active-filter-${options.map(o => o.value).join('')}`}
                                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                style={{ zIndex: -1 }}
                            />
                        )}
                        <span className="relative z-10">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
