import { supabase } from './supabase';

export type PublicPlayer = {
  id: string;
  name: string;
  slug: string;
  photo: string | null;
  bio: string | null;
  games: string[];
};

export async function getPlayers(): Promise<PublicPlayer[]> {
  const { data, error } = await supabase
    .from('players')
    .select(`
      id,
      name,
      slug,
      photo_url,
      bio,
      active,
      player_games (
        game:games (
          id,
          name
        )
      )
    `)
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('Erro ao carregar jogadores:', error);
    return [];
  }

  return (data || []).map((player: any) => ({
    id: player.id,
    name: player.name,
    slug: player.slug,
    photo: player.photo_url || null,
    bio: player.bio || null,
    games: (player.player_games || [])
      .map((item: any) => {
        if (Array.isArray(item.game)) {
          return item.game[0]?.name;
        }

        return item.game?.name;
      })
      .filter((name: unknown): name is string => Boolean(name)),
  }));
}