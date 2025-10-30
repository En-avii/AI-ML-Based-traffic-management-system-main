import React from 'react';
import { motion } from 'framer-motion';
import { Car, Clock, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

// Define expected type for results prop (based on backend model)
interface DetectedVehicleData {
    vehicle_type: string;
    confidence: number;
    bounding_box: { x1: number, y1: number, x2: number, y2: number };
    lane: string;
    is_emergency: boolean;
    // Add other fields if needed
}

interface VehicleDetectionResultData {
    total_vehicles: number;
    lane_counts: { [key: string]: number };
    detected_vehicles?: DetectedVehicleData[]; // Make optional if not always present
    processing_time?: number;
    image_path?: string;
    annotated_image_path?: string;
    has_emergency_vehicles?: boolean;
    traffic_density?: number;
    detection_timestamp?: string; // ISO string format expected
}

interface VehicleDetectionResultsProps {
    results: VehicleDetectionResultData | null;
}

export const VehicleDetectionResults: React.FC<VehicleDetectionResultsProps> = ({ results }) => {
    if (!results) {
        // Optionally return a placeholder or null if no results yet
        return (
             <div className="mt-6 text-center text-gray-500">
                 No detection results to display. Upload an image first.
             </div>
        );
    }

    const timestamp = results.detection_timestamp
        ? new Date(results.detection_timestamp).toLocaleString()
        : 'N/A';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6 mt-6 text-gray-900 border border-gray-200"
        >
            <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-gray-800 flex items-center">
                 <CheckCircle className="w-5 h-5 mr-2 text-green-600"/>
                 Detection Summary
            </h3>

            {/* Key Metrics Grid */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm mb-5">
                <div className="flex flex-col">
                    <dt className="font-medium text-gray-500 flex items-center">
                         <Car className="w-4 h-4 mr-1"/>Total Vehicles
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-blue-600">{results.total_vehicles ?? '--'}</dd>
                </div>
                <div className="flex flex-col">
                     <dt className="font-medium text-gray-500 flex items-center">
                         <Clock className="w-4 h-4 mr-1"/>Processing Time
                    </dt>
                    <dd className="mt-1 text-lg font-semibold">{results.processing_time?.toFixed(3) ?? '--'}s</dd>
                </div>
                 <div className="flex flex-col">
                     <dt className="font-medium text-gray-500 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1"/>Emergency Detected
                     </dt>
                    <dd className={`mt-1 text-lg font-semibold ${results.has_emergency_vehicles ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
                        {results.has_emergency_vehicles ? 'YES' : 'No'}
                    </dd>
                </div>
                 <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                     <dt className="font-medium text-gray-500">Timestamp</dt>
                     <dd className="mt-1 text-xs text-gray-600">{timestamp}</dd>
                 </div>
                 {/* Annotated Image Link */}
                 {results.annotated_image_path && (
                     <div className="col-span-1 sm:col-span-2 lg:col-span-3 mt-1">
                         <dt className="font-medium text-gray-500 mb-1">Annotated Output</dt>
                         <dd>
                             <a
                                href={results.annotated_image_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors"
                             >
                                 View Annotated Image <ExternalLink className="w-3 h-3 ml-1.5"/>
                             </a>
                         </dd>
                     </div>
                 )}
            </dl>

            {/* Lane Counts Table */}
            <h4 className="font-semibold mt-6 mb-2 text-base border-t pt-4 text-gray-800">
                Vehicle Counts by Lane
            </h4>
            {results.lane_counts && Object.keys(results.lane_counts).length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Lane</th>
                                <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Count</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(results.lane_counts).map(([lane, count]) => (
                                <tr key={lane}>
                                    <td className="px-4 py-2 whitespace-nowrap capitalize text-gray-700">{lane}</td>
                                    <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{count as number}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                 <p className="text-sm text-gray-500 italic">No lane count data available.</p>
            )}

            {/* Optional: Display detailed list of detected vehicles (can be long) */}
            {/*
            <h4 className="font-semibold mt-6 mb-2 text-base border-t pt-4">Detected Vehicles List</h4>
            {results.detected_vehicles && results.detected_vehicles.length > 0 ? (
                <ul className="list-disc list-inside text-sm space-y-1 max-h-40 overflow-y-auto">
                    {results.detected_vehicles.slice(0, 10).map((vehicle, index) => ( // Show first 10
                        <li key={index}>
                            {vehicle.vehicle_type} ({vehicle.confidence.toFixed(2)}) in {vehicle.lane} lane {vehicle.is_emergency ? '(Emergency)' : ''}
                        </li>
                    ))}
                    {results.detected_vehicles.length > 10 && <li>... and {results.detected_vehicles.length - 10} more</li>}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 italic">No individual vehicles detected or listed.</p>
            )}
            */}
        </motion.div>
    );
};
