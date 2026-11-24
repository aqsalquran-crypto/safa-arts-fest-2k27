
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  publishResultSet,
  unpublishResultSet,
  deleteResultSet,
} from "./actions";

type Props = {
  resultSetId: string;
  status: string;
};

export default function PublishButton({
  resultSetId,
  status,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handlePublish() {
    if (!confirm("Are you sure you want to publish these results?")) return;

    setLoading(true);
    setMessage("");

    try {
      const result = await publishResultSet(resultSetId);
      setMessage(result.message);

      if (result.success) router.refresh();
    } catch {
      setMessage("Something went wrong while publishing.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnpublish() {
    if (!confirm("Unpublish these results? They will disappear from the public results page.")) return;

    setLoading(true);
    setMessage("");

    try {
      const result = await unpublishResultSet(resultSetId);
      setMessage(result.message);

      if (result.success) router.refresh();
    } catch {
      setMessage("Something went wrong while unpublishing.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("WARNING: Permanently delete this result set and all its entries? This cannot be undone.")) return;

    setLoading(true);
    setMessage("");

    try {
      const result = await deleteResultSet(resultSetId);
      setMessage(result.message);

      if (result.success) router.refresh();
    } catch {
      setMessage("Something went wrong while deleting.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "DRAFT" && (
        <button
          type="button"
          onClick={handlePublish}
          disabled={loading}
          className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Please wait..." : "Publish"}
        </button>
      )}

      {status === "PUBLISHED" && (
        <button
          type="button"
          onClick={handleUnpublish}
          disabled={loading}
          className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Please wait..." : "Unpublish"}
        </button>
      )}

      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Please wait..." : "Delete"}
      </button>

      {message && (
        <p className="w-full break-words text-xs text-gray-400">
          {message}
        </p>
      )}
    </div>
  );
}
