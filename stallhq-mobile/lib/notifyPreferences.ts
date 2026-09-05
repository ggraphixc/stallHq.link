import { supabase } from "./supabase";

export interface NotifyPreferences {
  order_updates: boolean;
  trial_reminders: boolean;
  product_alerts: boolean;
  review_replies: boolean;
  marketing: boolean;
}

const DEFAULTS: NotifyPreferences = {
  order_updates: true,
  trial_reminders: true,
  product_alerts: true,
  review_replies: true,
  marketing: false,
};

/**
 * Load the current user's notification preferences. Returns defaults if none saved.
 */
export async function loadNotifyPreferences(): Promise<NotifyPreferences> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DEFAULTS;

    const { data } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!data) return DEFAULTS;

    return {
      order_updates: data.order_updates ?? true,
      trial_reminders: data.trial_reminders ?? true,
      product_alerts: data.product_alerts ?? true,
      review_replies: data.review_replies ?? true,
      marketing: data.marketing ?? false,
    };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Save notification preferences for the current user.
 */
export async function saveNotifyPreferences(prefs: NotifyPreferences): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}
