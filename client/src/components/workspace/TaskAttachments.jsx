import { useState, useEffect, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import {
  uploadAttachment,
  getTaskAttachments,
  deleteAttachment
} from "../../services/attachmentService";

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const getFileType = (ext) => {
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["ppt", "pptx"].includes(ext)) return "powerpoint";
  if (["xls", "xlsx"].includes(ext)) return "excel";
  if (["zip", "rar"].includes(ext)) return "archive";
  if (ext === "txt") return "text";
  return "other";
};

const fileIcons = {
  image: "🖼️",
  pdf: "📕",
  word: "📝",
  excel: "📊",
  powerpoint: "📈",
  archive: "📦",
  text: "📄",
  other: "📎",
};

const TaskAttachments = ({ projectId, taskId, isCreator, currentUser }) => {
  const { socket } = useSocket();

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadQueue, setUploadQueue] = useState([]);
  const fileInputRef = useRef(null);

  // Preview overlay states
  const [previewImage, setPreviewImage] = useState(null);

  const fetchAttachments = async () => {
    setLoading(true);
    try {
      const res = await getTaskAttachments(taskId);
      if (res.success) {
        setAttachments(res.attachments);
      }
    } catch (err) {
      console.error("Failed to load task attachments:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [taskId]);

  // Socket synchronization
  useEffect(() => {
    if (!socket) return;

    const handleUploaded = (attachment) => {
      // Check if attachment belongs to this task card
      if (attachment.task !== taskId) return;

      setAttachments((prev) => {
        const existingIdx = prev.findIndex((a) => a._id === attachment._id);
        if (existingIdx !== -1) {
          const existing = prev[existingIdx];
          // Version safety: Compare timestamps to prevent out of order syncs
          if (new Date(existing.updatedAt) >= new Date(attachment.updatedAt)) {
            return prev;
          }
          const updated = [...prev];
          updated[existingIdx] = attachment;
          return updated;
        }
        return [attachment, ...prev];
      });
    };

    const handleDeleted = ({ attachmentId, taskId: taskRefId }) => {
      if (taskRefId !== taskId) return;
      setAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
    };

    socket.on("attachment_uploaded", handleUploaded);
    socket.on("attachment_deleted", handleDeleted);

    return () => {
      socket.off("attachment_uploaded", handleUploaded);
      socket.off("attachment_deleted", handleDeleted);
    };
  }, [socket, taskId]);

  const processUpload = async (file) => {
    const uploadId = Math.random().toString(36).substring(7);
    const controller = new AbortController();

    const queueItem = {
      id: uploadId,
      name: file.name,
      size: file.size,
      progress: 0,
      status: "uploading",
      controller,
    };

    setUploadQueue((prev) => [...prev, queueItem]);

    // Optimistic UI placeholder card insert
    const ext = file.name.split(".").pop().toLowerCase();
    const fileType = getFileType(ext);
    const placeholder = {
      _id: uploadId,
      fileName: file.name,
      originalName: file.name,
      fileSize: file.size,
      fileType,
      mimeType: file.type,
      fileUrl: "",
      uploadedBy: {
        _id: currentUser._id,
        name: currentUser.name,
        profilePicture: currentUser.profilePicture,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPlaceholder: true,
    };

    setAttachments((prev) => [placeholder, ...prev]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);
    formData.append("taskId", taskId);

    try {
      const res = await uploadAttachment(
        formData,
        (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadQueue((prev) =>
            prev.map((q) => (q.id === uploadId ? { ...q, progress: pct } : q))
          );
        },
        controller.signal
      );

      if (res.success) {
        setAttachments((prev) =>
          prev.map((a) => (a._id === uploadId ? res.attachment : a))
        );
        setUploadQueue((prev) => prev.filter((q) => q.id !== uploadId));
      }
    } catch (err) {
      setAttachments((prev) => prev.filter((a) => a._id !== uploadId));
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === uploadId
            ? { ...q, status: "failed", error: err.message || "Failed to upload" }
            : q
        )
      );
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(processUpload);
    e.target.value = "";
  };

  const cancelUpload = (id) => {
    const item = uploadQueue.find((q) => q.id === id);
    if (item && item.controller) {
      item.controller.abort();
    }
    setUploadQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const handleDelete = async (attachmentId) => {
    if (!window.confirm("Delete this attachment from task?")) return;
    try {
      const res = await deleteAttachment(attachmentId);
      if (res.success) {
        setAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to delete task file.");
    }
  };

  const triggerDownload = (attachment) => {
    const link = document.createElement("a");
    link.href = attachment.fileUrl;
    link.target = "_blank";
    link.download = attachment.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (attachment) => {
    if (attachment.fileType === "image") {
      setPreviewImage(attachment);
    } else if (attachment.fileType === "pdf") {
      window.open(attachment.fileUrl, "_blank");
    } else {
      triggerDownload(attachment);
    }
  };

  return (
    <div className="space-y-4 pt-2 border-t border-border-slate">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-400">Attachments</label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-[10px] font-bold text-primary hover:text-primary-hover transition-colors duration-200 cursor-pointer"
        >
          + Add File
        </button>
      </div>

      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Queue Manager */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
          {uploadQueue.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded-card bg-card-surface/40 border border-border-slate text-[10px]">
              <span className="font-semibold text-white truncate max-w-[150px]">{item.name}</span>
              {item.status === "uploading" ? (
                <div className="flex items-center gap-2 flex-1 justify-end ml-4">
                  <div className="w-16 bg-bg-base h-1 rounded-full overflow-hidden shrink-0">
                    <div className="gradient-bg h-full" style={{ width: `${item.progress}%` }} />
                  </div>
                  <span className="text-primary font-bold shrink-0">{item.progress}%</span>
                  <button
                    type="button"
                    onClick={() => cancelUpload(item.id)}
                    className="text-danger hover:text-red-300 ml-1 shrink-0 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span className="text-danger ml-2 truncate">{item.error}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Task Attachments Lists */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, idx) => (
            <div key={idx} className="h-10 rounded-card bg-card-surface/50 animate-pulse border border-border-slate" />
          ))}
        </div>
      ) : attachments.length > 0 ? (
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {attachments.map((item) => {
            const isUploader = item.uploadedBy?._id === currentUser._id;
            const canDelete = isCreator || isUploader;

            return (
              <div
                key={item._id}
                tabIndex={0}
                className="flex items-center justify-between p-2.5 rounded-card bg-card-surface/60 hover:bg-hover-surface border border-border-slate group text-xs focus:outline-none focus:border-primary transition-all duration-200"
                aria-label={`${item.fileName}, size: ${formatBytes(item.fileSize)}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg select-none">{fileIcons[item.fileType] || "📎"}</span>
                  <div className="min-w-0">
                    <h5 className="font-semibold text-white truncate max-w-[160px]" title={item.fileName}>
                      {item.fileName}
                    </h5>
                    <p className="text-[9px] text-gray-400">{formatBytes(item.fileSize)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.isPlaceholder ? (
                    <span className="text-[9px] text-primary font-bold animate-pulse">Uploading...</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handlePreview(item)}
                        className="p-1 rounded bg-bg-base text-[10px] text-primary hover:text-white transition cursor-pointer"
                        aria-label="Preview task attachment"
                      >
                        👁️
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerDownload(item)}
                        className="p-1 rounded bg-bg-base text-[10px] text-primary hover:text-white transition cursor-pointer"
                        aria-label="Download task attachment"
                      >
                        ⬇️
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="p-1 rounded bg-danger/10 text-[10px] text-danger hover:bg-danger/20 transition cursor-pointer"
                          aria-label="Delete task attachment"
                        >
                          🗑️
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-[10px] text-gray-500 py-2.5">No attachments linked to this task card.</p>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-slate rounded-modal p-5 max-w-lg w-full relative space-y-4 shadow-premium">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-card-surface border border-border-slate flex items-center justify-center text-sm text-gray-400 hover:text-white transition cursor-pointer"
              aria-label="Close image preview overlay"
            >
              ✕
            </button>
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-white truncate">{previewImage.fileName}</h3>
            </div>
            <div className="w-full bg-bg-base border border-border-slate rounded-card overflow-hidden flex items-center justify-center max-h-[40vh] p-2">
              <img
                src={previewImage.fileUrl}
                alt={previewImage.fileName}
                className="object-contain max-h-[38vh] rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 rounded-btn border border-border-slate text-[11px] font-bold text-gray-400 hover:text-white hover:bg-hover-surface transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => triggerDownload(previewImage)}
                className="px-4 py-2 rounded-btn text-[11px] font-bold text-white bg-primary hover:bg-primary-hover shadow-subtle transition-all duration-200 cursor-pointer"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskAttachments;
