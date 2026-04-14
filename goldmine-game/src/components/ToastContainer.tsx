import { useGameStore } from '../store/gameStore';
import { gameStore } from '../store/gameStore';

const TYPE_STYLES = {
    success: 'frontier-toast-success',
    info:    'frontier-toast-info',
    warning: 'frontier-toast-warning',
    error:   'frontier-toast-error',
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
                    className={`flex items-start gap-3 px-4 py-3 rounded-sm border text-frontier-bone shadow-lg pointer-events-auto animate-slide-in font-body ${TYPE_STYLES[toast.type]}`}
                >
                    <span className="text-lg flex-shrink-0">{TYPE_ICONS[toast.type]}</span>
                    <span className="flex-1 text-sm font-medium">{toast.message}</span>
                    <button
                        onClick={() => gameStore.getState().dismissToast(toast.id)}
                        className="flex-shrink-0 text-frontier-bone/70 hover:text-frontier-bone transition-colors text-lg leading-none"
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
