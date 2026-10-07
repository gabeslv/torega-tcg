import { supabase } from './supabase';

export type PublicPlayer = {
  id: string;
  name: string;
  slug: string;
  photo: string | null;
  bio: string | null;
  games: string[];
};

export type PlayerTournamentStat = {
  id: string;
  tournamentId: string;
  tournamentName: string;
  tournamentDate: string | null;
  location: string | null;
  gameName: string;
  placement: number | null;
  wins: number;
  losses: number;
  deckName: string | null;
  deckFormat: string | null;
  deckImageUrl: string | null;
  decklistImageUrl: string | null;
};

export type PlayerMatchStat = {
  id: string;
  tournamentId: string | null;
  tournamentName: string;
  tournamentDate: string | null;
  gameName: string;
  round: number;
  opponentName: string;
  opponentDeck: string | null;
  result: 'win' | 'loss' | 'draw';
  playerScore: number;
  opponentScore: number;
  deckName: string | null;
};

export type PlayerGameStat = {
  gameName: string;
  tournaments: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
  winRate: number;
  titles: number;
  top4: number;
  top8: number;
  bestPlacement: number | null;
};

export type PlayerStats = {
  tournaments: number;
  titles: number;
  top4: number;
  top8: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
  winRate: number;
  bestPlacement: number | null;
  games: PlayerGameStat[];
  tournamentsHistory: PlayerTournamentStat[];
  matchesHistory: PlayerMatchStat[];
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

export async function getPlayerStats(
  playerId: string
): Promise<PlayerStats> {
  const emptyStats: PlayerStats = {
    tournaments: 0,
    titles: 0,
    top4: 0,
    top8: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    matches: 0,
    winRate: 0,
    bestPlacement: null,
    games: [],
    tournamentsHistory: [],
    matchesHistory: [],
  };

  /*
   * ============================================================
   * TORNEIOS DO JOGADOR
   * ============================================================
   */

  const { data: tournamentPlayers, error: tournamentsError } =
    await supabase
      .from('tournament_players')
      .select(`
        id,
        player_id,
        placement,
        wins,
        losses,
        deck_id,
        status,
        tournament:tournaments (
          id,
          name,
          tournament_date,
          location,
          status,
          game:games (
            id,
            name
          )
        ),
        deck:decks (
          id,
          name,
          format,
          image_url,
          decklist_image_url
        )
      `)
      .eq('player_id', playerId);

  if (tournamentsError) {
    console.error(
      'Erro ao carregar torneios do jogador:',
      tournamentsError
    );

    return emptyStats;
  }

  const validTournamentPlayers = (tournamentPlayers || []).filter(
    (item: any) => {
      const tournament = Array.isArray(item.tournament)
        ? item.tournament[0]
        : item.tournament;

      return tournament?.status === 'approved';
    }
  );

  const tournamentsHistory: PlayerTournamentStat[] =
    validTournamentPlayers.map((item: any) => {
      const tournament = Array.isArray(item.tournament)
        ? item.tournament[0]
        : item.tournament;

      const game = Array.isArray(tournament?.game)
        ? tournament?.game[0]
        : tournament?.game;

      const deck = Array.isArray(item.deck)
        ? item.deck[0]
        : item.deck;

      return {
        id: item.id,
        tournamentId: tournament?.id || '',
        tournamentName: tournament?.name || 'Torneio',
        tournamentDate: tournament?.tournament_date || null,
        location: tournament?.location || null,
        gameName: game?.name || 'Jogo',
        placement:
          typeof item.placement === 'number'
            ? item.placement
            : null,
        wins: Number(item.wins || 0),
        losses: Number(item.losses || 0),
        deckName: deck?.name || null,
        deckFormat: deck?.format || null,
        deckImageUrl: deck?.image_url || null,
        decklistImageUrl:
          deck?.decklist_image_url || null,
      };
    });

  /*
   * ============================================================
   * PARTIDAS
   * ============================================================
   *
   * Usamos player_id quando ele estiver preenchido.
   * Caso uma partida antiga esteja vinculada apenas pelo
   * tournament_player_id, também conseguimos encontrá-la.
   */

  const { data: matchesByPlayer, error: matchesError } =
    await supabase
      .from('matches')
      .select(`
        id,
        tournament_id,
        player_id,
        opponent_name,
        opponent_deck,
        round,
        player_score,
        opponent_score,
        result,
        tournament:tournaments (
          id,
          name,
          tournament_date,
          status,
          game:games (
            id,
            name
          )
        ),
        tournament_player:tournament_players (
          id,
          player_id,
          deck:decks (
            id,
            name
          )
        )
      `)
      .eq('player_id', playerId)
      .order('round', {
        ascending: true,
      });

  if (matchesError) {
    console.error(
      'Erro ao carregar partidas do jogador:',
      matchesError
    );
  }

  const { data: matchesByTournamentPlayer } =
    await supabase
      .from('matches')
      .select(`
        id,
        tournament_id,
        player_id,
        opponent_name,
        opponent_deck,
        round,
        player_score,
        opponent_score,
        result,
        tournament:tournaments (
          id,
          name,
          tournament_date,
          status,
          game:games (
            id,
            name
          )
        ),
        tournament_player:tournament_players (
          id,
          player_id,
          deck:decks (
            id,
            name
          )
        )
      `)
      .is('player_id', null)
      .order('round', {
        ascending: true,
      });

  const fallbackMatches = (matchesByTournamentPlayer || []).filter(
    (match: any) => {
      const tournamentPlayer = Array.isArray(
        match.tournament_player
      )
        ? match.tournament_player[0]
        : match.tournament_player;

      return tournamentPlayer?.player_id === playerId;
    }
  );

  const allMatches = [
    ...(matchesByPlayer || []),
    ...fallbackMatches,
  ];

  /*
   * Evita duplicação caso uma partida apareça nas duas consultas.
   */

  const uniqueMatches = Array.from(
    new Map(
      allMatches.map((match: any) => [match.id, match])
    ).values()
  );

  const matchesHistory: PlayerMatchStat[] = uniqueMatches
    .filter((match: any) => {
      const tournament = Array.isArray(match.tournament)
        ? match.tournament[0]
        : match.tournament;

      return tournament?.status === 'approved';
    })
    .map((match: any) => {
      const tournament = Array.isArray(match.tournament)
        ? match.tournament[0]
        : match.tournament;

      const game = Array.isArray(tournament?.game)
        ? tournament?.game[0]
        : tournament?.game;

      const tournamentPlayer = Array.isArray(
        match.tournament_player
      )
        ? match.tournament_player[0]
        : match.tournament_player;

      const deck = Array.isArray(tournamentPlayer?.deck)
        ? tournamentPlayer?.deck[0]
        : tournamentPlayer?.deck;

      return {
        id: match.id,
        tournamentId: match.tournament_id || null,
        tournamentName:
          tournament?.name || 'Torneio',
        tournamentDate:
          tournament?.tournament_date || null,
        gameName: game?.name || 'Jogo',
        round: Number(match.round || 1),
        opponentName:
          match.opponent_name || 'Adversário',
        opponentDeck:
          match.opponent_deck || null,
        result: match.result || 'draw',
        playerScore: Number(match.player_score || 0),
        opponentScore: Number(
          match.opponent_score || 0
        ),
        deckName: deck?.name || null,
      };
    })
    .sort((a, b) => {
      const dateA = a.tournamentDate || '';
      const dateB = b.tournamentDate || '';

      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }

      return b.round - a.round;
    });

  /*
   * ============================================================
   * ESTATÍSTICAS GERAIS
   * ============================================================
   */

  const tournaments = tournamentsHistory.length;

  const titles = tournamentsHistory.filter(
    (item) => item.placement === 1
  ).length;

  const top4 = tournamentsHistory.filter(
    (item) =>
      item.placement !== null &&
      item.placement >= 1 &&
      item.placement <= 4
  ).length;

  const top8 = tournamentsHistory.filter(
    (item) =>
      item.placement !== null &&
      item.placement >= 1 &&
      item.placement <= 8
  ).length;

  const wins = matchesHistory.filter(
    (match) => match.result === 'win'
  ).length;

  const losses = matchesHistory.filter(
    (match) => match.result === 'loss'
  ).length;

  const draws = matchesHistory.filter(
    (match) => match.result === 'draw'
  ).length;

  const matches = wins + losses + draws;

  const winRate =
    matches > 0 ? (wins / matches) * 100 : 0;

  const placements = tournamentsHistory
    .map((item) => item.placement)
    .filter(
      (placement): placement is number =>
        typeof placement === 'number' &&
        placement > 0
    );

  const bestPlacement =
    placements.length > 0
      ? Math.min(...placements)
      : null;

  /*
   * ============================================================
   * ESTATÍSTICAS POR JOGO
   * ============================================================
   */

  const gameNames = Array.from(
    new Set([
      ...tournamentsHistory.map(
        (item) => item.gameName
      ),
      ...matchesHistory.map(
        (item) => item.gameName
      ),
    ])
  );

  const games: PlayerGameStat[] = gameNames
    .map((gameName) => {
      const gameTournaments =
        tournamentsHistory.filter(
          (item) => item.gameName === gameName
        );

      const gameMatches =
        matchesHistory.filter(
          (match) => match.gameName === gameName
        );

      const gameWins = gameMatches.filter(
        (match) => match.result === 'win'
      ).length;

      const gameLosses = gameMatches.filter(
        (match) => match.result === 'loss'
      ).length;

      const gameDraws = gameMatches.filter(
        (match) => match.result === 'draw'
      ).length;

      const gameMatchCount =
        gameWins + gameLosses + gameDraws;

      const gameWinRate =
        gameMatchCount > 0
          ? (gameWins / gameMatchCount) * 100
          : 0;

      const gamePlacements = gameTournaments
        .map((item) => item.placement)
        .filter(
          (placement): placement is number =>
            typeof placement === 'number' &&
            placement > 0
        );

      return {
        gameName,
        tournaments: gameTournaments.length,
        wins: gameWins,
        losses: gameLosses,
        draws: gameDraws,
        matches: gameMatchCount,
        winRate: gameWinRate,
        titles: gameTournaments.filter(
          (item) => item.placement === 1
        ).length,
        top4: gameTournaments.filter(
          (item) =>
            item.placement !== null &&
            item.placement >= 1 &&
            item.placement <= 4
        ).length,
        top8: gameTournaments.filter(
          (item) =>
            item.placement !== null &&
            item.placement >= 1 &&
            item.placement <= 8
        ).length,
        bestPlacement:
          gamePlacements.length > 0
            ? Math.min(...gamePlacements)
            : null,
      };
    })
    .sort((a, b) => {
      if (b.tournaments !== a.tournaments) {
        return b.tournaments - a.tournaments;
      }

      return b.matches - a.matches;
    });

  return {
    tournaments,
    titles,
    top4,
    top8,
    wins,
    losses,
    draws,
    matches,
    winRate,
    bestPlacement,
    games,
    tournamentsHistory,
    matchesHistory,
  };
}