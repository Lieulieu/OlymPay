import { AVATAR_ACCEPT, AVATAR_MAX_BYTES } from "@/config/file";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { UserCircleIcon, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function AvatarUploader({
  value,
  onChange,
  disabled,
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onPick = () => fileInputRef.current?.click();

  const validateFile = (file: File) => {
    if (!AVATAR_ACCEPT.includes(file.type)) {
      return "Only JPG, PNG, or WEBP are allowed.";
    }
    if (file.size > AVATAR_MAX_BYTES) {
      return "Image is too large. Max 5MB.";
    }
    return null;
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("purpose", "avatar");

    const res = await fetch("/api/uploads/avatar", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Upload failed");
    }
    const json = (await res.json()) as { url?: string };
    if (!json?.url) throw new Error("Upload response missing url");
    return json.url;
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reason = validateFile(file);
    if (reason) {
      setError(reason);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      onChange(url);
      toast.success("Avatar uploaded.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Upload failed");
      toast.error("Avatar upload failed.");
    } finally {
      setUploading(false);
      // clear input so selecting the same file again triggers change
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onRemove = () => {
    onChange(null);
  };

  return (
    <div className="card bg-base-100 border border-base-300 p-6">
      <div className="flex items-center gap-6">
        {/* Avatar Display */}
        <div className="relative">
          <div className="avatar">
            <div className="w-20 h-20 rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-base-100">
              {value ? (
                <img
                  src={value}
                  alt="Avatar preview"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-base-200 flex items-center justify-center rounded-full">
                  <UserCircleIcon className="w-12 h-12 text-base-content/40" />
                </div>
              )}
            </div>
          </div>

          {/* Upload overlay for existing avatar */}
          {value && (
            <button
              type="button"
              onClick={onPick}
              disabled={disabled || uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"
            >
              <Upload className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-medium text-base-content">Profile Picture</h3>
            <p className="text-sm text-base-content/60">
              JPG, PNG, or WEBP. Max 5MB.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onPick}
              className="btn btn-primary btn-sm"
              disabled={disabled || uploading}
            >
              {uploading && (
                <span className="loading loading-spinner loading-xs" />
              )}
              {value ? "Change" : "Upload"}
            </button>

            {value && (
              <button
                type="button"
                onClick={onRemove}
                className="btn btn-ghost btn-sm text-base-content/70 hover:text-error"
                disabled={disabled || uploading}
              >
                <XMarkIcon className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error py-2 px-3">
              <span className="text-xs">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={AVATAR_ACCEPT.join(",")}
        className="hidden"
        onChange={onFileChange}
        aria-label="Choose avatar image"
        disabled={disabled || uploading}
      />
    </div>
  );
}
