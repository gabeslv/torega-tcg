import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminPanel from './AdminPanel';
import { getCurrentUser } from './lib/auth';
import { getPlayers, PublicPlayer } from './lib/players';
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
} from 'lucide-react';

type View =
  | 'home'
  | 'team'
  | 'playerDetails'
  | 'games'
  | 'tournaments'
  | 'history'
  | 'news';

type IconComponent = React.ComponentType<{ className?: string }>;

const Header = ({
  currentView,
  setView,
}: {
  currentView: View;
  setView: React.Dispatch<React.SetStateAction<View>>;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: { id: View; label: string }[] = [
    { id: 'home', label: 'Início' },
    { id: 'team', label: 'Equipe' },
    { id: 'games', label: 'Jogos' },
    { id: 'tournaments', label: 'Torneios' },
    { id: 'history', label: 'História' },
    { id: 'news', label: 'Notícias' },
  ];

  const handleNavigation = (view: View) => {
    setView(view);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-neutral-950/95 backdrop-blur-md border-b border-orange-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleNavigation('home')}
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
          </div>

          {/* Menu desktop */}
          <nav className="hidden md:flex space-x-6 lg:space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`text-sm font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${
                  currentView === item.id
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
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full text-left px-4 py-4 text-sm font-bold uppercase tracking-widest border-l-2 transition-colors ${
                    currentView === item.id
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

const HomeView = ({
  setView,
  playerCount,
}: {
  setView: React.Dispatch<React.SetStateAction<View>>;
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
          onClick={() => setView('team')}
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

const TeamView = ({
  players,
  loading,
  setView,
  setActivePlayer,
}: {
  players: PublicPlayer[];
  loading: boolean;
  setView: React.Dispatch<React.SetStateAction<View>>;
  setActivePlayer: React.Dispatch<React.SetStateAction<PublicPlayer | null>>;
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
          <div
            key={player.id}
            onClick={() => {
              setActivePlayer(player);
              setView('playerDetails');
            }}
            className="group cursor-pointer relative bg-neutral-900 overflow-hidden border border-neutral-800 hover:border-orange-500 transition-colors"
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
          </div>
        ))}
      </div>
    )}
  </div>
);

const PlayerView = ({
  player,
  setView,
}: {
  player: PublicPlayer | null;
  setView: React.Dispatch<React.SetStateAction<View>>;
}) => {
  const [activeTab, setActiveTab] = useState('history');

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
        onClick={() => setView('team')}
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

        {activeTab === 'history' && (
          <EmptyState
            icon={Trophy}
            title="Histórico de Torneios"
            message="Nenhum registro competitivo disponível ainda."
          />
        )}

        {activeTab === 'decks' && (
          <EmptyState
            icon={Swords}
            title="Decks Registrados"
            message="Nenhuma lista de deck oficial cadastrada no momento."
          />
        )}

        {activeTab === 'stats' && (
          <EmptyState
            icon={Gamepad2}
            title="Estatísticas do Jogador"
            message="Nenhuma estatística competitiva cadastrada ainda."
          />
        )}

      </div>
    </div>
  );
};

const GamesView = ({
  players,
  loading,
  setView,
  setActivePlayer,
}: {
  players: PublicPlayer[];
  loading: boolean;
  setView: React.Dispatch<React.SetStateAction<View>>;
  setActivePlayer: React.Dispatch<React.SetStateAction<PublicPlayer | null>>;
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

            const gamePlayers = players.filter((player) =>
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
                    <div
                      key={player.id}
                      onClick={() => {
                        setActivePlayer(player);
                        setView('playerDetails');
                      }}
                      className="cursor-pointer bg-neutral-950 p-4 border border-neutral-800 hover:border-orange-500 transition-colors text-center group"
                    >
                      <p className="font-bold text-sm text-neutral-300 group-hover:text-orange-400 transition-colors">
                        {player.name}
                      </p>
                    </div>
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

const TournamentsView = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div className="mb-16 border-l-4 border-orange-500 pl-6">
      <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider italic">
        Torneios
      </h2>

      <p className="text-xl text-neutral-400 mt-2">
        O arquivo oficial de competições.
      </p>
    </div>

    <div className="mt-20">
      <EmptyState
        icon={Calendar}
        title="Arquivo de Torneios"
        message="Nenhum torneio registrado ainda. Os próximos eventos competitivos aparecerão aqui."
      />
    </div>
  </div>
);

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

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  const [activePlayer, setActivePlayer] =
    useState<PublicPlayer | null>(null);

  const [players, setPlayers] = useState<PublicPlayer[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);

  const [adminMode] = useState(
    window.location.pathname === '/admin'
  );

  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getCurrentUser();

      setUser(currentUser);
      setCheckingAuth(false);
    }

    checkAuth();
  }, []);

  useEffect(() => {
    async function loadPublicPlayers() {
      setPlayersLoading(true);

      const data = await getPlayers();

      setPlayers(data);
      setPlayersLoading(false);
    }

    loadPublicPlayers();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  /* Área administrativa */
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
            const currentUser = await getCurrentUser();
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

  /* Site público */
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-orange-500/30">

      <Header
        currentView={currentView}
        setView={setCurrentView}
      />

      <main className="min-h-[calc(100vh-160px)]">

        {currentView === 'home' && (
          <HomeView
            setView={setCurrentView}
            playerCount={players.length}
          />
        )}

        {currentView === 'team' && (
          <TeamView
            players={players}
            loading={playersLoading}
            setView={setCurrentView}
            setActivePlayer={setActivePlayer}
          />
        )}

        {currentView === 'playerDetails' && (
          <PlayerView
            player={activePlayer}
            setView={setCurrentView}
          />
        )}

        {currentView === 'games' && (
          <GamesView
            players={players}
            loading={playersLoading}
            setView={setCurrentView}
            setActivePlayer={setActivePlayer}
          />
        )}

        {currentView === 'tournaments' && (
          <TournamentsView />
        )}

        {currentView === 'history' && (
          <HistoryView />
        )}

        {currentView === 'news' && (
          <NewsView />
        )}

      </main>

      <footer className="border-t border-neutral-900 bg-neutral-950 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">

          <div className="flex items-center gap-2 opacity-50 grayscale">
            <img
              src="/toregafoto.png"
              alt="Logo do Torega"
              className="w-8 h-8 rounded-full object-cover"
            />

            <span className="font-black text-white tracking-widest uppercase text-sm">
              Torega TCG
            </span>
          </div>

          <p className="text-neutral-600 text-sm font-bold uppercase tracking-wider">
            © {new Date().getFullYear()} Torega TCG. Forjado na Competição.
          </p>

        </div>
      </footer>

    </div>
  );
}