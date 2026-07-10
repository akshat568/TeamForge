import Notification from "../models/notification.js";

/**
 * @desc    Get user's notifications (all, paginated)
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const skip = (page - 1) * limit;

    const query = { recipient: req.user._id };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name profilePicture")
      .populate("project", "title")
      .lean();

    const total = await Notification.countDocuments(query);

    return res.status(200).json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread notifications (paginated)
 * @route   GET /api/notifications/unread
 * @access  Private
 */
export const getUnreadNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const skip = (page - 1) * limit;

    const query = { recipient: req.user._id, read: false };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name profilePicture")
      .populate("project", "title")
      .lean();

    const total = await Notification.countDocuments(query);

    return res.status(200).json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread count
 * @route   GET /api/notifications/count
 * @access  Private
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a specific notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    )
      .populate("sender", "name profilePicture")
      .populate("project", "title");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all user's notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const result = await Notification.deleteOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete all read notifications
 * @route   DELETE /api/notifications/read
 * @access  Private
 */
export const deleteReadNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({
      recipient: req.user._id,
      read: true,
    });

    return res.status(200).json({
      success: true,
      message: "All read notifications deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
