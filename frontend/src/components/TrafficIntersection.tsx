import React from 'react';
import { Car, MapPin, Timer, Pause, AlertTriangle } from 'lucide-react'; // Added AlertTriangle

// Define expected types for the status prop
interface TrafficSignal {
    signal_id: string;
    direction: string; // Consider using LaneDirection Enum if shared
    current_state: 'red' | 'yellow' | 'green' | 'flashing_red' | 'flashing_yellow' | string; // Allow string for flexibility
    remaining_time: number;
    // Add other relevant fields if available (e.g., cycle_duration)
}

interface IntersectionStatus {
    intersection_id?: string;
    traffic_signals?: {
        [key: string]: TrafficSignal; // Use string key for directions like 'north', 'south'
    };
    vehicle_counts?: {
        [key: string]: number;
    };
    // Add other relevant fields (total_vehicles, emergency_mode_active, etc.)
    emergency_mode_active?: boolean;
}

interface TrafficIntersectionProps {
    status: IntersectionStatus | null; // Allow null for initial loading state
    isSimulationRunning: boolean;
}

export const TrafficIntersection: React.FC<TrafficIntersectionProps> = ({ status, isSimulationRunning }) => {

    const getSignalColor = (state: string | undefined): string => {
        if (!state) return 'bg-gray-600'; // Default off/unknown color
        // Add specific glow for active states
        if (state.includes('green')) return 'bg-green-500 shadow-[0_0_8px_1.5px_rgba(34,197,94,0.7)]'; // Green with glow
        if (state.includes('yellow')) return 'bg-yellow-400 shadow-[0_0_8px_1.5px_rgba(250,204,21,0.7)]'; // Yellow with glow
        if (state.includes('red')) return 'bg-red-500 shadow-[0_0_8px_1.5px_rgba(239,68,68,0.7)]'; // Red with glow
        return 'bg-gray-600'; // Default off
    };

    // Mapping directions to grid positions and styles
    const directionConfig: { [key: string]: { pos: string; flex: string; align: string; text: string } } = {
        north: { pos: 'col-start-2 row-start-1 justify-self-center self-end mb-[-4px]', flex: 'flex-col', align: 'items-center', text: 'text-center' },
        south: { pos: 'col-start-2 row-start-3 justify-self-center self-start mt-[-4px]', flex: 'flex-col-reverse', align: 'items-center', text: 'text-center' },
        east: { pos: 'col-start-3 row-start-2 self-center justify-self-start ml-[-4px]', flex: 'flex-row-reverse', align: 'items-center', text: 'text-left' },
        west: { pos: 'col-start-1 row-start-2 self-center justify-self-end mr-[-4px]', flex: 'flex-row', align: 'items-center', text: 'text-right' },
    };

    return (
        // Increased size for better visibility
        <div className="relative aspect-square w-full max-w-lg mx-auto bg-gray-300 rounded-lg p-1.5 grid grid-cols-3 grid-rows-3 gap-1.5 border-4 border-gray-400 shadow-inner">
            {/* Roads */}
            <div className="col-start-2 row-start-1 h-full bg-gray-600 shadow-inner"></div> {/* N */}
            <div className="col-start-2 row-start-3 h-full bg-gray-600 shadow-inner"></div> {/* S */}
            <div className="col-start-1 row-start-2 w-full bg-gray-600 shadow-inner"></div> {/* W */}
            <div className="col-start-3 row-start-2 w-full bg-gray-600 shadow-inner"></div> {/* E */}

            {/* Center Area */}
            <div className="col-start-2 row-start-2 bg-gray-400 rounded flex items-center justify-center shadow-md border border-gray-500">
                 <MapPin className="w-7 h-7 text-gray-700 opacity-80" />
            </div>

            {/* Signals & Counts */}
            {Object.keys(directionConfig).map(dir => {
                // Safely access nested properties with optional chaining and nullish coalescing
                const signal = status?.traffic_signals?.[dir];
                const count = status?.vehicle_counts?.[dir] ?? 0; // Default to 0 if count is missing
                const config = directionConfig[dir];
                const currentState = signal?.current_state ?? 'unknown'; // Default state

                // Determine border color based on state for emphasis
                const stateBorderColor = currentState === 'green' ? 'border-green-400' :
                                         currentState === 'yellow' ? 'border-yellow-300' :
                                         currentState === 'red' ? 'border-red-400' : 'border-gray-700';

                return (
                    <div key={dir} className={`absolute ${config.pos} z-10`}>
                        <div className={`inline-flex ${config.flex} ${config.align} p-1.5 bg-gray-900 bg-opacity-80 rounded-md shadow-lg border ${stateBorderColor} transition-colors duration-300`}>
                            {/* Signal Light */}
                            <div
                                className={`flex-shrink-0 w-4 h-4 md:w-5 md:h-5 rounded-full border border-gray-500 transition-all duration-300 ${getSignalColor(currentState)}`}
                                title={currentState.replace('_', ' ').toUpperCase()} // Tooltip for state
                            ></div>
                            {/* Info Box */}
                            <div className={`flex items-center text-[11px] md:text-xs text-white ${config.text} ${dir === 'north' || dir === 'south' ? 'flex-col mt-1.5 space-y-1' : 'flex-row ml-1.5 space-x-1.5'}`}>
                                {/* Vehicle Count */}
                                <div className="flex items-center" title="Detected Vehicles">
                                    <Car className="w-3 h-3 md:w-3.5 md:h-3.5 mr-0.5 opacity-80 flex-shrink-0"/>
                                    <span className="font-medium">{count}</span>
                                </div>
                                {/* Timer (only if not red and time available) */}
                                {currentState !== 'red' && currentState !== 'unknown' && signal?.remaining_time !== undefined && signal.remaining_time >= 0 && (
                                     <div className="flex items-center text-gray-300" title="Remaining Time">
                                        <Timer className="w-3 h-3 md:w-3.5 md:h-3.5 mr-0.5 opacity-80 flex-shrink-0"/>
                                        <span>{signal.remaining_time}s</span>
                                     </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Simulation Paused Overlay */}
            {!isSimulationRunning && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg z-20 backdrop-blur-sm">
                    <div className="flex flex-col items-center p-4 rounded-lg">
                        <Pause className="w-8 h-8 text-yellow-400 mb-2"/>
                        <span className="text-white text-lg font-semibold ">Simulation Paused</span>
                    </div>
                </div>
            )}

             {/* Emergency Mode Overlay */}
             {status?.emergency_mode_active && (
                <div className="absolute inset-0 bg-red-900 bg-opacity-30 flex items-center justify-center rounded-lg z-20 border-2 border-red-500 animate-pulse">
                    <div className="flex flex-col items-center p-4 rounded-lg text-center">
                        <AlertTriangle className="w-8 h-8 text-red-400 mb-2"/>
                        <span className="text-white text-lg font-semibold ">Emergency Mode</span>
                        <span className="text-red-200 text-xs mt-1">Prioritizing emergency vehicle</span>
                    </div>
                </div>
             )}
        </div>
    );
};

