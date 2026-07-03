import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchIcalText, parseIcalBusyDates } from '@/lib/calendar/parse-ical-busy-dates'

export async function syncCalendarImportFeed(
  supabase: SupabaseClient,
  feedId: string
): Promise<{ ok: true; blockCount: number } | { ok: false; error: string }> {
  const { data: feed, error: feedErr } = await supabase
    .from('calendar_import_feeds')
    .select('id, feed_url, enabled')
    .eq('id', feedId)
    .single()

  if (feedErr || !feed) {
    return { ok: false, error: 'Import feed not found' }
  }
  if (!feed.enabled) {
    return { ok: false, error: 'Import feed is disabled' }
  }

  try {
    const icsText = await fetchIcalText(feed.feed_url)
    const blocks = await parseIcalBusyDates(icsText)

    const { error: delErr } = await supabase
      .from('calendar_import_blocks')
      .delete()
      .eq('feed_id', feedId)
    if (delErr) {
      return { ok: false, error: 'Failed to clear old blocks' }
    }

    if (blocks.length > 0) {
      const rows = blocks.map((b) => ({
        feed_id: feedId,
        block_date: b.date,
        summary: b.summary,
      }))
      const { error: insErr } = await supabase.from('calendar_import_blocks').insert(rows)
      if (insErr) {
        return { ok: false, error: 'Failed to save imported blocks' }
      }
    }

    await supabase
      .from('calendar_import_feeds')
      .update({
        last_synced_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', feedId)

    return { ok: true, blockCount: blocks.length }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Sync failed'
    await supabase
      .from('calendar_import_feeds')
      .update({ last_error: message })
      .eq('id', feedId)
    return { ok: false, error: message }
  }
}
