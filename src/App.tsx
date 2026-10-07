import React, { useState, useEffect, useMemo } from 'react';
import AdminLogin from './AdminLogin';
import AdminPanel from './AdminPanel';
import { getCurrentUser } from './lib/auth';
import { getPlayers, PublicPlayer } from './lib/players';
import { supabase } from './lib/supabase';
import {
  ChevronRight,
  Trophy,
  Swords,
  Calendar,
  History,
  Gamepad2,
  Users,
  Shield,
  ArrowLeft,
  Newspaper,
  MapPin,
  ExternalLink,
  X,
  Layers,
} from 'lucide-react';

type View =
  | 'home'
  | 'team'
  | 'playerDetails'
  | 'games'
  | 'tournaments'
  | 'tournamentDetails'
  | 'history'
  | 'news';

type IconComponent = React.ComponentType<{ className?: string }>;

type PublicTournament = {
  id: string;
  name: string;
  tournament_date: string;
  location: string | null;
  description: string | null;
  image_url: string | null;
  status?: string;
  game: {
    id: string;
    name: string;
  } | null;
};

type TournamentParticipant = {
  id: string;
  player_id: string;
  deck_id: string | null;
  placement: number | null;
  wins: number;
  losses: number;
  player: {
    id: string;
    name: string;
    slug: string;
    photo_url: string | null;
  } | null;
  deck: {
    id: string;
    name: string;
    format: string | null;
    image_url: string | null;
    decklist_image_url: string | null;
  } | null;
};

type PublicMatch = {
  id: string;
  round: number;
  opponent_name: string;
  opponent_deck: string | null;
  result: 'win' | 'loss';
  player_score: number;
  opponent_score: number;
  tournament_player: {
    player: {
      id: string;
      name: string;
      photo_url: string | null;
    } | null;
    deck: {
      name: string;
    } | null;
  } | null;
};

/* =========================================================
   ROTAS
========================================================= */

function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function getRouteFromPathname(pathname: string): {
  view: View;
  playerSlug: string | null;
  tournamentId: string | null;
} {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/admin') {
    return {
      view: 'home',
      playerSlug: null,
      tournamentId: null,
    };
  }

  if (cleanPath === '/') {
    return {
      view: 'home',
      playerSlug: null,
      tournamentId: null,
    };
  }

  if (cleanPath === '/jogadores' || cleanPath === '/equipe') {
    return {
      view: 'team',
      playerSlug: null,
      tournamentId: null,
    };
  }

  if (cleanPath.startsWith('/jogador/')) {
    const playerSlug = cleanPath.replace('/jogador/', '').split('/')[0];

    return {
      view: 'playerDetails',
      playerSlug: playerSlug || null,
      tournamentId: null,
    };
  }

  if (cleanPath === '/jogos') {
    return {
      view: 'games',
      playerSlug: null,
      tournamentId: null,
    };
  }

  if (cleanPath === '/torneios') {
    return {
      view: 'tournaments',
      playerSlug: null,
      tournamentId: null,
    };
  }

  if (cleanPath.startsWith('/torneio/')) {
    const tournamentId = cleanPath.replace('/torneio/', '').split('/')[0];

    return {
      view: 'tournamentDetails',
      playerSlug: null,
      tournamentId: tournamentId || null,
    };
  }

  if (cleanPath === '/historia') {
    return {
      view: 'history',
      playerSlug: null,
      tournamentId: null,
    };
  }

  if (cleanPath === '/noticias') {
    return {
      view: 'news',
      playerSlug: null,
      tournamentId: null,
    };
  }

  return {
    view: 'home',
    playerSlug: null,
    tournamentId: null,
  };
}

/* =========================================================
   HEADER
========================================================= */

const Header = ({
  currentView,
}: {
  currentView: View;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: {
    path: string;
    view: View;
    label: string;
  }[] = [
    {
      path: '/',
      view: 'home',
      label: 'Início',
    },
    {
      path: '/jogadores',
      view: 'team',
      label: 'Equipe',
    },
    {
      path: '/jogos',
      view: 'games',
      label: 'Jogos',
    },
    {
      path: '/torneios',
      view: 'tournaments',
      label: 'Torneios',
    },
    {
      path: '/historia',
      view: 'history',
      label: 'História',
    },
    {
      path: '/noticias',
      view: 'news',
      label: 'Notícias',
    },
  ];

  const handleNavigation = (path: string) => {
    navigateTo(path);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-neutral-950/95 backdrop-blur-md border-b border-orange-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <button
            type="button"
            onClick={() => handleNavigation('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500 group-hover:scale-105 transition-transform">
              <img
                src="/toregafoto.png"
                alt="Logo do Torega"
                className="w-full h-full object-cover"
              />
            </div>

            <span className="text-2xl font-black text-white tracking-wider uppercase italic group-hover:text-orange-500 transition-colors">
              Torega
              <span className="text-orange-500 group-hover:text-white transition-colors">
                TCG
              </span>
            </span>
          </button>

          {/* Menu desktop */}
          <nav className="hidden md:flex space-x-6 lg:space-x-8">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`text-sm font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${
                  currentView === item.view
                    ? 'text-orange-500 border-orange-500'
                    : 'text-neutral-400 border-transparent hover:text-white hover:border-white/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Botão mobile */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center w-11 h-11 border border-neutral-800 text-neutral-300 hover:text-orange-500 hover:border-orange-500 transition-colors"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {menuOpen ? (
              <span className="text-2xl leading-none">×</span>
            ) : (
              <span className="text-2xl leading-none">☰</span>
            )}
          </button>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <nav className="md:hidden border-t border-neutral-800 py-4">
            <div className="flex flex-col">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full text-left px-4 py-4 text-sm font-bold uppercase tracking-widest border-l-2 transition-colors ${
                    currentView === item.view
                      ? 'text-orange-500 border-orange-500 bg-orange-500/5'
                      : 'text-neutral-400 border-transparent hover:text-white hover:border-neutral-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState = ({
  icon: Icon,
  title,
  message,
}: {
  icon: IconComponent;
  title: string;
  message: string;
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-neutral-800 bg-neutral-900/30">
    <Icon className="w-12 h-12 text-neutral-600 mb-4" />

    <h3 className="text-lg font-bold text-neutral-300 uppercase tracking-widest mb-2">
      {title}
    </h3>

    <p className="text-neutral-500 italic">
      {message}
    </p>
  </div>
);

/* =========================================================
   HOME
========================================================= */

const HomeView = ({
  playerCount,
}: {
  playerCount: number;
}) => (
  <div className="space-y-24 pb-24">

    {/* Hero */}
    <div className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/20 via-neutral-950 to-neutral-950"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-6 italic transform -skew-x-6">
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
            Torega
          </span>
          TCG
        </h1>

        <p className="text-xl md:text-2xl text-neutral-400 font-light mb-10 max-w-2xl mx-auto">
          A equipe competitiva de Trading Card Games.
          Estratégia, preparação e competição em alto nível.
        </p>

        <button
          onClick={() => navigateTo('/jogadores')}
          className="group relative px-8 py-4 bg-orange-600 text-white font-bold uppercase tracking-widest overflow-hidden transition-transform hover:scale-105"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>

          <span className="relative flex items-center gap-2">
            Conheça o Elenco
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>
      </div>
    </div>

    {/* Sobre */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-3 gap-8">

        <div className="p-8 border border-neutral-800 bg-neutral-900/50 hover:border-orange-500/50 transition-colors">
          <Shield className="w-10 h-10 text-orange-500 mb-6" />

          <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4">
            Excelência Tática
          </h3>

          <p className="text-neutral-400">
            Precisão em cada jogada. Nossos jogadores são dedicados a
            compreender as mecânicas e estratégias dos TCGs em que competimos.
          </p>
        </div>

        <div className="p-8 border border-neutral-800 bg-neutral-900/50 hover:border-orange-500/50 transition-colors">
          <Users className="w-10 h-10 text-orange-500 mb-6" />

          <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4">
            Elenco Unido
          </h3>

          <p className="text-neutral-400">
            {playerCount > 0
              ? `${playerCount} jogadores fazem parte atualmente do elenco ativo do Torega TCG.`
              : 'O elenco ativo do Torega TCG será apresentado aqui.'}
          </p>
        </div>

        <div className="p-8 border border-neutral-800 bg-neutral-900/50 hover:border-orange-500/50 transition-colors">
          <Trophy className="w-10 h-10 text-orange-500 mb-6" />

          <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4">
            Histórico Competitivo
          </h3>

          <p className="text-neutral-400">
            Resultados, torneios e conquistas serão registrados no arquivo
            oficial da equipe.
          </p>
        </div>

      </div>
    </div>
  </div>
);

/* =========================================================
   EQUIPE / JOGADORES
========================================================= */

const TeamView = ({
  players,
  loading,
}: {
  players: PublicPlayer[];
  loading: boolean;
}) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

    <div className="mb-16 border-l-4 border-orange-500 pl-6">
      <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider italic">
        Elenco Ativo
      </h2>

      <p className="text-xl text-neutral-400 mt-2">
        Os competidores que representam o Torega TCG.
      </p>
    </div>

    {loading ? (
      <div className="py-20 text-center text-neutral-500">
        Carregando equipe...
      </div>
    ) : players.length === 0 ? (
      <EmptyState
        icon={Users}
        title="Nenhum jogador"
        message="Nenhum jogador ativo está cadastrado no momento."
      />
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player, index) => (
          <button
            key={player.id}
            type="button"
            onClick={() => navigateTo(`/jogador/${player.slug}`)}
            className="group cursor-pointer relative bg-neutral-900 overflow-hidden border border-neutral-800 hover:border-orange-500 transition-colors text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent z-10 pointer-events-none"></div>

            <div className="h-64 bg-neutral-800 relative overflow-hidden">
              {player.photo ? (
                <img
                  src={player.photo}
                  alt={player.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="w-20 h-20 text-neutral-700 group-hover:text-orange-500/20 transition-colors" />
                </div>
              )}

              <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity z-20">
                <span className="text-6xl font-black italic">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="relative z-20 p-6 -mt-8">
              <h3 className="text-2xl font-bold text-white uppercase tracking-wider mb-2 group-hover:text-orange-400 transition-colors">
                {player.name}
              </h3>

              <div className="flex flex-wrap gap-2">
                {player.games.map((game) => (
                  <span
                    key={game}
                    className="text-xs font-semibold px-2 py-1 bg-neutral-800 text-neutral-300 border border-neutral-700"
                  >
                    {game}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    )}
  </div>
);

/* =========================================================
   JOGADOR
========================================================= */

const PlayerView = ({
  player,
  onOpenTournament,
}: {
  player: PublicPlayer | null;
  onOpenTournament: (id: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState('history');

  const [playerDecks, setPlayerDecks] = useState<any[]>([]);
  const [playerTournaments, setPlayerTournaments] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [decklistImage, setDecklistImage] = useState<string | null>(null);

  useEffect(() => {
    if (!player?.id) {
      setPlayerDecks([]);
      setPlayerTournaments([]);
      setLoadingData(false);
      return;
    }

    async function loadPlayerData() {
      setLoadingData(true);

      /* Decks */
      const { data: decksData } = await supabase
        .from('decks')
        .select(`
          id,
          name,
          format,
          image_url,
          decklist_image_url,
          game:games(name)
        `)
        .eq('player_id', player!.id);

      const normalizedDecks = (decksData || []).map((deck: any) => ({
        ...deck,
        game: Array.isArray(deck.game)
          ? deck.game[0]
          : deck.game,
      }));

      setPlayerDecks(normalizedDecks);

      /* Torneios */
      const { data: tournamentsData } = await supabase
        .from('tournament_players')
        .select(`
          id,
          placement,
          wins,
          losses,
          tournament:tournaments(
            id,
            name,
            tournament_date,
            image_url,
            status,
            game:games(name)
          ),
          deck:decks(name)
        `)
        .eq('player_id', player!.id);

      const normalizedTournaments = (tournamentsData || [])
        .map((tp: any) => {
          const tournament = Array.isArray(tp.tournament)
            ? tp.tournament[0]
            : tp.tournament;

          const deck = Array.isArray(tp.deck)
            ? tp.deck[0]
            : tp.deck;

          if (tournament) {
            tournament.game = Array.isArray(tournament.game)
              ? tournament.game[0]
              : tournament.game;
          }

          return {
            ...tp,
            tournament,
            deck,
          };
        })
        .filter(
          (tp: any) =>
            tp.tournament &&
            tp.tournament.status === 'approved'
        );

      normalizedTournaments.sort(
        (a, b) =>
          new Date(
            b.tournament.tournament_date
          ).getTime() -
          new Date(
            a.tournament.tournament_date
          ).getTime()
      );

      setPlayerTournaments(normalizedTournaments);
      setLoadingData(false);
    }

    loadPlayerData();
  }, [player?.id]);

  const stats = useMemo(() => {
    let totalWins = 0;
    let totalLosses = 0;
    let bestPlacement: number | null = null;

    playerTournaments.forEach((tp) => {
      totalWins += tp.wins || 0;
      totalLosses += tp.losses || 0;

      if (tp.placement) {
        if (
          bestPlacement === null ||
          tp.placement < bestPlacement
        ) {
          bestPlacement = tp.placement;
        }
      }
    });

    const totalMatches = totalWins + totalLosses;

    const winRate =
      totalMatches > 0
        ? Math.round((totalWins / totalMatches) * 100)
        : 0;

    return {
      totalTournaments: playerTournaments.length,
      totalWins,
      totalLosses,
      winRate,
      bestPlacement,
    };
  }, [playerTournaments]);

  if (!player) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <EmptyState
          icon={Users}
          title="Jogador não encontrado"
          message="Não foi possível carregar o perfil do jogador."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      <button
        onClick={() => navigateTo('/jogadores')}
        className="flex items-center gap-2 text-neutral-400 hover:text-orange-500 transition-colors mb-8 font-bold uppercase tracking-widest text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para a Equipe
      </button>

      <div className="bg-neutral-900 border border-neutral-800 p-8 md:p-12 mb-12 flex flex-col md:flex-row items-center md:items-end gap-8">

        <div className="w-32 h-32 md:w-48 md:h-48 bg-neutral-800 border-2 border-orange-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
          {player.photo ? (
            <img
              src={player.photo}
              alt={player.name}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <Users className="w-16 h-16 text-neutral-600" />
          )}
        </div>

        <div className="flex-grow text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-4">
            {player.name}
          </h1>

          {player.bio && (
            <p className="text-neutral-400 mb-5 max-w-2xl">
              {player.bio}
            </p>
          )}

          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            {player.games.map((game) => (
              <span
                key={game}
                className="text-sm font-bold uppercase tracking-wider px-4 py-2 bg-neutral-950 text-orange-500 border border-orange-500/30"
              >
                {game}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex border-b border-neutral-800 mb-8 overflow-x-auto">
        {['history', 'decks', 'stats'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-4 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {tab === 'history'
              ? 'Histórico de Torneios'
              : tab === 'decks'
              ? 'Decks Ativos'
              : 'Estatísticas'}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">

        {loadingData ? (
          <div className="py-20 text-center text-neutral-500">
            A carregar dados do jogador...
          </div>
        ) : (
          <>

            {/* HISTÓRICO */}
            {activeTab === 'history' && (
              playerTournaments.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title="Histórico de Torneios"
                  message="Nenhum registo competitivo disponível ainda."
                />
              ) : (
                <div className="space-y-4">
                  {playerTournaments.map((tp) => (
                    <div
                      key={tp.id}
                      className="bg-neutral-900 border border-neutral-800 p-5 md:p-6 flex flex-col md:flex-row items-center gap-6 hover:border-orange-500/50 transition-colors"
                    >
                      <div className="w-16 h-16 bg-neutral-800 border border-neutral-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {tp.tournament.image_url ? (
                          <img
                            src={tp.tournament.image_url}
                            alt={tp.tournament.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Trophy className="w-6 h-6 text-neutral-600" />
                        )}
                      </div>

                      <div className="flex-1 text-center md:text-left">
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider">
                          {tp.tournament.name}
                        </h4>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-xs text-neutral-500 uppercase tracking-widest">
                          {tp.tournament.game?.name && (
                            <span className="text-orange-500">
                              {tp.tournament.game.name}
                            </span>
                          )}

                          {tp.tournament.game?.name && (
                            <span>•</span>
                          )}

                          <span>
                            {new Date(
                              `${tp.tournament.tournament_date}T12:00:00`
                            ).toLocaleDateString('pt-BR')}
                          </span>

                          {tp.deck?.name && (
                            <>
                              <span>•</span>
                              <span>
                                Deck: {tp.deck.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 my-4 md:my-0">
                        <div className="text-center min-w-[60px]">
                          <span className="block text-2xl font-black italic text-white">
                            {tp.placement
                              ? `${tp.placement}º`
                              : '-'}
                          </span>

                          <span className="text-[10px] uppercase tracking-widest text-neutral-600">
                            Posição
                          </span>
                        </div>

                        <div className="text-center min-w-[60px]">
                          <span className="block text-lg font-bold">
                            <span className="text-green-400">
                              {tp.wins}V
                            </span>

                            <span className="text-neutral-700 mx-1">
                              /
                            </span>

                            <span className="text-red-400">
                              {tp.losses}D
                            </span>
                          </span>

                          <span className="text-[10px] uppercase tracking-widest text-neutral-600">
                            Placar
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          onOpenTournament(
                            tp.tournament.id
                          )
                        }
                        className="w-full md:w-auto px-6 py-3 border border-neutral-800 text-neutral-400 hover:text-orange-500 hover:border-orange-500/50 text-xs font-bold uppercase tracking-widest transition-colors"
                      >
                        Ver Torneio
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* DECKS */}
            {activeTab === 'decks' && (
              playerDecks.length === 0 ? (
                <EmptyState
                  icon={Swords}
                  title="Decks Registados"
                  message="Nenhuma lista de deck oficial cadastrada no momento."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playerDecks.map((deck) => (
                    <div
                      key={deck.id}
                      className="bg-neutral-900 border border-neutral-800 p-6 hover:border-orange-500 transition-colors flex flex-col h-full"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                            {deck.name}
                          </h3>

                          <p className="text-sm text-neutral-500 mt-1">
                            {deck.game?.name || 'TCG'}
                          </p>
                        </div>

                        <Layers className="text-neutral-600 w-6 h-6 flex-shrink-0" />
                      </div>

                      {deck.format && (
                        <div className="mb-6">
                          <span className="inline-block px-3 py-1 bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                            {deck.format}
                          </span>
                        </div>
                      )}

                      <div className="mt-auto pt-4">
                        {deck.decklist_image_url ? (
                          <button
                            onClick={() =>
                              setDecklistImage(
                                deck.decklist_image_url
                              )
                            }
                            className="w-full py-3 border border-neutral-800 text-neutral-400 hover:text-orange-500 hover:border-orange-500/50 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                          >
                            Ver Decklist
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="w-full py-3 border border-neutral-800/50 text-neutral-600 text-xs font-bold uppercase tracking-widest text-center cursor-not-allowed">
                            Lista não enviada
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ESTATÍSTICAS */}
            {activeTab === 'stats' && (
              playerTournaments.length === 0 ? (
                <EmptyState
                  icon={Gamepad2}
                  title="Estatísticas do Jogador"
                  message="Nenhuma estatística competitiva cadastrada ainda."
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

                  <div className="bg-neutral-900 border border-neutral-800 p-6 text-center hover:border-orange-500/30 transition-colors">
                    <p className="text-3xl md:text-4xl font-black text-white italic">
                      {stats.totalTournaments}
                    </p>

                    <p className="text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest mt-2">
                      Torneios Disputados
                    </p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 p-6 text-center hover:border-orange-500/30 transition-colors">
                    <p className="text-3xl md:text-4xl font-black text-orange-500 italic">
                      {stats.winRate}%
                    </p>

                    <p className="text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest mt-2">
                      Taxa de Vitória
                    </p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 p-6 text-center hover:border-orange-500/30 transition-colors">
                    <p className="text-3xl md:text-4xl font-black text-white italic">
                      <span className="text-green-400">
                        {stats.totalWins}
                      </span>

                      <span className="text-neutral-700 mx-1">
                        -
                      </span>

                      <span className="text-red-400">
                        {stats.totalLosses}
                      </span>
                    </p>

                    <p className="text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest mt-2">
                      Vitórias / Derrotas
                    </p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 p-6 text-center hover:border-orange-500/30 transition-colors">
                    <p className="text-3xl md:text-4xl font-black text-neutral-300 italic">
                      {stats.bestPlacement
                        ? `${stats.bestPlacement}º`
                        : '-'}
                    </p>

                    <p className="text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest mt-2">
                      Melhor Colocação
                    </p>
                  </div>

                </div>
              )
            )}

          </>
        )}
      </div>

      {/* Modal decklist */}
      {decklistImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDecklistImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              onClick={() =>
                setDecklistImage(null)
              }
              className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-orange-500 hover:border-orange-500 transition-colors"
              aria-label="Fechar decklist"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={decklistImage}
              alt="Decklist do Jogador"
              className="max-w-full max-h-[85vh] object-contain border border-neutral-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================
   JOGOS
========================================================= */

const GamesView = ({
  players,
  loading,
}: {
  players: PublicPlayer[];
  loading: boolean;
}) => {

  const games = Array.from(
    new Set(players.flatMap((player) => player.games))
  ).sort();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      <div className="mb-16 border-l-4 border-orange-500 pl-6">
        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider italic">
          Nossos Jogos
        </h2>

        <p className="text-xl text-neutral-400 mt-2">
          Os campos de batalha onde o Torega TCG atua.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-neutral-500">
          Carregando jogos...
        </div>
      ) : games.length === 0 ? (
        <EmptyState
          icon={Gamepad2}
          title="Nenhum jogo"
          message="Nenhum jogo possui jogadores ativos cadastrados."
        />
      ) : (
        <div className="space-y-16">
          {games.map((game) => {

            const gamePlayers = players.filter(
              (player) =>
                player.games.includes(game)
            );

            return (
              <div
                key={game}
                className="bg-neutral-900/50 border border-neutral-800 p-8"
              >
                <h3 className="text-3xl font-black text-white uppercase italic tracking-wide mb-8 flex items-center gap-4">
                  <Gamepad2 className="text-orange-500 w-8 h-8" />

                  {game}

                  <span className="text-sm font-normal text-neutral-500 not-italic tracking-normal bg-neutral-950 px-3 py-1 rounded-full border border-neutral-800">
                    {gamePlayers.length} Jogadores Ativos
                  </span>
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {gamePlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() =>
                        navigateTo(
                          `/jogador/${player.slug}`
                        )
                      }
                      className="cursor-pointer bg-neutral-950 p-4 border border-neutral-800 hover:border-orange-500 transition-colors text-center group"
                    >
                      <p className="font-bold text-sm text-neutral-300 group-hover:text-orange-400 transition-colors">
                        {player.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   TORNEIOS
========================================================= */

const TournamentsView = ({
  onOpenTournament,
}: {
  onOpenTournament: (id: string) => void;
}) => {
  const [tournaments, setTournaments] = useState<
    PublicTournament[]
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTournaments() {
      setLoading(true);

      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          id,
          name,
          tournament_date,
          location,
          description,
          image_url,
          game:games (
            id,
            name
          )
        `)
        .eq('status', 'approved')
        .order('tournament_date', {
          ascending: false,
        });

      if (error) {
        console.error(
          'Erro ao carregar torneios:',
          error
        );

        setTournaments([]);
      } else {
        setTournaments(
          (data || []).map((item: any) => ({
            ...item,
            game: Array.isArray(item.game)
              ? item.game[0] || null
              : item.game || null,
          }))
        );
      }

      setLoading(false);
    }

    loadTournaments();
  }, []);

  function formatDate(date: string) {
    return new Date(
      `${date}T12:00:00`
    ).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      <div className="mb-16 border-l-4 border-orange-500 pl-6">
        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider italic">
          Torneios
        </h2>

        <p className="text-xl text-neutral-400 mt-2">
          O arquivo oficial de competições.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-neutral-500">
          Carregando torneios...
        </div>
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Arquivo de Torneios"
          message="Nenhum torneio registrado ainda. Os próximos eventos competitivos aparecerão aqui."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {tournaments.map((tournament) => (
            <button
              key={tournament.id}
              type="button"
              onClick={() =>
                onOpenTournament(tournament.id)
              }
              className="group text-left bg-neutral-900 border border-neutral-800 hover:border-orange-500 transition-all overflow-hidden"
            >
              <div className="h-52 bg-neutral-800 relative overflow-hidden">

                {tournament.image_url ? (
                  <img
                    src={tournament.image_url}
                    alt={tournament.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Trophy className="w-16 h-16 text-neutral-700 group-hover:text-orange-500/40 transition-colors" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />

                {tournament.game && (
                  <span className="absolute bottom-4 left-4 text-xs font-black uppercase tracking-widest px-3 py-2 bg-orange-600 text-white">
                    {tournament.game.name}
                  </span>
                )}
              </div>

              <div className="p-6">

                <h3 className="text-xl font-black text-white uppercase tracking-wide group-hover:text-orange-400 transition-colors mb-4">
                  {tournament.name}
                </h3>

                <div className="space-y-2 text-sm text-neutral-500">

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span>
                      {formatDate(
                        tournament.tournament_date
                      )}
                    </span>
                  </div>

                  {tournament.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      <span>
                        {tournament.location}
                      </span>
                    </div>
                  )}

                </div>

                <div className="mt-6 flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-widest">
                  Ver torneio

                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>

              </div>
            </button>
          ))}

        </div>
      )}
    </div>
  );
};

/* =========================================================
   DETALHES DO TORNEIO
========================================================= */

const TournamentDetailsView = ({
  tournamentId,
  onBack,
  onOpenPlayer,
}: {
  tournamentId: string;
  onBack: () => void;
  onOpenPlayer: (playerId: string) => void;
}) => {
  const [tournament, setTournament] =
    useState<PublicTournament | null>(null);

  const [participants, setParticipants] =
    useState<TournamentParticipant[]>([]);

  const [matches, setMatches] =
    useState<PublicMatch[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [decklistImage, setDecklistImage] =
    useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<'standings' | 'matches'>(
      'standings'
    );

  useEffect(() => {
    async function loadTournament() {
      setLoading(true);
      setErrorMessage('');

      /* Torneio */
      const {
        data: tournamentData,
        error: tournamentError,
      } = await supabase
        .from('tournaments')
        .select(`
          id,
          name,
          tournament_date,
          location,
          description,
          image_url,
          game:games (
            id,
            name
          )
        `)
        .eq('id', tournamentId)
        .eq('status', 'approved')
        .single();

      if (
        tournamentError ||
        !tournamentData
      ) {
        setTournament(null);
        setParticipants([]);
        setMatches([]);

        setErrorMessage(
          'Não foi possível encontrar este torneio.'
        );

        setLoading(false);
        return;
      }

      const normalizedTournament: PublicTournament = {
        ...tournamentData,
        game: Array.isArray(
          (tournamentData as any).game
        )
          ? (tournamentData as any).game[0] ||
            null
          : (tournamentData as any).game ||
            null,
      };

      setTournament(
        normalizedTournament
      );

      /* Participantes */
      const { data: participantsData } =
        await supabase
          .from('tournament_players')
          .select(`
            id,
            player_id,
            deck_id,
            placement,
            wins,
            losses,
            player:players (
              id,
              name,
              slug,
              photo_url
            ),
            deck:decks (
              id,
              name,
              format,
              image_url,
              decklist_image_url
            )
          `)
          .eq(
            'tournament_id',
            tournamentId
          )
          .order('placement', {
            ascending: true,
            nullsFirst: false,
          });

      setParticipants(
        (participantsData || []).map(
          (item: any) => ({
            ...item,
            player: Array.isArray(
              item.player
            )
              ? item.player[0] || null
              : item.player || null,

            deck: Array.isArray(
              item.deck
            )
              ? item.deck[0] || null
              : item.deck || null,
          })
        )
      );

      /* Partidas */
      const { data: matchesData } =
        await supabase
          .from('matches')
          .select(`
            id,
            round,
            opponent_name,
            opponent_deck,
            result,
            player_score,
            opponent_score,
            tournament_player:tournament_players (
              player:players (
                id,
                name,
                photo_url
              ),
              deck:decks (
                name
              )
            )
          `)
          .eq(
            'tournament_id',
            tournamentId
          )
          .order('round', {
            ascending: true,
          });

      const normalizedMatches =
        (matchesData || []).map(
          (m: any) => {
            const tp = Array.isArray(
              m.tournament_player
            )
              ? m.tournament_player[0]
              : m.tournament_player;

            const player = tp
              ? Array.isArray(tp.player)
                ? tp.player[0]
                : tp.player
              : null;

            const deck = tp
              ? Array.isArray(tp.deck)
                ? tp.deck[0]
                : tp.deck
              : null;

            return {
              ...m,
              tournament_player: tp
                ? {
                    player,
                    deck,
                  }
                : null,
            };
          }
        );

      setMatches(normalizedMatches);
      setLoading(false);
    }

    loadTournament();
  }, [tournamentId]);

  function formatDate(date: string) {
    return new Date(
      `${date}T12:00:00`
    ).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center text-neutral-500">
          Carregando torneio...
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-400 hover:text-orange-500 transition-colors mb-10 font-bold uppercase tracking-widest text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Torneios
        </button>

        <EmptyState
          icon={Trophy}
          title="Torneio não encontrado"
          message={
            errorMessage ||
            'Este torneio não está disponível publicamente.'
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Voltar */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-400 hover:text-orange-500 transition-colors mb-10 font-bold uppercase tracking-widest text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Torneios
        </button>

        {/* Cabeçalho */}
        <div className="relative bg-neutral-900 border border-neutral-800 overflow-hidden mb-12">

          <div className="h-72 md:h-96 bg-neutral-800 relative overflow-hidden">

            {tournament.image_url ? (
              <img
                src={tournament.image_url}
                alt={tournament.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Trophy className="w-24 h-24 text-neutral-700" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />

            {tournament.game && (
              <span className="absolute top-6 left-6 text-xs font-black uppercase tracking-widest px-4 py-2 bg-orange-600 text-white">
                {tournament.game.name}
              </span>
            )}

          </div>

          <div className="relative p-8 md:p-12 -mt-20">

            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-6">
              {tournament.name}
            </h1>

            <div className="flex flex-wrap gap-6 text-sm text-neutral-400 mb-6">

              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                <span>
                  {formatDate(
                    tournament.tournament_date
                  )}
                </span>
              </div>

              {tournament.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <span>
                    {tournament.location}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <span>
                  {participants.length}{' '}
                  {participants.length === 1
                    ? 'participante'
                    : 'participantes'}
                </span>
              </div>

            </div>

            {tournament.description && (
              <p className="text-neutral-400 max-w-3xl leading-relaxed">
                {tournament.description}
              </p>
            )}

          </div>
        </div>

        {/* Abas */}
        <div className="flex border-b border-neutral-800 mb-8 overflow-x-auto">

          <button
            onClick={() =>
              setActiveTab('standings')
            }
            className={`px-8 py-4 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
              activeTab === 'standings'
                ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Classificação Final
          </button>

          <button
            onClick={() =>
              setActiveTab('matches')
            }
            className={`px-8 py-4 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
              activeTab === 'matches'
                ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Histórico de Partidas
          </button>

        </div>

        <div className="animate-fade-in">

          {/* CLASSIFICAÇÃO */}
          {activeTab === 'standings' && (
            <section>

              {participants.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Nenhum participante"
                  message="Nenhum jogador foi registrado neste torneio ainda."
                />
              ) : (
                <div className="border border-neutral-800 bg-neutral-900 overflow-hidden">

                  <div className="hidden md:grid grid-cols-[80px_1fr_220px_140px_120px] gap-4 px-6 py-4 border-b border-neutral-800 bg-neutral-950 text-[10px] font-black uppercase tracking-widest text-neutral-600">
                    <span>Pos.</span>
                    <span>Jogador</span>
                    <span>Deck</span>
                    <span>Resultado</span>
                    <span></span>
                  </div>

                  {participants.map(
                    (participant, index) => (
                      <div
                        key={participant.id}
                        className="grid grid-cols-1 md:grid-cols-[80px_1fr_220px_140px_120px] gap-4 md:gap-4 items-center px-5 md:px-6 py-5 border-b border-neutral-800 last:border-b-0 hover:bg-neutral-800/30 transition-colors"
                      >

                        {/* Colocação */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-2xl font-black italic ${
                              participant.placement === 1
                                ? 'text-orange-400'
                                : participant.placement === 2
                                ? 'text-neutral-300'
                                : participant.placement === 3
                                ? 'text-orange-700'
                                : 'text-neutral-600'
                            }`}
                          >
                            {participant.placement
                              ? `${participant.placement}º`
                              : '—'}
                          </span>

                          {index < 3 &&
                            participant.placement && (
                              <Trophy className="w-4 h-4 text-orange-500" />
                            )}
                        </div>

                        {/* Jogador */}
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              participant.player
                            ) {
                              onOpenPlayer(
                                participant.player.id
                              );
                            }
                          }}
                          disabled={
                            !participant.player
                          }
                          className="flex items-center gap-4 text-left group disabled:cursor-default"
                        >
                          <div className="w-12 h-12 bg-neutral-800 border border-neutral-700 flex-shrink-0 overflow-hidden">

                            {participant.player
                              ?.photo_url ? (
                              <img
                                src={
                                  participant.player
                                    .photo_url
                                }
                                alt={
                                  participant.player
                                    .name
                                }
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-neutral-600" />
                              </div>
                            )}

                          </div>

                          <div>
                            <p className="font-bold text-white group-hover:text-orange-400 transition-colors">
                              {participant.player
                                ?.name ||
                                'Jogador'}
                            </p>

                            <p className="text-xs text-neutral-600 uppercase tracking-wider mt-1">
                              Torega TCG
                            </p>
                          </div>
                        </button>

                        {/* Deck */}
                        <div>
                          {participant.deck ? (
                            <div>

                              <p className="text-sm font-bold text-neutral-200">
                                {participant.deck.name}
                              </p>

                              {participant.deck.format && (
                                <p className="text-xs text-neutral-600 uppercase tracking-wider mt-1">
                                  {participant.deck.format}
                                </p>
                              )}

                              {participant.deck
                                .decklist_image_url && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDecklistImage(
                                      participant
                                        .deck
                                        ?.decklist_image_url ||
                                        null
                                    )
                                  }
                                  className="mt-2 text-[10px] font-bold uppercase tracking-widest text-orange-500 hover:text-orange-400 flex items-center gap-1"
                                >
                                  Ver decklist
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}

                            </div>
                          ) : (
                            <span className="text-sm text-neutral-600">
                              Nenhum deck registrado
                            </span>
                          )}
                        </div>

                        {/* Resultado */}
                        <div>
                          <div className="flex items-center gap-3">

                            <span className="text-sm font-bold text-green-400">
                              {participant.wins}V
                            </span>

                            <span className="text-neutral-700">
                              /
                            </span>

                            <span className="text-sm font-bold text-red-400">
                              {participant.losses}D
                            </span>

                          </div>

                          <p className="text-[10px] uppercase tracking-widest text-neutral-700 mt-1">
                            Resultado
                          </p>
                        </div>

                        {/* Ação */}
                        <div className="flex md:justify-end">

                          {participant.deck
                            ?.decklist_image_url && (
                            <button
                              type="button"
                              onClick={() =>
                                setDecklistImage(
                                  participant
                                    .deck
                                    ?.decklist_image_url ||
                                    null
                                )
                              }
                              className="px-3 py-2 border border-neutral-800 text-neutral-500 hover:text-orange-500 hover:border-orange-500/50 text-[10px] font-bold uppercase tracking-widest transition-colors"
                            >
                              Decklist
                            </button>
                          )}

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </section>
          )}

          {/* PARTIDAS */}
          {activeTab === 'matches' && (
            <section>

              {matches.length === 0 ? (
                <EmptyState
                  icon={Swords}
                  title="Nenhuma Partida"
                  message="O histórico de partidas deste torneio ainda não foi registrado."
                />
              ) : (
                <div className="border border-neutral-800 bg-neutral-900 overflow-hidden">

                  <div className="hidden md:grid grid-cols-[80px_1fr_120px_1fr_100px] gap-6 px-6 py-4 border-b border-neutral-800 bg-neutral-950 text-[10px] font-black uppercase tracking-widest text-neutral-600">
                    <span>Rodada</span>
                    <span className="text-right">
                      Torega TCG
                    </span>
                    <span className="text-center">
                      Placar
                    </span>
                    <span>Adversário</span>
                    <span className="text-right">
                      Resultado
                    </span>
                  </div>

                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className="flex flex-col md:grid md:grid-cols-[80px_1fr_120px_1fr_100px] gap-4 md:gap-6 px-6 py-5 border-b border-neutral-800 last:border-b-0 hover:bg-neutral-800/30 transition-colors items-center"
                    >

                      {/* Rodada */}
                      <div className="w-full md:w-auto text-left">
                        <span className="text-2xl font-black italic text-neutral-600">
                          R{match.round}
                        </span>
                      </div>

                      {/* Torega */}
                      <div className="w-full flex md:justify-end items-center gap-4">

                        <div className="text-left md:text-right flex-1">

                          <p className="font-bold text-white text-lg">
                            {match.tournament_player
                              ?.player?.name ||
                              'Jogador'}
                          </p>

                          <p className="text-[10px] text-orange-500 uppercase tracking-widest mt-1">
                            {match.tournament_player
                              ?.deck?.name ||
                              'Deck Desconhecido'}
                          </p>

                        </div>

                        <div className="hidden md:block w-12 h-12 bg-neutral-800 border border-neutral-700 overflow-hidden shrink-0">

                          {match.tournament_player
                            ?.player
                            ?.photo_url ? (
                            <img
                              src={
                                match
                                  .tournament_player
                                  .player
                                  .photo_url
                              }
                              alt="Jogador"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-neutral-600" />
                            </div>
                          )}

                        </div>

                      </div>

                      {/* Placar */}
                      <div className="w-full md:w-auto flex justify-center items-center py-2 md:py-0 border-y border-neutral-800 md:border-y-0">

                        <div className="text-3xl font-black italic flex gap-3">

                          <span
                            className={
                              match.player_score >=
                              match.opponent_score
                                ? 'text-white'
                                : 'text-neutral-600'
                            }
                          >
                            {match.player_score}
                          </span>

                          <span className="text-neutral-700">
                            -
                          </span>

                          <span
                            className={
                              match.opponent_score >=
                              match.player_score
                                ? 'text-white'
                                : 'text-neutral-600'
                            }
                          >
                            {match.opponent_score}
                          </span>

                        </div>

                      </div>

                      {/* Adversário */}
                      <div className="w-full flex justify-start items-center gap-4">

                        <div className="text-left flex-1">

                          <p className="font-bold text-neutral-300 text-lg">
                            {match.opponent_name}
                          </p>

                          <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">
                            {match.opponent_deck ||
                              'Deck Desconhecido'}
                          </p>

                        </div>

                      </div>

                      {/* Resultado */}
                      <div className="w-full md:w-auto text-left md:text-right mt-2 md:mt-0">

                        {match.result === 'win' ? (
                          <span className="inline-block px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest">
                            Vitória
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest">
                            Derrota
                          </span>
                        )}

                      </div>

                    </div>
                  ))}

                </div>
              )}

            </section>
          )}

        </div>

      </div>

      {/* Modal decklist */}
      {decklistImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() =>
            setDecklistImage(null)
          }
        >
          <div
            className="relative max-w-5xl max-h-[90vh]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              onClick={() =>
                setDecklistImage(null)
              }
              className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-orange-500 hover:border-orange-500 transition-colors"
              aria-label="Fechar decklist"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={decklistImage}
              alt="Decklist"
              className="max-w-full max-h-[85vh] object-contain border border-neutral-800"
            />

          </div>
        </div>
      )}

    </>
  );
};

/* =========================================================
   HISTÓRIA
========================================================= */

const HistoryView = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

    <div className="mb-16 text-center">

      <History className="w-16 h-16 text-orange-500 mx-auto mb-6" />

      <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider italic">
        História do Time
      </h2>

      <p className="text-xl text-neutral-400 mt-4">
        A trajetória do Torega TCG.
      </p>

    </div>

    <EmptyState
      icon={History}
      title="História em construção"
      message="Os acontecimentos históricos do Torega TCG serão registrados aqui."
    />

  </div>
);

/* =========================================================
   NOTÍCIAS
========================================================= */

const NewsView = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

    <div className="mb-16 border-l-4 border-orange-500 pl-6">

      <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider italic">
        Notícias
      </h2>

      <p className="text-xl text-neutral-400 mt-2">
        Acompanhe as últimas novidades e resultados do time.
      </p>

    </div>

    <div className="mt-20">

      <EmptyState
        icon={Newspaper}
        title="Nenhuma Notícia Publicada"
        message="Fique de olho. Anúncios oficiais, coberturas de eventos e resultados serão publicados aqui."
      />

    </div>

  </div>
);

/* =========================================================
   APP
========================================================= */

export default function App() {

  const initialRoute = getRouteFromPathname(
    window.location.pathname
  );

  const [currentView, setCurrentView] =
    useState<View>(initialRoute.view);

  const [activePlayer, setActivePlayer] =
    useState<PublicPlayer | null>(null);

  const [players, setPlayers] =
    useState<PublicPlayer[]>([]);

  const [playersLoading, setPlayersLoading] =
    useState(true);

  const [selectedTournamentId, setSelectedTournamentId] =
    useState<string | null>(
      initialRoute.tournamentId
    );

  const [selectedPlayerSlug, setSelectedPlayerSlug] =
    useState<string | null>(
      initialRoute.playerSlug
    );

  const [adminMode] = useState(
    window.location.pathname === '/admin'
  );

  const [user, setUser] =
    useState<any>(null);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  /* =====================================================
     AUTH
  ===================================================== */

  useEffect(() => {
    async function checkAuth() {
      const currentUser =
        await getCurrentUser();

      setUser(currentUser);
      setCheckingAuth(false);
    }

    checkAuth();
  }, []);

  /* =====================================================
     JOGADORES
  ===================================================== */

  useEffect(() => {
    async function loadPublicPlayers() {

      setPlayersLoading(true);

      const data =
        await getPlayers();

      setPlayers(data);
      setPlayersLoading(false);
    }

    loadPublicPlayers();
  }, []);

  /* =====================================================
     SINCRONIZAÇÃO DA URL
  ===================================================== */

  useEffect(() => {

    function handlePopState() {

      const route =
        getRouteFromPathname(
          window.location.pathname
        );

      setCurrentView(route.view);

      setSelectedTournamentId(
        route.tournamentId
      );

      setSelectedPlayerSlug(
        route.playerSlug
      );

      if (!route.playerSlug) {
        setActivePlayer(null);
      }
    }

    window.addEventListener(
      'popstate',
      handlePopState
    );

    return () => {
      window.removeEventListener(
        'popstate',
        handlePopState
      );
    };

  }, []);

  /* =====================================================
     RESOLVE JOGADOR PELA URL
  ===================================================== */

  useEffect(() => {

    if (!selectedPlayerSlug) {
      setActivePlayer(null);
      return;
    }

    const player =
      players.find(
        (item) =>
          item.slug === selectedPlayerSlug
      );

    setActivePlayer(player || null);

  }, [
    selectedPlayerSlug,
    players,
  ]);

  /* =====================================================
     SCROLL TO TOP
  ===================================================== */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant',
    });
  }, [
    currentView,
    selectedTournamentId,
    selectedPlayerSlug,
  ]);

  /* =====================================================
     NAVEGAÇÃO
  ===================================================== */

  function openTournament(
    tournamentId: string
  ) {
    navigateTo(
      `/torneio/${tournamentId}`
    );
  }

  function backToTournaments() {
    navigateTo('/torneios');
  }

  function openPlayerFromTournament(
    playerId: string
  ) {

    const player =
      players.find(
        (item) =>
          item.id === playerId
      );

    if (!player) {
      return;
    }

    navigateTo(
      `/jogador/${player.slug}`
    );
  }

  /* =====================================================
     ADMIN
  ===================================================== */

  if (adminMode) {

    if (checkingAuth) {
      return (
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <span className="text-sm text-neutral-500">
            Carregando...
          </span>
        </div>
      );
    }

    if (!user) {
      return (
        <AdminLogin
          onLogin={async () => {
            const currentUser =
              await getCurrentUser();

            setUser(currentUser);
          }}
        />
      );
    }

    return (
      <AdminPanel
        onLogout={() => {
          setUser(null);
        }}
      />
    );
  }

  /* =====================================================
     SITE PÚBLICO
  ===================================================== */

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-orange-500/30">

      <Header
        currentView={currentView}
      />

      <main className="min-h-[calc(100vh-160px)]">

        {/* HOME */}
        {currentView === 'home' && (
          <HomeView
            playerCount={
              players.length
            }
          />
        )}

        {/* EQUIPE */}
        {currentView === 'team' && (
          <TeamView
            players={players}
            loading={playersLoading}
          />
        )}

        {/* JOGADOR */}
        {currentView === 'playerDetails' && (
          <PlayerView
            player={activePlayer}
            onOpenTournament={
              openTournament
            }
          />
        )}

        {/* JOGOS */}
        {currentView === 'games' && (
          <GamesView
            players={players}
            loading={playersLoading}
          />
        )}

        {/* TORNEIOS */}
        {currentView === 'tournaments' && (
          <TournamentsView
            onOpenTournament={
              openTournament
            }
          />
        )}

        {/* DETALHES DO TORNEIO */}
        {currentView ===
          'tournamentDetails' &&
          selectedTournamentId && (
            <TournamentDetailsView
              tournamentId={
                selectedTournamentId
              }
              onBack={
                backToTournaments
              }
              onOpenPlayer={
                openPlayerFromTournament
              }
            />
          )}

        {/* HISTÓRIA */}
        {currentView === 'history' && (
          <HistoryView />
        )}

        {/* NOTÍCIAS */}
        {currentView === 'news' && (
          <NewsView />
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-8 mt-12">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">

          <button
            type="button"
            onClick={() =>
              navigateTo('/')
            }
            className="flex items-center gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
          >
            <img
              src="/toregafoto.png"
              alt="Logo do Torega"
              className="w-8 h-8 rounded-full object-cover"
            />

            <span className="font-black text-white tracking-widest uppercase text-sm">
              Torega TCG
            </span>
          </button>

          <p className="text-neutral-600 text-sm font-bold uppercase tracking-wider">
            © {new Date().getFullYear()} Torega TCG. Forjado na Competição.
          </p>

        </div>

      </footer>

    </div>
  );
}