import { supabase } from "./supabase";
import { WEB_API_URL } from "./auth";

/** Post or clear a store owner's public reply. Goes through the web API so the
 *  review author gets a notification email. Returns an error message or null. */
export async function postReviewReply(
  reviewId: string,
  reply: string
): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch(`${WEB_API_URL}/api/reviews/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: JSON.stringify({ id: reviewId, reply }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return d.error || "Failed to post reply";
    }
    return null;
  } catch {
    return "Network error — please try again";
  }
}
