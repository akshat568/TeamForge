import { useState, useEffect, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import {
  uploadAttachment,
  getProjectAttachments,
  deleteAttachment
} from "../../services/attachmentService";

// Helper to format file sizes in human-readable labels
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
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

const Documents = ({ projectId, isCreator, currentUser }) => {
  const { socket } = useSocket();

  // Document attachments list states
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"

  // Drag & drop / upload states
  const [dragOver, setDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const fileInputRef = useRef(null);

  // Image preview modal state
  const [previewImage, setPreviewImage] = useState(null);

  // ─── DATA FETCHING ─────────────────────────────────────────────────────────
  const fetchDocuments = async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError("");

    try {
      const res = await getProjectAttachments(projectId, pageNum, 25);
      if (res.success) {
        if (append) {
          setAttachments((prev) => {
            const existingIds = new Set(prev.map((a) => a._id));
            const fresh = res.attachments.filter((a) => !existingIds.has(a._id));
            return [...prev, ...fresh];
          });
        } else {
          setAttachments(res.attachments);
        }
        setTotalPages(res.pagination.pages);
        setPage(pageNum);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load documents.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchDocuments(1, false);
  }, [projectId]);

  // ─── SOCKET SYNC ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleUploaded = (attachment) => {
      setAttachments((prev) => {
        const existingIdx = prev.findIndex((a) => a._id === attachment._id);
        if (existingIdx !== -1) {
          const existing = prev[existingIdx];
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

    const handleDeleted = ({ attachmentId }) => {
      setAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
    };

    socket.on("attachment_uploaded", handleUploaded);
    socket.on("attachment_deleted", handleDeleted);

    return () => {
      socket.off("attachment_uploaded", handleUploaded);
      socket.off("attachment_deleted", handleDeleted);
    };
  }, [socket]);

  // ─── UPLOAD ROUTINES ───────────────────────────────────────────────────────
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
        _id: currentUser?._id,
        name: currentUser?.name,
        profilePicture: currentUser?.profilePicture,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPlaceholder: true,
    };

    setAttachments((prev) => [placeholder, ...prev]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

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
        setAttachments((prev) => prev.filter((a) => a._id !== uploadId));
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(processUpload);
  };

  const cancelUpload = (id) => {
    const item = uploadQueue.find((q) => q.id === id);
    if (item && item.controller) {
      item.controller.abort();
    }
    setUploadQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const retryUpload = (queueItem) => {
    setUploadQueue((prev) => prev.filter((q) => q.id !== queueItem.id));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ─── DELETE ROUTINE ────────────────────────────────────────────────────────
  const handleDelete = async (attachmentId) => {
    if (!window.confirm("Are you sure you want to permanently delete this document?")) return;
    try {
      const res = await deleteAttachment(attachmentId);
      if (res.success) {
        setAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to delete file.");
    }
  };

  // ─── DOWNLOAD/PREVIEW HELPERS ──────────────────────────────────────────────
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

  // ─── LOCAL FILTERING & SORTING ─────────────────────────────────────────────
  const filteredAttachments = attachments.filter((item) => {
    const matchSearch = item.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    let matchFilter = true;
    if (activeFilter !== "all") {
      matchFilter = item.fileType === activeFilter;
    }
    return matchSearch && matchFilter;
  });

  const sortedAttachments = [...filteredAttachments].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
  });

  const getStorageStats = () => {
    const totalDocs = attachments.length;
    const totalBytes = attachments.reduce((sum, a) => sum + (a.fileSize || 0), 0);
    const imagesCount = attachments.filter((a) => a.fileType === "image").length;
    const pdfsCount = attachments.filter((a) => a.fileType === "pdf").length;
    const otherCount = totalDocs - imagesCount - pdfsCount;

    return {
      totalDocs,
      totalStorage: formatBytes(totalBytes),
      imagesCount,
      pdfsCount,
      otherCount,
    };
  };

  const stats = getStorageStats();

  return (
    <div className="space-y-6 pb-12">
      {/* STORAGE STATS SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Documents", value: stats.totalDocs, emoji: "📁" },
          { label: "Capacity Used", value: stats.totalStorage, emoji: "💽" },
          { label: "Image Files", value: stats.imagesCount, emoji: "🖼️" },
          { label: "PDF Documents", value: stats.pdfsCount, emoji: "📕" },
          { label: "Other Formats", value: stats.otherCount, emoji: "📎" },
        ].map((stat, i) => (
          <div key={i} className="bg-card-surface border border-border-slate p-4 rounded-card text-center shadow-subtle hover:border-primary/40 transition-colors">
            <span className="text-xl block mb-1">{stat.emoji}</span>
            <span className="text-[10px] text-muted-text block uppercase tracking-wider font-bold">{stat.label}</span>
            <span className="text-base font-black text-primary-text block mt-0.5">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* DRAG AND DROP AREA */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-card p-8 text-center transition-all duration-200 ${
          dragOver
            ? "border-primary bg-primary/5 shadow-subtle"
            : "border-border-slate bg-card-surface hover:border-primary/50"
        }`}
      >
        <input
          type="file"
          id="workspace-file-upload"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="space-y-3.5 max-w-md mx-auto">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl shadow-inner-soft">
            📤
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-primary-text">Drag & drop workspace files here</p>
            <p className="text-xs text-muted-text">Supports Images, PDFs, Docs, Sheets, TXT, ZIP, and Code snippets (Max 10 MB)</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-btn text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-subtle transition-all duration-200 cursor-pointer"
            aria-label="Browse local files to upload"
          >
            Browse Files
          </button>
        </div>
      </div>

      {/* UPLOAD QUEUE CONSOLE PANEL */}
      {uploadQueue.length > 0 && (
        <div className="bg-card-surface border border-border-slate p-5 rounded-card space-y-3.5 shadow-card">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text">Active Upload Queue</h3>
          <div className="space-y-2.5">
            {uploadQueue.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-3.5 rounded-card bg-[#FAF7F2] border border-border-slate/70">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-primary-text truncate max-w-sm">{item.name}</span>
                    <span className="text-[10px] text-muted-text font-semibold shrink-0">{formatBytes(item.size)}</span>
                  </div>
                  {item.status === "uploading" ? (
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-[#E9E4DA] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-primary shrink-0">{item.progress}%</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-danger font-semibold">{item.error}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {item.status === "uploading" ? (
                    <button
                      onClick={() => cancelUpload(item.id)}
                      className="px-3 py-1 rounded-btn text-[10px] font-bold text-danger bg-danger/10 hover:bg-danger/20 transition cursor-pointer"
                      aria-label="Cancel file upload"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => retryUpload(item)}
                      className="px-3 py-1 rounded-btn text-[10px] font-bold text-warning bg-warning/10 hover:bg-warning/20 transition cursor-pointer"
                      aria-label="Clear failed file queue item"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER & SORT TOOLS PANEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card-surface border border-border-slate p-4 rounded-card shadow-subtle">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "All Docs", value: "all" },
            { label: "Images", value: "image" },
            { label: "PDFs", value: "pdf" },
            { label: "Word", value: "word" },
            { label: "Excel", value: "excel" },
            { label: "PowerPoint", value: "powerpoint" },
            { label: "Archives", value: "archive" },
            { label: "Texts", value: "text" },
          ].map((filt) => (
            <button
              key={filt.value}
              onClick={() => setActiveFilter(filt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeFilter === filt.value
                  ? "bg-primary text-white shadow-subtle"
                  : "text-muted-text hover:text-primary-text bg-[#FAF7F2] border border-border-slate/60 hover:bg-[#F2ECE1]"
              }`}
            >
              {filt.label}
            </button>
          ))}
        </div>

        {/* Search & Sort order dropdowns */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#FAF7F2] border border-border-slate rounded-input px-3.5 py-1.5 text-xs text-primary-text placeholder:text-muted-text/60 focus:outline-none focus:border-primary focus:bg-white w-full sm:w-48 transition-colors"
          />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-1.5 text-xs text-primary-text font-medium focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card bg-danger/10 border border-danger/20 text-xs font-semibold text-danger text-center">
          {error}
        </div>
      )}

      {/* SKELETON LOADING STATES */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="bg-card-surface border border-border-slate p-4 rounded-card space-y-4 animate-pulse shadow-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-border-slate shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-primary/10 rounded w-3/4" />
                  <div className="h-2 bg-primary/5 rounded w-1/2" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border-slate/40">
                <div className="h-2.5 bg-primary/5 rounded w-1/4" />
                <div className="h-6 bg-primary/10 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedAttachments.length > 0 ? (
        <>
          {/* DOCUMENTS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedAttachments.map((item) => {
              const isUploader = item.uploadedBy?._id === currentUser?._id;
              const canDelete = isCreator || isUploader;
              return (
                <div
                  key={item._id}
                  tabIndex={0}
                  className="bg-card-surface hover:bg-[#FAF7F2]/50 border border-border-slate p-4 rounded-card flex flex-col justify-between gap-4 transition-all duration-200 group focus:outline-none focus:border-primary shadow-subtle hover:shadow-card"
                  aria-label={`${item.fileName}, size: ${formatBytes(item.fileSize)}`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-3xl shrink-0 select-none">
                      {fileIcons[item.fileType] || "📎"}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-primary-text truncate group-hover:text-primary transition" title={item.fileName}>
                        {item.fileName}
                      </h4>
                      <p className="text-[10px] text-muted-text font-medium mt-0.5">{formatBytes(item.fileSize)}</p>
                    </div>
                  </div>

                  <div className="border-t border-border-slate/60 pt-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-1.5">
                      {item.uploadedBy?.profilePicture ? (
                        <img
                          src={item.uploadedBy.profilePicture}
                          alt={item.uploadedBy.name}
                          className="w-5 h-5 rounded-full border border-border-slate shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-[8px] text-primary shrink-0">
                          {(item.uploadedBy?.name || "MB").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[10px] text-muted-text font-medium truncate max-w-[80px]">
                        {item.uploadedBy?.name || "Teammate"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.isPlaceholder ? (
                        <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/25 animate-pulse">
                          Uploading...
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handlePreview(item)}
                            className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-border-slate text-[10px] text-primary-text transition cursor-pointer"
                            aria-label="Preview document"
                            title="Preview"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => triggerDownload(item)}
                            className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-border-slate text-[10px] text-primary-text transition cursor-pointer"
                            aria-label="Download document"
                            title="Download"
                          >
                            ⬇️
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-1.5 rounded-lg bg-danger/10 border border-danger/20 text-[10px] text-danger hover:bg-danger/20 transition cursor-pointer"
                              aria-label="Delete document"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION / LOAD MORE BUTTON */}
          {page < totalPages && (
            <div className="text-center pt-6">
              <button
                onClick={() => fetchDocuments(page + 1, true)}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-btn text-xs font-bold text-primary-text bg-card-surface border border-border-slate hover:bg-[#FAF7F2] shadow-subtle transition disabled:opacity-50 flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                {loadingMore ? "Loading more..." : "Load More Documents"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-card-surface border border-border-slate rounded-card">
          <p className="text-xs font-semibold text-muted-text">No documents found matching the filters.</p>
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 bg-secondary-charcoal/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card-surface border border-border-slate rounded-card p-5 max-w-2xl w-full relative space-y-4 shadow-modal">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#FAF7F2] border border-border-slate flex items-center justify-center text-xs text-muted-text hover:text-primary-text transition cursor-pointer"
              aria-label="Close image preview overlay"
            >
              ✕
            </button>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-primary-text truncate max-w-md">{previewImage.fileName}</h3>
              <p className="text-[10px] text-muted-text">Uploaded by {previewImage.uploadedBy?.name}</p>
            </div>

            <div className="w-full bg-[#FAF7F2] border border-border-slate rounded-input overflow-hidden flex items-center justify-center max-h-[50vh] p-2">
              <img
                src={previewImage.fileUrl}
                alt={previewImage.fileName}
                className="object-contain max-h-[48vh] rounded-lg select-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 rounded-btn border border-border-slate text-xs font-bold text-muted-text hover:text-primary-text hover:bg-[#FAF7F2] transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => triggerDownload(previewImage)}
                className="px-5 py-2 rounded-btn text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-subtle transition cursor-pointer"
              >
                Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
