
// Xtream Codes API Types
export interface XtreamCredentials {
  domain: string;
  username: string;
  password: string;
}

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamStream {
  stream_id: number;
  name: string;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export interface XtreamMovie {
  stream_id: number;
  name: string;
  added: string;
  category_id: string;
  container_extension: string;
  stream_icon: string;
  rating: string;
  director: string;
  actors: string;
  genre: string;
  plot: string;
  releasedate: string;
  youtube_trailer: string;
}

export interface XtreamSeries {
  series_id: number;
  name: string;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate: string;
  last_modified: string;
  rating: string;
  youtube_trailer: string;
}

export interface XtreamSeason {
  id: string;
  season_number: string;
  name: string;
  cover: string;
}

export interface XtreamEpisode {
  id: string;
  episode_num: string;
  title: string;
  container_extension: string;
  info: {
    movie_image: string;
    plot: string;
    releasedate: string;
    duration_secs: number;
  };
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PlaylistState {
  credentials: XtreamCredentials | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
