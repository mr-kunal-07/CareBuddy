
import { ArrowBigDown, ChevronDown, User } from 'lucide-react'
import Link from 'next/link'

const Header = ({ promoterInfo }) => {



    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate ">
                            Hey {promoterInfo.name} 👋
                        </h1>
                        <p className="text-sm text-slate-500 truncate">
                            {promoterInfo.docId}
                        </p>
                    </div>

                    <div className="flex items-center gap-1">
                        <Link
                            href="/profile"
                            className=" hover:bg-slate-50 rounded-lg transition-colors duration-200 "
                            aria-label="Profile menu"
                        >
                            {promoterInfo.imageUrl ? (
                                <img
                                    src={promoterInfo.imageUrl}
                                    alt="Profile"
                                    className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-slate-300 transition-all"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                                    <User size={20} className="text-slate-600" />
                                </div>
                            )}
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header