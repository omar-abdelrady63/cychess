import { Link } from 'react-router-dom';

const LoginRequiredModal = ({ isOpen, onClose, message = "Sign in to access this feature", actionLabel = "Sign In" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <i className="fa-solid fa-xmark text-xl"></i>
                </button>

                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <i className="fa-solid fa-lock text-3xl text-accent"></i>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">Login Required</h3>
                    <p className="text-gray-400 mb-8">{message}</p>

                    <div className="flex flex-col gap-3">
                        <Link
                            to="/login"
                            className="btn-primary w-full justify-center py-3 text-lg"
                        >
                            {actionLabel}
                        </Link>
                        <Link
                            to="/register"
                            className="btn-secondary w-full justify-center py-3"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginRequiredModal;
