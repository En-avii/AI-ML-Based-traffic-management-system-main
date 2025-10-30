import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Car, AlertTriangle, Clock, TrendingUp, Zap
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    ChartData,
    ChartOptions,
} from 'chart.js';

// Register all required chart modules
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, ArcElement
);

// --- Interfaces ---
interface AnalyticsSummary {
    total_vehicles_processed?: number | null;
    average_wait_time?: number | null;
    peak_hour?: string | null;
    efficiency_improvement?: number | null;
}

interface TimeSeriesData {
    labels?: string[] | null;
    data?: number[] | null;
}

interface DistributionData {
    labels?: string[] | null;
    data?: number[] | null;
}

interface AnalyticsData {
    summary?: AnalyticsSummary | null;
    flow_over_time?: TimeSeriesData | null;
    vehicle_distribution?: DistributionData | null;
    wait_time_by_lane?: TimeSeriesData | null;
}

interface AnalyticsDashboardProps {
    data: AnalyticsData | null;
}

// --- Common chart style options ---
const commonChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: {
                color: '#D1D5DB',
                boxWidth: 12,
                padding: 15,
                font: { size: 12 },
            },
        },
        title: {
            display: true,
            color: '#F9FAFB',
            font: { size: 16, weight: 'bold' },
            padding: { top: 10, bottom: 20 },
        },
        tooltip: {
            backgroundColor: 'rgba(31, 41, 55, 0.9)',
            titleColor: '#F9FAFB',
            bodyColor: '#E5E7EB',
            borderColor: 'rgba(107, 114, 128, 0.5)',
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
        },
    },
    scales: {
        x: {
            type: 'category',
            ticks: { color: '#9CA3AF', font: { size: 10 } },
            grid: { color: 'rgba(75, 85, 99, 0.3)' },
            border: { color: 'rgba(107, 114, 128, 0.5)' },
        },
        y: {
            type: 'linear',
            beginAtZero: true,
            ticks: { color: '#9CA3AF', font: { size: 10 } },
            grid: { color: 'rgba(75, 85, 99, 0.3)' },
            border: { color: 'rgba(107, 114, 128, 0.5)' },
        },
    },
};

const commonDoughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'right',
            labels: {
                color: '#D1D5DB',
                boxWidth: 12,
                padding: 20,
                font: { size: 12 },
            },
        },
        title: {
            display: true,
            color: '#F9FAFB',
            font: { size: 16, weight: 'bold' },
            padding: { top: 10, bottom: 20 },
        },
        tooltip: {
            backgroundColor: 'rgba(31, 41, 55, 0.9)',
            titleColor: '#F9FAFB',
            bodyColor: '#E5E7EB',
            borderColor: 'rgba(107, 114, 128, 0.5)',
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            callbacks: {
                label: function (context) {
                    let label = context.label || '';
                    if (label) label += ': ';
                    const dataset = context.chart.data.datasets?.[0];
                    const dataArray = (Array.isArray(dataset?.data)
                        ? dataset.data
                        : []) as number[];
                    const value = dataArray[context.dataIndex];
                    if (typeof value === 'number') {
                        const total = dataArray.reduce(
                            (a, b) => a + (typeof b === 'number' ? b : 0),
                            0
                        );
                        const percentage =
                            total > 0
                                ? ((value / total) * 100).toFixed(1) + '%'
                                : '0%';
                        label += `${context.formattedValue ?? value} (${percentage})`;
                    }
                    return label;
                },
            },
        },
    },
    cutout: '60%',
};

// --- Summary card ---
interface SummaryCardProps {
    icon: React.ElementType;
    title: string;
    value: string | number | undefined | null;
    bgColor: string;
    iconColor: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
    icon: Icon,
    title,
    value,
    bgColor,
    iconColor,
}) => (
    <div
        className={`rounded-lg shadow-md ${bgColor} bg-opacity-40 p-4 text-center border border-gray-600 hover:bg-opacity-60 transition-all duration-200 ease-in-out`}
    >
        <div
            className={`mx-auto flex items-center justify-center h-10 w-10 rounded-full ${bgColor} ${iconColor} mb-2 border-2 border-gray-500 shadow-inner`}
        >
            {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
        </div>
        <p className="text-xl sm:text-2xl font-semibold text-gray-100 truncate">
            {value !== null && value !== undefined ? value : 'N/A'}
        </p>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 whitespace-nowrap">
            {title}
        </p>
    </div>
);

// --- Chart Error Placeholder ---
const ChartErrorPlaceholder: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
        <AlertTriangle className="w-8 h-8 mb-2 text-yellow-500" />
        <span className="text-sm font-medium">Data unavailable for this chart.</span>
        <span className="text-xs mt-1">
            Check backend connection or data source.
        </span>
    </div>
);

// --- Main Component ---
const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data }) => {
    if (data === null) {
        return (
            <div className="rounded-xl p-8 text-center text-gray-400 min-h-[400px] flex flex-col justify-center items-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-400 mb-4"></div>
                <p className="text-lg font-medium">Loading Analytics Data...</p>
                <p className="text-sm">Please wait while we fetch the latest statistics.</p>
            </div>
        );
    }

    const summary = data?.summary;
    const flowData = data?.flow_over_time;
    const distributionData = data?.vehicle_distribution;
    const waitTimeData = data?.wait_time_by_lane;

    const isFlowDataValid =
        flowData?.labels?.length &&
        flowData?.data?.length &&
        flowData.labels.length === flowData.data.length;

    const isDistributionDataValid =
        distributionData?.labels?.length &&
        distributionData?.data?.length &&
        distributionData.labels.length === distributionData.data.length;

    const isWaitTimeDataValid =
        waitTimeData?.labels?.length &&
        waitTimeData?.data?.length &&
        waitTimeData.labels.length === waitTimeData.data.length;

    if (!summary && !isFlowDataValid && !isDistributionDataValid && !isWaitTimeDataValid) {
        return (
            <div className="rounded-xl p-8 text-center text-red-400 border border-red-800 bg-red-900 bg-opacity-20 min-h-[400px] flex flex-col justify-center items-center">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-500" />
                <p className="text-lg font-semibold">
                    Incomplete or Invalid Analytics Data
                </p>
                <p className="text-sm">Could not retrieve valid data for the dashboard.</p>
            </div>
        );
    }

    // Chart Data
    const flowChartData: ChartData<'line'> = {
        labels: flowData?.labels || [],
        datasets: [
            {
                label: 'Vehicles Detected',
                data: flowData?.data || [],
                borderColor: '#60A5FA',
                backgroundColor: 'rgba(96,165,250,0.15)',
                borderWidth: 2,
                tension: 0.3,
                pointBackgroundColor: '#60A5FA',
                fill: 'origin',
            },
        ],
    };

    const distributionChartData: ChartData<'doughnut'> = {
        labels: distributionData?.labels?.map(
            (l) => (l ? l.charAt(0).toUpperCase() + l.slice(1) : 'Unknown')
        ) || [],
        datasets: [
            {
                label: 'Vehicle Types',
                data: distributionData?.data || [],
                backgroundColor: [
                    'rgba(59,130,246,0.8)',
                    'rgba(239,68,68,0.8)',
                    'rgba(245,158,11,0.8)',
                    'rgba(34,197,94,0.8)',
                    'rgba(168,85,247,0.8)',
                    'rgba(236,72,153,0.8)',
                ],
                borderColor: '#1F2937',
                borderWidth: 2,
                hoverOffset: 12,
            },
        ],
    };

    const waitTimeChartData: ChartData<'bar'> = {
        labels: waitTimeData?.labels || [],
        datasets: [
            {
                label: 'Avg. Wait Time (s)',
                data: waitTimeData?.data || [],
                backgroundColor: 'rgba(167,139,250,0.7)',
                borderColor: '#A78BFA',
                borderWidth: 1,
                borderRadius: 5,
            },
        ],
    };

    // Individual Chart Options
    const lineChartOptions: ChartOptions<'line'> = {
        ...commonChartOptions,
        plugins: {
            ...commonChartOptions.plugins,
            title: { ...commonChartOptions.plugins?.title, text: 'Traffic Volume Trend' },
        },
        scales: {
            x: { ...(commonChartOptions.scales?.x as any) },
            y: {
                ...(commonChartOptions.scales?.y as any),
                title: { display: true, text: 'Vehicle Count', color: '#9CA3AF' },
            },
        },
    };

    const barChartOptions: ChartOptions<'bar'> = {
        ...(commonChartOptions as any),
        plugins: {
            ...commonChartOptions.plugins,
            title: { ...commonChartOptions.plugins?.title, text: 'Avg. Wait Time by Lane' },
        },
        scales: {
            x: { ...(commonChartOptions.scales?.x as any) },
            y: {
                ...(commonChartOptions.scales?.y as any),
                title: { display: true, text: 'Seconds (s)', color: '#9CA3AF' },
            },
        },
    };

    const doughnutOptions: ChartOptions<'doughnut'> = {
        ...commonDoughnutOptions,
        plugins: {
            ...commonDoughnutOptions.plugins,
            title: {
                ...commonDoughnutOptions.plugins?.title,
                text: 'Vehicle Type Distribution',
            },
        },
    };

    return (
        <div className="space-y-6">
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard
                        icon={Car}
                        title="Total Vehicles"
                        value={summary.total_vehicles_processed?.toLocaleString()}
                        bgColor="bg-blue-900"
                        iconColor="text-blue-300"
                    />
                    <SummaryCard
                        icon={Clock}
                        title="Avg. Wait Time"
                        value={
                            summary.average_wait_time
                                ? `${summary.average_wait_time.toFixed(1)}s`
                                : 'N/A'
                        }
                        bgColor="bg-yellow-900"
                        iconColor="text-yellow-300"
                    />
                    <SummaryCard
                        icon={TrendingUp}
                        title="Peak Hour"
                        value={summary.peak_hour}
                        bgColor="bg-red-900"
                        iconColor="text-red-300"
                    />
                    <SummaryCard
                        icon={Zap}
                        title="Efficiency Gain"
                        value={
                            summary.efficiency_improvement
                                ? `${summary.efficiency_improvement.toFixed(1)}%`
                                : 'N/A'
                        }
                        bgColor="bg-green-900"
                        iconColor="text-green-300"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-700 p-4 rounded-lg shadow-lg h-[350px]">
                    {isFlowDataValid ? (
                        <Line options={lineChartOptions} data={flowChartData} />
                    ) : (
                        <ChartErrorPlaceholder />
                    )}
                </div>

                <div className="bg-gray-700 p-4 rounded-lg shadow-lg h-[350px]">
                    {isDistributionDataValid ? (
                        <Doughnut options={doughnutOptions} data={distributionChartData} />
                    ) : (
                        <ChartErrorPlaceholder />
                    )}
                </div>

                <div className="bg-gray-700 p-4 rounded-lg shadow-lg lg:col-span-2 h-[350px]">
                    {isWaitTimeDataValid ? (
                        <Bar options={barChartOptions} data={waitTimeChartData} />
                    ) : (
                        <ChartErrorPlaceholder />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
