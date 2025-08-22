import React from 'react'

interface WordBoxProps {
    letter?: string | null;
    isActive?: boolean;
    isCorrect?: boolean;
    isNumbered?: boolean;
    number?: number;
    onClick?: () => void;
    onInputChange?: (value: string) => void;
    value?: string;
    readOnly?: boolean;
}

export default function WordBox({
    letter,
    isActive,
    isCorrect,
    isNumbered,
    number,
    onClick,
    onInputChange,
    value,
    readOnly = false
}: WordBoxProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.toUpperCase();
        if (newValue.length <= 1 && onInputChange) {
            onInputChange(newValue);
        }
    };

    if (letter === null) {
        return (
            <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gray-800'></div>
        );
    }

    return (
        <div
            className={`
        relative box-border border-2 flex justify-center items-center text-base 
        w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16
        ${isActive ? 'border-blue-500 bg-blue-100' : 'border-gray-400 bg-white'}
        ${isCorrect ? 'bg-green-100 border-green-500' : ''}
        cursor-pointer
      `}
            onClick={onClick}
        >
            {isNumbered && number && (
                <span className="absolute top-0 left-0 text-xs font-bold text-gray-600 ml-1">
                    {number}
                </span>
            )}
            {readOnly ? (
                <span className="font-bold text-gray-800">{letter}</span>
            ) : (
                <input
                    type="text"
                    value={value || ''}
                    onChange={handleChange}
                    className="w-full h-full text-center bg-transparent border-none outline-none font-bold text-gray-800"
                    maxLength={1}
                />
            )}
        </div>
    );
}
