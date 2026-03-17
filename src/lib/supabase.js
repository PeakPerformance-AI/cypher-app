import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// ── AUTH ──
export async function signUp(email, password, username) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { display_name: username } }
  });
  if (!error) {
    await supabase.from('profiles').update({ username }).eq('id', data.user.id);
  }
  return { data, error };
}

export async function signIn(email, password) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

export async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return { ...user, profile };
}

// ── BEATS ──
export async function uploadBeat(file, { title, bpm, key, mood }) {
  const supabase = createClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not logged in');

  const ext = file.name.split('.').pop();
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('beats').upload(path, file);
  if (uploadError) throw uploadError;

  const audio_url = supabase.storage.from('beats').getPublicUrl(path).data.publicUrl;
  const { data, error } = await supabase.from('beats').insert({
    user_id: user.id, title, bpm: parseInt(bpm), key, mood, audio_url
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getBeats({ mood, search, limit = 20 } = {}) {
  const supabase = createClient();
  let query = supabase.from('beats').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false }).limit(limit);
  if (mood && mood !== 'All') query = query.eq('mood', mood);
  if (search) query = query.or(`title.ilike.%${search}%,profiles.username.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ── CYPHERS ──
export async function uploadCypher(videoFile, { beat_id, title, caption }) {
  const supabase = createClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not logged in');

  const ext = videoFile.name?.split('.').pop() || 'webm';
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('cyphers').upload(path, videoFile);
  if (uploadError) throw uploadError;

  const video_url = supabase.storage.from('cyphers').getPublicUrl(path).data.publicUrl;
  const { data, error } = await supabase.from('cyphers').insert({
    user_id: user.id, beat_id, title, caption, video_url
  }).select().single();
  if (error) throw error;
  return data;
}

// ── FEED ──
export async function getFeed({ limit = 20, offset = 0 } = {}) {
  const supabase = createClient();
  const { data, error } = await supabase.from('feed').select('*').range(offset, offset + limit - 1);
  if (error) throw error;
  return data;
}

// ── LIKES ──
export async function toggleLike(cypher_id) {
  const supabase = createClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not logged in');

  const { data: existing } = await supabase.from('likes')
    .select('id').eq('user_id', user.id).eq('cypher_id', cypher_id).single();

  if (existing) {
    await supabase.from('likes').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('likes').insert({ user_id: user.id, cypher_id });
    return true;
  }
}

// ── COMMENTS ──
export async function getComments(cypher_id) {
  const supabase = createClient();
  const { data } = await supabase.from('comments')
    .select('*, profiles(username, avatar_url)')
    .eq('cypher_id', cypher_id)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function addComment(cypher_id, content) {
  const supabase = createClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not logged in');
  return supabase.from('comments').insert({ user_id: user.id, cypher_id, content });
}

// ── FOLLOWS ──
export async function toggleFollow(target_id) {
  const supabase = createClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not logged in');

  const { data: existing } = await supabase.from('follows')
    .select('id').eq('follower_id', user.id).eq('following_id', target_id).single();

  if (existing) {
    await supabase.from('follows').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('follows').insert({ follower_id: user.id, following_id: target_id });
    return true;
  }
}
