
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishResultSet } from "./actions";

export default function PublishButton({
  resultSetId,
}: {
  resultSetId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handlePublish() {
    if (!confirm("Are you sure you want to publish these results?")) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await publishResultSet(resultSetId);
      setMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handlePublish}
        disabled={loading}
        className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-50"
      >
        {loading ? "Publishing..." : "Publish"}
      </button>

      {message && (
        <p className="mt-2 text-xs text-gray-400">{message}</p>
      )}
    </div>
  );
}
