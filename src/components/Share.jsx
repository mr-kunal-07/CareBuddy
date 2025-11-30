import React from 'react'

const Share = () => {
    return (
        <div className="bg-gradient-to-r from-red-800 to-red-700 p-5 rounded-2xl shadow-xl mb-4 text-center font-extrabold text-white tracking-wide hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2 flex-col">
            <ShareIcon className="inline-block mr-2" size={24} />
            Share Screen
        </div>
    )
}

export default Share