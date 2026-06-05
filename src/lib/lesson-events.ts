import { supabase } from "@/integrations/supabase/client";

/**
 * Award lesson completion: writes user_progress, upserts daily_progress
 * (adding minutes and incrementing lessons_done), updates streak, and
 * triggers achievement evaluation on next Home load.
 */
export async function recordLessonCompletion(opts: {
  lessonId?: string | null;
  passageId?: string | null;
  minutes?: number;
}) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, reason: "auth" } as const;
  const userId = u.user.id;
  const minutes = Math.max(1, opts.minutes ?? 5);
  const today = new Date().toISOString().slice(0, 10);

  // 1. user_progress (only for real lesson IDs)
  if (opts.lessonId) {
    await supabase.from("user_progress").insert({
      user_id: userId,
      lesson_id: opts.lessonId,
      completed_at: new Date().toISOString(),
      minutes_spent: minutes,
    });
  }

  // 2. daily_progress upsert (manual merge since unique key isn't guaranteed)
  const { data: existing } = await supabase
    .from("daily_progress")
    .select("id, minutes, lessons_done, words_saved")
    .eq("user_id", userId)
    .eq("day", today)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("daily_progress")
      .update({
        minutes: (existing.minutes ?? 0) + minutes,
        lessons_done: (existing.lessons_done ?? 0) + 1,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("daily_progress").insert({
      user_id: userId,
      day: today,
      minutes,
      lessons_done: 1,
      words_saved: 0,
    });
  }

  // 3. Streak (profiles)
  const { data: prof } = await supabase
    .from("profiles")
    .select("streak_days, last_active_date")
    .eq("id", userId)
    .maybeSingle();
  if (prof) {
    const last = prof.last_active_date ? new Date(prof.last_active_date) : null;
    const todayD = new Date(today);
    const diff = last
      ? Math.round((todayD.getTime() - last.getTime()) / 86400000)
      : null;
    let newStreak = prof.streak_days ?? 0;
    if (diff === 0) {
      // same day — keep streak
    } else if (diff === 1) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
    await supabase
      .from("profiles")
      .update({ streak_days: newStreak, last_active_date: today })
      .eq("id", userId);
  }

  return { ok: true } as const;
}
