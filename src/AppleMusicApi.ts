

export async function loadSongs(params: MusicKit.QueryParameters) {
  const music = MusicKit.getInstance();

  return ((await music.api.library.songs(null, params)) as unknown) as MusicKit.MediaItem[];
}

export async function getISRCfromAppleIds (ids: string[]) {
  const music = MusicKit.getInstance();

  return ((await music.api.songs(ids)))
}