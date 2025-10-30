import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Car, AlertTriangle, Activity, Upload, Play, Pause,
    Signal, Timer, BarChart2, ExternalLink, ImageIcon, Hash, MapPin, Loader
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast, { Toaster } from 'react-hot-toast'; // Import Toaster to render toasts

// --- INLINED MOCKS (Replacing external imports) ---

// Define basic structure for intersection status (copied from your code)
interface BasicIntersectionStatus {
    intersection_id?: string;
    total_vehicles?: number;
    average_wait_time?: number;
    traffic_flow_rate?: number;
    system_status?: string;
    emergency_mode_active?: boolean;
    traffic_signals?: { [key: string]: any }; 
    vehicle_counts?: { [key: string]: number };
    last_updated?: string; // ISO string timestamp
}

/**
 * Mock TrafficAPI Service
 * Simulates API calls
 */
const TrafficAPI = {
    async getIntersectionStatus(): Promise<BasicIntersectionStatus> {
        console.log("[Mock API] getIntersectionStatus");
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            intersection_id: "mock-main-01",
            total_vehicles: 42,
            average_wait_time: 15.2,
            traffic_flow_rate: 800,
            system_status: "offline", // Initial state
            emergency_mode_active: false,
            traffic_signals: {
                "north_south": "red",
                "east_west": "green"
            },
            vehicle_counts: {
                "north": 10,
                "south": 8,
                "east": 12,
                "west": 12
            },
            last_updated: new Date().toISOString()
        };
    },
    async detectVehicles(formData: FormData): Promise<any> {
        console.log("[Mock API] detectVehicles");
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Simulate a result with a blob URL
        const file = formData.get('image') as File;
        const imageUrl = URL.createObjectURL(file);
        return {
            total_vehicles: Math.floor(Math.random() * 20) + 5,
            vehicles: [{ type: 'car', count: 5 }, { type: 'truck', count: 1 }],
            image_url: imageUrl, // Send back a URL to the uploaded image
            timestamp: new Date().toISOString()
        };
    },
    async startSimulation(): Promise<any> {
        console.log("[Mock API] startSimulation");
        await new Promise(resolve => setTimeout(resolve, 500));
        return { status: "success", message: "Simulation start requested." };
    },
    async stopSimulation(): Promise<any> {
        console.log("[Mock API] stopSimulation");
        await new Promise(resolve => setTimeout(resolve, 500));
        return { status: "success", message: "Simulation stop requested." };
    },
    async getAnalyticsSummary(period: string): Promise<any> {
        console.log(`[Mock API] getAnalyticsSummary for ${period}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            period: period,
            total_vehicles_processed: 12045,
            peak_hour: "08:00 AM",
            average_wait_time: 22.5,
            flow_data: [
                { time: '00:00', vehicles: 150 },
                { time: '04:00', vehicles: 300 },
                { time: '08:00', vehicles: 1200 },
                { time: '12:00', vehicles: 900 },
                { time: '16:00', vehicles: 1100 },
                { time: '20:00', vehicles: 700 },
            ]
        };
    }
};

/**
 * Mock WebSocketService
 * Simulates WebSocket connection and messages
 */
class WebSocketService {
    private onOpenCallback: () => void = () => {};
    private onMessageCallback: (data: any) => void = () => {};
    private onCloseCallback: (event: CloseEvent) => void = () => {};
    private onErrorCallback: (event: Event) => void = () => {};
    private connectTimeout: NodeJS.Timeout | null = null;

    constructor(url: string) {
        console.log(`[Mock WS] Initializing connection to: ${url}`);
        this.connectTimeout = setTimeout(() => {
            console.log("[Mock WS] Connection 'Opened'");
            this.onOpenCallback();
        }, 1000); // Simulate 1s connection time
    }

    onOpen(callback: () => void) { this.onOpenCallback = callback; }
    onMessage(callback: (data: any) => void) { this.onMessageCallback = callback; }
    onClose(callback: (event: CloseEvent) => void) { this.onCloseCallback = callback; }
    onError(callback: (event: Event) => void) { this.onErrorCallback = callback; }

    disconnect() {
        if (this.connectTimeout) clearTimeout(this.connectTimeout);
        console.log("[Mock WS] Disconnect called.");
        // Simulate a clean close event
        const mockCloseEvent = new CloseEvent('close', {
            code: 1000,
            reason: 'User disconnected',
            wasClean: true
        });
        this.onCloseCallback(mockCloseEvent);
    }

    // Helper method for other parts to simulate receiving a message
    public static simulateMessage(instance: WebSocketService | null, data: any) {
        if (instance) {
            console.log("[Mock WS] Simulating message:", data);
            instance.onMessageCallback(data);
        }
    }
}

// --- INLINED MOCK COMPONENTS (Replacing external imports) ---

/**
 * Mock TrafficIntersection Component
 */
const TrafficIntersection: React.FC<{ status: BasicIntersectionStatus | null; isSimulationRunning: boolean }> = ({ status, isSimulationRunning }) => {
    return (
        <div className="p-4 border-2 border-dashed rounded-lg bg-gray-50 text-center min-h-[300px] flex flex-col justify-center items-center">
            <Signal className={`w-12 h-12 mb-4 ${isSimulationRunning ? 'text-green-500' : 'text-gray-400'}`} />
            <h3 className="font-semibold text-lg text-gray-800">Mock Intersection View</h3>
            <p className="text-sm text-gray-500">
                {isSimulationRunning ? `Live - ${status?.total_vehicles || 0} vehicles` : (status ? "Offline" : "Waiting for data...")}
            </p>
            {status?.emergency_mode_active && (
                <div className="mt-4 p-2 bg-red-100 text-red-700 rounded-md text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 inline-block mr-1" />
                    Emergency Mode Active
                </div>
            )}
        </div>
    );
};

/**
 * Mock VehicleDetectionResults Component
 */
const VehicleDetectionResults: React.FC<{ results: any | null }> = ({ results }) => {
    return (
        <AnimatePresence>
            {results && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-6 bg-white rounded-xl shadow-lg border border-gray-200"
                >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ImageIcon className="w-5 h-5 mr-2 text-blue-600"/> Detection Results
                    </h3>
                    <div className="space-y-4">
                        {results.image_url && (
                            <img 
                                src={results.image_url} 
                                alt="Detection analysis" 
                                className="w-full h-auto rounded-lg shadow-md border border-gray-200" 
                                // Clean up the object URL when the component unmounts or image changes
                                onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                            />
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <MetricItem label="Total Vehicles" value={results.total_vehicles} />
                            <MetricItem label="Timestamp" value={new Date(results.timestamp).toLocaleTimeString()} />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


/**
 * Mock AnalyticsDashboard Component
 */
const AnalyticsDashboard: React.FC<{ data: any | null }> = ({ data }) => {
    return (
        <div className="p-4 border border-dashed rounded-lg bg-gray-800 text-white text-center min-h-[300px] flex flex-col justify-center items-center">
            <BarChart2 className="w-12 h-12 mb-4 text-blue-400" />
            <h3 className="font-semibold text-lg">Mock Analytics Dashboard</h3>
            {data ? (
                <p className="text-sm text-gray-300">
                    Analytics loaded for '{data.period}'. Total Vehicles: {data.total_vehicles_processed}
                </p>
            ) : (
                <div className="flex items-center text-sm text-gray-400">
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Loading analytics data...
                </div>
            )}
        </div>
    );
};

// --- Helper for Metrics Display (Copied from your code) ---
interface MetricItemProps {
    label: string;
    value?: string | number | null;
    unit?: string;
    children?: React.ReactNode; // Allow passing custom elements like status 
}

// Added component definition
const MetricItem: React.FC<MetricItemProps> = ({ label, value, unit, children }) => (
    <div className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
        <dt className="text-gray-500">{label}</dt>
        <dd className="font-medium text-gray-900 text-right">
            {children ? children : (
                (value !== null && value !== undefined) 
                ? `${value} ${unit || ''}` 
                : <span className="text-gray-400">N/A</span>
            )}
        </dd>
    </div>
);

// --- END OF MOCKS AND HELPERS ---


// Define possible tabs (Copied from your code)
type ActiveTabType = 'live' | 'detection' | 'analytics';

// Main Dashboard Component (Copied from your code, with modifications)
const TrafficDashboard: React.FC = () => {
    // State hooks
    const [intersectionStatus, setIntersectionStatus] = useState<BasicIntersectionStatus | null>(null);
    const [detectionResults, setDetectionResults] = useState<any>(null); // Use specific type if defined
    const [analyticsData, setAnalyticsData] = useState<any>(null); // Use specific type if defined
    const [isSimulationRunning, setIsSimulationRunning] = useState<boolean | null>(null); // Use null for initial unknown state
    const [isLoading, setIsLoading] = useState<boolean>(false); // General loading indicator for API calls
    const [isConnecting, setIsConnecting] = useState<boolean>(true); // WebSocket connection status
    const [activeTab, setActiveTab] = useState<ActiveTabType>('live');
    const wsServiceRef = useRef<WebSocketService | null>(null); // Ref to hold WebSocket service instance

    // --- WebSocket Connection ---
    useEffect(() => {
        // Initialize WebSocket Service only once using the ref
        if (!wsServiceRef.current) {
            // Construct WebSocket URL dynamically based on browser location
            // Assumes backend runs on the same host but port 8000
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = window.location.hostname; // Use browser hostname
            const wsUrl = `${wsProtocol}//${wsHost}:8000/ws/traffic-updates`; // Use standard path
            console.log(`[TrafficDashboard] Attempting WebSocket connection to: ${wsUrl}`);

            const service = new WebSocketService(wsUrl); // Use the constructed URL

            // --- WebSocket Event Handlers ---
            service.onOpen(() => {
                console.log("[TrafficDashboard] WebSocket Connected.");
                toast.success("Real-time connection established!");
                setIsConnecting(false);
                // Fetch initial status after successful connection
                fetchInitialStatus();
            });

            service.onMessage((data) => {
                // Basic validation of incoming message structure
                if (!data || !data.type) {
                    console.warn("[TrafficDashboard] Received invalid WebSocket message structure:", data);
                    return;
                }

                try {
                    // Process messages based on type
                    if (data.type === 'intersection_status') {
                        setIntersectionStatus(data.data);
                        // Infer simulation running state from system status if available
                        const isRunning = data.data?.system_status?.toLowerCase().includes('operational');
                        // Only update if it's explicitly boolean (avoid setting to undefined)
                        if (typeof isRunning === 'boolean') {
                            setIsSimulationRunning(isRunning);
                        }
                    } else if (data.type === 'vehicle_detection') {
                        // Update detection results state - primarily for manual uploads but can receive from WS too
                        setDetectionResults(data.data);
                        // Reduce toast frequency or make conditional if needed
                        // console.log("Received vehicle_detection via WS:", data.data);
                    } else if (data.type === 'emergency_alert') {
                        // Update local status immediately for UI responsiveness
                        setIntersectionStatus((prev) => ({
                            ...(prev ?? {}), // Handle case where prev might be null
                            emergency_mode_active: data.data?.is_active ?? false
                        }));
                        // Show toast notification for emergency alerts
                        if (data.data?.is_active) {
                            toast.error(`🚨 Emergency: ${data.data.emergency_type} in ${data.data.detected_lane} lane!`, { duration: 7000 });
                        } else {
                            // Only show resolved if it was previously active (might need additional state tracking)
                            
                            // *** FIX: Changed toast.info to toast() with an icon ***
                            toast("Emergency situation resolved.", { icon: 'ℹ️', duration: 3000 });
                        }
                    } else {
                        console.warn(`[TrafficDashboard] Received unknown WebSocket message type: ${data.type}`);
                    }
                } catch (parseError) {
                    console.error("[TrafficDashboard] Error processing WebSocket message:", parseError, "Original data:", data);
                }
            });

            // *** FIX: Added explicit 'CloseEvent' type to 'event' ***
            service.onClose((event: CloseEvent) => {
                console.log(`[TrafficDashboard] WebSocket closed: Code ${event.code}, Reason: ${event.reason}`);
                // Avoid showing error toast immediately if it was a clean close (code 1000/1001)
                if (event.code !== 1000 && event.code !== 1001) {
                    toast.error("Real-time connection lost. Attempting to reconnect...");
                } else {
                    console.log("[TrafficDashboard] WebSocket closed cleanly.");
                }
                setIsConnecting(true); // Indicate reconnection attempt visually
                setIsSimulationRunning(false); // Assume stopped on disconnect
                setIntersectionStatus(null); // Clear status on disconnect
                // Reconnect logic is handled within the WebSocketService class
            });

            // *** FIX: Added explicit 'Event' type to 'event' ***
            service.onError((event: Event) => {
                console.error("[TrafficDashboard] WebSocket error:", event);
                // Error toast might be redundant if onClose already showed one
                // Only show a generic error if still in initial connecting phase
                if (isConnecting) {
                    toast.error("WebSocket connection error. Check if backend is running.");
                }
                setIsConnecting(true);
                setIsSimulationRunning(false);
                setIntersectionStatus(null);
            });

            wsServiceRef.current = service; // Store the service instance in the ref
        }

        // Cleanup function: Disconnect WebSocket when the component unmounts
        return () => {
            if (wsServiceRef.current) {
                wsServiceRef.current.disconnect();
                wsServiceRef.current = null; // Clear the ref
                console.log("[TrafficDashboard] WebSocket disconnected on component unmount.");
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this effect runs only once on mount

    // --- Function to Fetch Initial Intersection Status ---
    const fetchInitialStatus = useCallback(async () => {
        // Prevent fetching if already loading or connected and received data
        if (isLoading || (intersectionStatus && !isConnecting)) return;

        console.log("Fetching initial intersection status via API...");
        setIsLoading(true); // Indicate loading for initial fetch
        try {
            const status = await TrafficAPI.getIntersectionStatus();
            setIntersectionStatus(status);
            // Infer running state from fetched status
            const isRunning = status?.system_status?.toLowerCase().includes('operational');
            if (typeof isRunning === 'boolean') {
                setIsSimulationRunning(isRunning);
            }
            console.log("Initial status fetched:", status);
        } catch (error) {
            console.error("Failed to fetch initial status:", error);
            toast.error("Could not fetch initial traffic status from API.");
            setIsSimulationRunning(false); // Assume offline if initial fetch fails
            setIntersectionStatus(null); // Clear status
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, intersectionStatus, isConnecting]); // Dependencies for useCallback

    // --- File Upload Logic ---
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/png': ['.png']
        },
        multiple: false, // Only one file at a time
        disabled: isLoading, // Disable while another operation is in progress
        onDrop: async (acceptedFiles) => {
            if (acceptedFiles.length === 0) {
                toast.error('No valid image file selected.');
                return;
            }
            const file = acceptedFiles[0];
            setIsLoading(true); // Set loading state for upload/analysis
            const uploadToast = toast.loading('Uploading & analyzing image...');

            try {
                const formData = new FormData();
                formData.append('image', file); // Use 'image' as key expected by backend

                // Call the API service function
                const result = await TrafficAPI.detectVehicles(formData);

                setDetectionResults(result); // Update state with the detection results
                toast.success(`Analysis complete! ${result.total_vehicles ?? 0} vehicles found.`, { id: uploadToast });
                setActiveTab('detection'); // Switch to the detection tab to show the results
            } catch (error: any) {
                toast.error(`Image analysis failed: ${error.message || 'Check console for details.'}`, { id: uploadToast });
                console.error('Detection API error:', error);
            } finally {
                setIsLoading(false); // Clear loading state
            }
        },
    });

    // --- API Interaction Helper ---
    // Generic function to handle API calls with loading state and toasts
    const callApi = async (
        apiCall: () => Promise<any>, // The async function from TrafficAPI service
        loadingMsg: string,
        successMsg: string,
        errorMsg: string
    ): Promise<any> => {
        setIsLoading(true);
        const toastId = toast.loading(loadingMsg);
        try {
            const result = await apiCall();
            toast.success(successMsg, { id: toastId });
            return result; // Return the result from the API call
        } catch (error: any) {
            toast.error(`${errorMsg}: ${error.message || 'Unknown error'}`, { id: toastId });
            console.error(`${errorMsg} error:`, error);
            throw error; // Re-throw so the caller can handle specific failures if needed
        } finally {
            setIsLoading(false); // Clear loading state regardless of outcome
        }
    };

    // --- Simulation Control Handlers ---
    const handleStartSimulation = async () => {
        try {
            await callApi(
                TrafficAPI.startSimulation,
                'Requesting simulation start...',
                'Simulation start requested!',
                'Failed to start simulation'
            );
            // Optimistic update - rely on WebSocket 'intersection_status' for actual confirmation
            // setIsSimulationRunning(true);

            // *** ADDED: Simulate WebSocket response for mock environment ***
            WebSocketService.simulateMessage(wsServiceRef.current, {
                type: 'intersection_status',
                data: {
                    ...intersectionStatus,
                    system_status: 'operational',
                    total_vehicles: (intersectionStatus?.total_vehicles || 40) + 5,
                    last_updated: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error("Handling start simulation failure in component");
            // State will likely revert via WebSocket if start fails
        }
    };

    const handleStopSimulation = async () => {
        try {
             await callApi(
                TrafficAPI.stopSimulation,
                'Requesting simulation stop...',
                'Simulation stop requested!',
                'Failed to stop simulation'
            );
             // Optimistic update
             // setIsSimulationRunning(false);

             // *** ADDED: Simulate WebSocket response for mock environment ***
             WebSocketService.simulateMessage(wsServiceRef.current, {
                type: 'intersection_status',
                data: {
                    ...intersectionStatus,
                    system_status: 'offline',
                    last_updated: new Date().toISOString()
                }
            });

        } catch (error) {
             console.error("Handling stop simulation failure in component");
        }
    };

    // --- Analytics Loading Logic ---
    const loadAnalytics = useCallback(async () => {
        // Prevent reloading if already loading or if data already exists
        if (isLoading || analyticsData) return;

        setIsLoading(true);
        console.log("Loading analytics data...");
        try {
            // Fetch the required analytics data (e.g., daily summary)
            // Adjust the API call based on what AnalyticsDashboard expects
            const summaryData = await TrafficAPI.getAnalyticsSummary("daily");

            // You might need to fetch other data parts if AnalyticsDashboard expects more
            // const [summaryData, heatmapData] = await Promise.all([ ... ]);

            setAnalyticsData(summaryData); // Update state with fetched data

        } catch (error: any) {
            toast.error(`Failed to load analytics: ${error.message || 'Unknown error'}`);
            console.error('Analytics fetch error:', error);
            setAnalyticsData(null); // Clear data on error to show error state in dashboard
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, analyticsData]); // Dependencies for useCallback

    // Effect to trigger analytics loading when the tab is active
    useEffect(() => {
        if (activeTab === 'analytics') {
            loadAnalytics();
        }
        // Optionally clear manual detection results when leaving the detection tab
        if (activeTab !== 'detection' && detectionResults) {
           // Set results to null after a short delay to allow exit animation
           const timer = setTimeout(() => setDetectionResults(null), 300);
           return () => clearTimeout(timer);
        }
    }, [activeTab, loadAnalytics, detectionResults]);


    // --- Render Logic ---
    return (
        // Root container with background and font settings
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900 font-sans">
            
            {/* ADDED: Toaster component to render notifications */}
            <Toaster position="top-right" reverseOrder={false} />

            {/* Header Section */}
            <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-20"> {/* Increased z-index */}
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        {/* Logo and Title */}
                        <div className="flex items-center space-x-3 flex-shrink-0">
                            <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full shadow-inner">
                                <Car className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                                    AI Traffic Management
                                </h1>
                                <p className="text-xs text-gray-500 hidden md:block">
                                    Real-time adaptive control system
                                </p>
                            </div>
                        </div>

                        {/* Controls and Status Indicators */}
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            {/* Simulation Start/Stop Button */}
                            <button
                                onClick={isSimulationRunning ? handleStopSimulation : handleStartSimulation}
                                disabled={isLoading || isConnecting || isSimulationRunning === null}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ease-in-out shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    isSimulationRunning
                                        ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
                                        : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={isSimulationRunning ? 'Stop real-time simulation processing' : 'Start real-time simulation processing'}
                            >
                                {/* Show Loader when specifically interacting with this button */}
                                {isLoading && (isSimulationRunning !== null) ? (
                                     <Loader className="animate-spin h-4 w-4" />
                                ) : isSimulationRunning ? (
                                    <Pause className="h-4 w-4" />
                                ) : (
                                    <Play className="h-4 w-4" />
                                )}
                                <span className="hidden sm:inline">{isSimulationRunning ? 'Stop Sim' : 'Start Sim'}</span>
                                <span className="sm:hidden">{isSimulationRunning ? 'Stop' : 'Start'}</span>
                            </button>

                            {/* Connection/System Status Indicator */}
                            <div className="flex items-center space-x-1.5" title={isConnecting ? 'WebSocket Connecting...' : (isSimulationRunning ? 'System Live & Connected' : 'System Offline / Disconnected')}>
                                <div className={`h-2.5 w-2.5 rounded-full transition-colors ${
                                    isConnecting ? 'bg-yellow-400 animate-pulse' : (isSimulationRunning ? 'bg-green-500' : 'bg-gray-400')
                                }`} />
                                <span className="text-xs font-medium text-gray-600 hidden md:inline">
                                    {isConnecting ? 'Connecting' : (isSimulationRunning ? 'Live' : 'Offline')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="bg-white border-b border-gray-200 sticky top-[73px] z-10"> {/* Adjust top based on actual header height */}
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-4 sm:space-x-6 overflow-x-auto -mb-px"> {/* Use -mb-px for border alignment */}
                        {[
                            { id: 'live', name: 'Live Traffic', icon: Activity },
                            { id: 'detection', name: 'Detection', icon: Upload },
                            { id: 'analytics', name: 'Analytics', icon: BarChart2 },
                        ].map(({ id, name, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id as ActiveTabType)}
                                className={`flex items-center whitespace-nowrap space-x-1.5 py-3 px-2 border-b-2 text-sm font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-[-1px] rounded-t-sm ${
                                    activeTab === id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                                aria-current={activeTab === id ? 'page' : undefined}
                            >
                                <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                                <span>{name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
                {/* Use AnimatePresence for smoother tab transitions */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab} // Key ensures animation runs on tab change
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="min-h-[400px]" // Set a min height for content area
                    >
                        {/* Live Traffic Tab */}
                        {activeTab === 'live' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Intersection Vis */}
                                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 md:p-6 border border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                        <Signal className="w-5 h-5 mr-2 text-blue-600"/> Live Intersection View
                                    </h2>
                                    <TrafficIntersection
                                        status={intersectionStatus}
                                        // Pass simulation state, default to false if null/undefined
                                        isSimulationRunning={isSimulationRunning ?? false}
                                    />
                                </div>
                                {/* Metrics & Status */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                             <Activity className="w-5 h-5 mr-2 text-green-600"/> Current Metrics
                                        </h3>
                                        {/* Show loading state for metrics if status is null */}
                                        {!intersectionStatus && !isConnecting ? (
                                             <div className="text-sm text-gray-500 text-center py-4">Waiting for data...</div>
                                        ) : (
                                            <dl className="space-y-2 text-sm">
                                                 <MetricItem label="Total Vehicles" value={intersectionStatus?.total_vehicles} />
                                                 <MetricItem label="Avg. Wait Time" value={intersectionStatus?.average_wait_time?.toFixed(1)} unit="s" />
                                                 <MetricItem label="Flow Rate" value={intersectionStatus?.traffic_flow_rate?.toFixed(0)} unit="veh/hr" />
                                                 <MetricItem label="System Status">
                                                    <span className={`font-medium capitalize px-2 py-0.5 rounded-full text-xs ${
                                                        intersectionStatus?.system_status === 'operational' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {intersectionStatus?.system_status ?? 'Unknown'}
                                                    </span>
                                                 </MetricItem>
                                            </dl>
                                        )}
                                    </div>
                                    {/* Emergency Alert */}
                                    {intersectionStatus?.emergency_mode_active && (
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                            className="bg-red-50 border border-red-300 rounded-xl p-4 shadow-md"
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className="p-1.5 bg-red-100 rounded-full flex-shrink-0 mt-0.5">
                                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-red-800"> Emergency Mode Active </h4>
                                                    <p className="text-xs text-red-700"> Priority signals engaged. </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                    {/* Connection Status */}
                                    {isConnecting && (
                                         <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 shadow-md text-center">
                                             <Loader className="w-5 h-5 text-yellow-600 animate-spin mx-auto mb-2"/>
                                             <p className="text-sm font-medium text-yellow-800">Connecting to real-time updates...</p>
                                         </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Vehicle Detection Tab */}
                        {activeTab === 'detection' && (
                            <div className="space-y-6 max-w-3xl mx-auto"> {/* Center content */}
                                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                        <Upload className="w-5 h-5 mr-2 text-blue-600"/> Manual Detection Analysis
                                    </h2>
                                    <div
                                        {...getRootProps()}
                                        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ease-in-out ${
                                            isDragActive
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50'
                                        } ${isLoading ? 'opacity-60 cursor-wait' : ''}`}
                                        aria-disabled={isLoading}
                                    >
                                        <input {...getInputProps()} disabled={isLoading} />
                                        <div className="flex flex-col items-center justify-center pointer-events-none"> {/* Prevent text selection */}
                                            <Upload className="h-10 w-10 text-gray-400 mb-3" />
                                            <p className="text-base font-medium text-gray-700 mb-1">
                                                {isDragActive ? 'Drop the image here...' : 'Upload an intersection image'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Drag & drop or click to select (JPEG, PNG)
                                            </p>
                                        </div>
                                        {/* Loading overlay specific to this action */}
                                        {isLoading && activeTab === 'detection' && (
                                             <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                                                 <Loader className="animate-spin h-8 w-8 text-blue-500"/>
                                             </div>
                                        )}
                                    </div>
                                </div>
                                {/* Results Component */}
                                <VehicleDetectionResults results={detectionResults} />
                            </div>
                        )}

                        {/* Analytics Tab */}
                        {activeTab === 'analytics' && (
                             <div className="bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-700">
                                 <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                                    <BarChart2 className="w-5 h-5 mr-2 text-blue-400"/> Traffic Analytics Dashboard
                                 </h2>
                                {/* Pass loading state to AnalyticsDashboard if it needs it */}
                                <AnalyticsDashboard data={analyticsData} />
                             </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="text-center py-4 mt-8 text-xs text-gray-500 border-t border-gray-200 bg-white">
                 AI Traffic Management System © {new Date().getFullYear()} | Status: {isConnecting ? 'Connecting' : (isSimulationRunning ? 'Live' : 'Offline')}
            </footer>
        </div>
    );
};

// *** FIX: Changed to a default export to match previewer expectations ***
export default TrafficDashboard;
