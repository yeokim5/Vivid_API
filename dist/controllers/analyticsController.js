"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentActivity = exports.getDashboardOverview = exports.getUserActivityStats = exports.getEssayCreationStats = exports.getUserRegistrationStats = void 0;
const User_1 = __importDefault(require("../models/User"));
const Essay_1 = __importDefault(require("../models/Essay"));
const Activity_1 = __importDefault(require("../models/Activity"));
// Helper function to get date range for analytics
const getDateRange = (period) => {
    const now = new Date();
    let startDate;
    switch (period) {
        case "7d":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case "30d":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case "90d":
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case "1y":
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    return { startDate, endDate: now };
};
// Get user registration statistics over time
const getUserRegistrationStats = async (req, res) => {
    try {
        const period = req.query.period || "30d";
        const { startDate, endDate } = getDateRange(period);
        const stats = await User_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt",
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);
        // Fill in missing dates with 0 counts
        const filledStats = [];
        const currentDate = new Date(startDate);
        const statsMap = new Map(stats.map((s) => [s._id, s.count]));
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split("T")[0];
            filledStats.push({
                date: dateStr,
                count: statsMap.get(dateStr) || 0,
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        res.json({
            success: true,
            data: {
                period,
                stats: filledStats,
                totalUsers: await User_1.default.countDocuments(),
                newUsersInPeriod: stats.reduce((sum, stat) => sum + stat.count, 0),
            },
        });
    }
    catch (error) {
        console.error("Error getting user registration stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get user registration statistics",
        });
    }
};
exports.getUserRegistrationStats = getUserRegistrationStats;
// Get essay creation statistics over time
const getEssayCreationStats = async (req, res) => {
    try {
        const period = req.query.period || "30d";
        const { startDate, endDate } = getDateRange(period);
        const stats = await Essay_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt",
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);
        // Fill in missing dates with 0 counts
        const filledStats = [];
        const currentDate = new Date(startDate);
        const statsMap = new Map(stats.map((s) => [s._id, s.count]));
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split("T")[0];
            filledStats.push({
                date: dateStr,
                count: statsMap.get(dateStr) || 0,
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        res.json({
            success: true,
            data: {
                period,
                stats: filledStats,
                totalEssays: await Essay_1.default.countDocuments(),
                newEssaysInPeriod: stats.reduce((sum, stat) => sum + stat.count, 0),
            },
        });
    }
    catch (error) {
        console.error("Error getting essay creation stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get essay creation statistics",
        });
    }
};
exports.getEssayCreationStats = getEssayCreationStats;
// Get user activity statistics
const getUserActivityStats = async (req, res) => {
    try {
        const period = req.query.period || "30d";
        const { startDate, endDate } = getDateRange(period);
        const activityStats = await Activity_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: "$action",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { count: -1 },
            },
        ]);
        res.json({
            success: true,
            data: {
                period,
                activityBreakdown: activityStats,
                totalActivities: activityStats.reduce((sum, stat) => sum + stat.count, 0),
            },
        });
    }
    catch (error) {
        console.error("Error getting user activity stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get user activity statistics",
        });
    }
};
exports.getUserActivityStats = getUserActivityStats;
// Get dashboard overview statistics
const getDashboardOverview = async (req, res) => {
    try {
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [totalUsers, totalEssays, usersLast30Days, essaysLast30Days, usersLast7Days, essaysLast7Days, totalViews, topEssays,] = await Promise.all([
            User_1.default.countDocuments(),
            Essay_1.default.countDocuments(),
            User_1.default.countDocuments({ createdAt: { $gte: last30Days } }),
            Essay_1.default.countDocuments({ createdAt: { $gte: last30Days } }),
            User_1.default.countDocuments({ createdAt: { $gte: last7Days } }),
            Essay_1.default.countDocuments({ createdAt: { $gte: last7Days } }),
            Essay_1.default.aggregate([
                { $group: { _id: null, totalViews: { $sum: "$views" } } },
            ]),
            Essay_1.default.find()
                .sort({ views: -1 })
                .limit(5)
                .select("title views createdAt author")
                .populate("author", "name"),
        ]);
        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalEssays,
                    totalViews: totalViews[0]?.totalViews || 0,
                    usersLast30Days,
                    essaysLast30Days,
                    usersLast7Days,
                    essaysLast7Days,
                },
                topEssays,
                growth: {
                    users: {
                        last7Days: usersLast7Days,
                        last30Days: usersLast30Days,
                    },
                    essays: {
                        last7Days: essaysLast7Days,
                        last30Days: essaysLast30Days,
                    },
                },
            },
        });
    }
    catch (error) {
        console.error("Error getting dashboard overview:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get dashboard overview",
        });
    }
};
exports.getDashboardOverview = getDashboardOverview;
// Get real-time activity feed
const getRecentActivity = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const recentActivities = await Activity_1.default.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("userId", "name email")
            .select("action details createdAt userId");
        res.json({
            success: true,
            data: {
                activities: recentActivities,
            },
        });
    }
    catch (error) {
        console.error("Error getting recent activity:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get recent activity",
        });
    }
};
exports.getRecentActivity = getRecentActivity;
