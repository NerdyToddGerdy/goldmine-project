import './App.css'
import {Controls} from "./components/Controls.tsx";
import {HUD} from "./components/HUD.tsx";

function App() {

    return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Gold Mine Tycoon</h1>
        <Controls />
        <HUD />
        {/* Game UI continues here... */}
        </div>
    </div>
    );
}

export default App
