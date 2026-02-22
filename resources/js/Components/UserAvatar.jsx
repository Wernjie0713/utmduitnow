import { useState } from 'react';

export default function UserAvatar({ user, className = "h-10 w-10", showFallback = true }) {
    const [imgError, setImgError] = useState(false);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };

    const getColorFromName = (name) => {
        if (!name) return { bg: 'bg-gray-500', text: 'text-white' };
        
        // Generate consistent color based on first character
        const colors = [
            { bg: 'bg-blue-500', text: 'text-white' },
            { bg: 'bg-green-500', text: 'text-white' },
            { bg: 'bg-purple-500', text: 'text-white' },
            { bg: 'bg-pink-500', text: 'text-white' },
            { bg: 'bg-indigo-500', text: 'text-white' },
            { bg: 'bg-red-500', text: 'text-white' },
            { bg: 'bg-yellow-500', text: 'text-gray-900' },
            { bg: 'bg-teal-500', text: 'text-white' },
        ];
        
        const charCode = name.charCodeAt(0);
        const colorIndex = charCode % colors.length;
        return colors[colorIndex];
    };

    if (!user) {
        return (
            <div className={`${className} bg-gray-500 text-white rounded-full flex items-center justify-center font-bold`} style={{ fontSize: '100%' }}>
                ?
            </div>
        );
    }

    if (user.avatar_url && !imgError) {
        return (
            <img
                src={user.avatar_url.startsWith('http') 
                    ? user.avatar_url 
                    : `/storage/${user.avatar_url}`}
                alt={user.name || '?'}
                className={`${className} rounded-full object-cover`}
                onError={(e) => {
                    if (showFallback) {
                        setImgError(true);
                    } else {
                        e.target.style.display = 'none';
                    }
                }}
            />
        );
    }

    const colors = getColorFromName(user.name);
    const initials = getInitials(user.name);

    return (
        <div
            className={`${className} ${colors.bg} ${colors.text} rounded-full flex items-center justify-center font-bold`}
            style={{ fontSize: '100%' }}
        >
            {initials}
        </div>
    );
}

