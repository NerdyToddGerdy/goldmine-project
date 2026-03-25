import { useGameStore } from '../store/gameStore';
import { gameStore } from '../store/gameStore';

const TYPE_STYLES = {
    success: 'bg-green-600 border-green-700',
    info: 'bg-blue-600 border-blue-700',
    warning: 'bg-orange-500 border-orange-600',
    error: 'bg-red-600 border-red-700',
};

const TYPE_ICONS = {
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
};

export function ToastContainer() {
    const toasts = useGameStore((s) => s.toasts);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-white shadow-lg pointer-events-auto animate-slide-in ${TYPE_STYLES[toast.type]}`}
                >
                    <span className="text-lg flex-shrink-0">{TYPE_ICONS[toast.type]}</span>
                    <span className="flex-1 text-sm font-medium">{toast.message}</span>
                    <button
                        onClick={() => gameStore.getState().dismissToast(toast.id)}
                        className="flex-shrink-0 text-white/70 hover:text-white transition-colors text-lg leading-none"
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
