import { useEffect, useState } from 'react';
import {
  Pencil,
  Plus,
  Users,
  X,
  Upload,
  Trophy,
  Trash2,
  Layers,
  Swords,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { getCurrentProfile, signOut } from './lib/auth';

type Game = {
  id: string;
  name: string;
};

type Player = {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  bio: string | null;
  active: boolean;
  player_games: {
    game: Game | null;
  }[];
};

type Deck = {
  id: string;
  name: string;
  player_id: string;
  game_id: string | null;
  format: string | null;
  description: string | null;
  image_url: string | null;
  status: string;
  decklist_image_url: string | null;
};

type Tournament = {
  id: string;
  name: string;
  game_id: string;
  tournament_date: string;
  location: string | null;
  description: string | null;
  image_url: string | null;
  proof_image_url: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  game: Game | null;
};

type TournamentParticipant = {
  id: string;
  tournament_id: string;
  player_id: string;
  deck_id: string | null;
  placement: number | null;
  wins: number;
  losses: number;
  player: Player | null;
  deck: Deck | null;
};

type TournamentMatch = {
  id: string;
  tournament_id: string;
  tournament_player_id: string;
  round: number;
  opponent_name: string;
  opponent_deck: string | null;
  result: 'win' | 'loss';
  player_score: number;
  opponent_score: number;
  tournament_player: {
    id: string;
    player_id: string;
    deck_id: string | null;
    player: {
      id: string;
      name: string;
      slug: string;
      photo_url: string | null;
    } | null;
    deck: {
      id: string;
      name: string;
    } | null;
  } | null;
};

type Profile = {
  id: string;
  player_id: string | null;
  role: string;
  display_name: string | null;
};

type AdminPanelProps = {
  onLogout: () => void;
};

export default function AdminPanel({
  onLogout,
}: AdminPanelProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [currentProfile, setCurrentProfile] =
    useState<Profile | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  const [activeSection, setActiveSection] = useState<
    'players' | 'tournaments'
  >('tournaments');

  /*
   * =========================
   * JOGADORES
   * =========================
   */

  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [savingPlayer, setSavingPlayer] = useState(false);

  const [editingPlayer, setEditingPlayer] =
    useState<Player | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [active, setActive] = useState(true);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] =
    useState<string | null>(null);

  /*
   * =========================
   * TORNEIOS
   * =========================
   */

  const [showTournamentForm, setShowTournamentForm] =
    useState(false);

  const [savingTournament, setSavingTournament] =
    useState(false);

  const [editingTournament, setEditingTournament] =
    useState<Tournament | null>(null);

  const [tournamentName, setTournamentName] = useState('');
  const [tournamentGameId, setTournamentGameId] =
    useState('');

  const [tournamentDate, setTournamentDate] =
    useState('');

  const [tournamentLocation, setTournamentLocation] =
    useState('');

  const [tournamentDescription, setTournamentDescription] =
    useState('');

  const [tournamentStatus, setTournamentStatus] =
    useState('pending');

  const [tournamentImageFile, setTournamentImageFile] =
    useState<File | null>(null);

  const [tournamentImagePreview, setTournamentImagePreview] =
    useState<string | null>(null);

  /*
   * =========================
   * MODAL DO TORNEIO (UI STATE)
   * =========================
   */

  const [showParticipants, setShowParticipants] =
    useState(false);
    
  const [tournamentModalTab, setTournamentModalTab] = 
    useState<'participants' | 'matches'>('participants');

  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);

  /*
   * =========================
   * PARTICIPANTES
   * =========================
   */

  const [participants, setParticipants] =
    useState<TournamentParticipant[]>([]);

  const [loadingParticipants, setLoadingParticipants] =
    useState(false);

  const [showParticipantForm, setShowParticipantForm] =
    useState(false);

  const [savingParticipant, setSavingParticipant] =
    useState(false);

  const [editingParticipant, setEditingParticipant] =
    useState<TournamentParticipant | null>(null);

  const [participantPlayerId, setParticipantPlayerId] =
    useState('');

  const [participantDeckId, setParticipantDeckId] =
    useState('');

  const [participantPlacement, setParticipantPlacement] =
    useState('');

  const [participantWins, setParticipantWins] =
    useState('0');

  const [participantLosses, setParticipantLosses] =
    useState('0');

  const [playerDecks, setPlayerDecks] =
    useState<Deck[]>([]);

  const [loadingDecks, setLoadingDecks] =
    useState(false);

  /*
   * =========================
   * NOVO DECK
   * =========================
   */

  const [showDeckForm, setShowDeckForm] = useState(false);
  const [savingDeck, setSavingDeck] = useState(false);

  const [deckName, setDeckName] = useState('');

  const [decklistImageFile, setDecklistImageFile] =
    useState<File | null>(null);

  const [decklistImagePreview, setDecklistImagePreview] =
    useState<string | null>(null);

  /*
   * =========================
   * PARTIDAS (MATCHES)
   * =========================
   */

  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [savingMatch, setSavingMatch] = useState(false);
  const [editingMatch, setEditingMatch] = useState<TournamentMatch | null>(null);

  const [matchParticipantId, setMatchParticipantId] = useState('');
  const [matchRound, setMatchRound] = useState('1');
  const [matchOpponentName, setMatchOpponentName] = useState('');
  const [matchOpponentDeck, setMatchOpponentDeck] = useState('');
  const [matchResult, setMatchResult] = useState<'win' | 'loss'>('win');
  const [matchPlayerScore, setMatchPlayerScore] = useState('2');
  const [matchOpponentScore, setMatchOpponentScore] = useState('0');

  useEffect(() => {
    checkAccess();
  }, []);

  /*
   * =========================
   * DECK SELECIONADO & PARTICIPANTE SELECIONADO NA PARTIDA
   * =========================
   */

  const selectedDeck =
    playerDecks.find(
      (deck) => deck.id === participantDeckId
    ) || null;

  const matchSelectedParticipant = participants.find(
    (p) => p.id === matchParticipantId
  ) || null;

  /*
   * =========================
   * ACESSO
   * =========================
   */

  async function checkAccess() {
    const profile = await getCurrentProfile();

    if (!profile) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    const profileData: Profile = {
      id: profile.id,
      player_id: profile.player_id ?? null,
      role: profile.role,
      display_name: profile.display_name ?? null,
    };

    const admin = profileData.role === 'admin';

    setCurrentProfile(profileData);
    setIsAdmin(admin);
    setAuthorized(true);

    await loadGames();
    await loadPlayers();
    await loadTournaments();

    setLoading(false);
  }

  /*
   * =========================
   * JOGADORES - LOAD
   * =========================
   */

  async function loadPlayers() {
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
      .order('name');

    if (error) {
      console.error(
        'Erro ao carregar jogadores:',
        error
      );
      return;
    }

    const normalized = (data || []).map(
      (player: any) => ({
        ...player,
        player_games: (player.player_games || []).map(
          (item: any) => ({
            game: Array.isArray(item.game)
              ? item.game[0] || null
              : item.game || null,
          })
        ),
      })
    );

    setPlayers(
      normalized as Player[]
    );
  }

  /*
   * =========================
   * JOGOS - LOAD
   * =========================
   */

  async function loadGames() {
    const { data, error } = await supabase
      .from('games')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Erro ao carregar jogos:', error);
      return;
    }

    setGames(data || []);
  }

  /*
   * =========================
   * TORNEIOS - LOAD
   * =========================
   */

  async function loadTournaments() {
    const query = supabase
      .from('tournaments')
      .select(`
        id,
        name,
        game_id,
        tournament_date,
        location,
        description,
        image_url,
        proof_image_url,
        status,
        created_by,
        created_at,
        updated_at,
        game:games (
          id,
          name
        )
      `)
      .order('tournament_date', {
        ascending: false,
      });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao carregar torneios:', error);
      return;
    }

    const normalized = (data || []).map(
      (item: any) => ({
        ...item,
        game: Array.isArray(item.game)
          ? item.game[0] || null
          : item.game || null,
      })
    );

    setTournaments(
      normalized as Tournament[]
    );
  }

  /*
   * =========================
   * JOGADORES - FORM
   * =========================
   */

  function resetPlayerForm() {
    setName('');
    setSlug('');
    setBio('');
    setActive(true);
    setSelectedGames([]);
    setEditingPlayer(null);
    setPhotoFile(null);

    if (
      photoPreview &&
      photoPreview.startsWith('blob:')
    ) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
  }

  function openNewPlayerForm() {
    resetPlayerForm();
    setShowPlayerForm(true);
  }

  function openEditPlayerForm(player: Player) {
    setEditingPlayer(player);
    setName(player.name);
    setSlug(player.slug);
    setBio(player.bio || '');
    setActive(player.active);

    const playerGameIds =
      player.player_games
        ?.map(({ game }) => game?.id)
        .filter((id): id is string => Boolean(id));

    setSelectedGames(playerGameIds || []);
    setPhotoFile(null);
    setPhotoPreview(player.photo_url);
    setShowPlayerForm(true);
  }

  function closePlayerForm() {
    if (savingPlayer) return;
    setShowPlayerForm(false);
    resetPlayerForm();
  }

  function toggleGame(gameId: string) {
    setSelectedGames((current) =>
      current.includes(gameId)
        ? current.filter((id) => id !== gameId)
        : [...current, gameId]
    );
  }

  function generateSlug(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function handleNameChange(value: string) {
    setName(value);
    if (
      !editingPlayer &&
      (!slug || slug === generateSlug(name))
    ) {
      setSlug(generateSlug(value));
    }
  }

  function handlePhotoChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5 MB.');
      return;
    }

    if (
      photoPreview &&
      photoPreview.startsWith('blob:')
    ) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPlayerPhoto(playerId: string) {
    if (!photoFile) return null;

    const extension =
      photoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${playerId}/profile.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('players')
      .upload(filePath, photoFile, {
        upsert: true,
        contentType: photoFile.type,
      });

    if (uploadError) {
      console.error('Erro ao enviar foto:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from('players')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleCreatePlayer() {
    if (!name.trim() || !slug.trim()) {
      alert('Informe o nome e o slug do jogador.');
      return;
    }

    setSavingPlayer(true);

    try {
      const {
        data: player,
        error: playerError,
      } = await supabase
        .from('players')
        .insert({
          name: name.trim(),
          slug: slug.trim(),
          bio: bio.trim() || null,
          active,
        })
        .select('id')
        .single();

      if (playerError) {
        console.error('Erro ao criar jogador:', playerError);
        alert(playerError.message);
        return;
      }

      if (photoFile) {
        try {
          const photoUrl = await uploadPlayerPhoto(player.id);
          const { error: photoError } = await supabase
            .from('players')
            .update({ photo_url: photoUrl })
            .eq('id', player.id);

          if (photoError) throw new Error(photoError.message);
        } catch (error) {
          console.error('Erro ao salvar foto:', error);
          await supabase.from('players').delete().eq('id', player.id);
          alert(
            error instanceof Error
              ? error.message
              : 'Não foi possível enviar a foto.'
          );
          return;
        }
      }

      if (selectedGames.length > 0) {
        const playerGames = selectedGames.map((gameId) => ({
          player_id: player.id,
          game_id: gameId,
        }));

        const { error: gamesError } = await supabase
          .from('player_games')
          .insert(playerGames);

        if (gamesError) {
          console.error('Erro ao associar jogos:', gamesError);
          await supabase.from('players').delete().eq('id', player.id);
          alert(gamesError.message);
          return;
        }
      }

      await loadPlayers();
      closePlayerForm();
    } catch (error) {
      console.error('Erro inesperado:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro ao cadastrar o jogador.'
      );
    } finally {
      setSavingPlayer(false);
    }
  }

  async function handleUpdatePlayer() {
    if (!editingPlayer || !name.trim() || !slug.trim()) return;

    setSavingPlayer(true);

    try {
      let photoUrl = editingPlayer.photo_url;

      if (photoFile) {
        photoUrl = await uploadPlayerPhoto(editingPlayer.id);
      }

      const { error: playerError } = await supabase
        .from('players')
        .update({
          name: name.trim(),
          slug: slug.trim(),
          bio: bio.trim() || null,
          active,
          photo_url: photoUrl,
        })
        .eq('id', editingPlayer.id);

      if (playerError) {
        console.error('Erro ao atualizar jogador:', playerError);
        alert(playerError.message);
        return;
      }

      const { error: deleteGamesError } = await supabase
        .from('player_games')
        .delete()
        .eq('player_id', editingPlayer.id);

      if (deleteGamesError) {
        console.error('Erro ao atualizar jogos:', deleteGamesError);
        alert(deleteGamesError.message);
        return;
      }

      if (selectedGames.length > 0) {
        const playerGames = selectedGames.map((gameId) => ({
          player_id: editingPlayer.id,
          game_id: gameId,
        }));

        const { error: insertGamesError } = await supabase
          .from('player_games')
          .insert(playerGames);

        if (insertGamesError) {
          console.error('Erro ao associar novos jogos:', insertGamesError);
          alert(insertGamesError.message);
          return;
        }
      }

      await loadPlayers();
      closePlayerForm();
    } catch (error) {
      console.error('Erro inesperado:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro ao atualizar o jogador.'
      );
    } finally {
      setSavingPlayer(false);
    }
  }

  async function handleSavePlayer() {
    if (editingPlayer) {
      await handleUpdatePlayer();
    } else {
      await handleCreatePlayer();
    }
  }

  /*
   * =========================
   * TORNEIOS - RESET
   * =========================
   */

  function resetTournamentForm() {
    setTournamentName('');
    setTournamentGameId('');
    setTournamentDate('');
    setTournamentLocation('');
    setTournamentDescription('');
    setTournamentStatus('pending');
    setEditingTournament(null);
    setTournamentImageFile(null);

    if (
      tournamentImagePreview &&
      tournamentImagePreview.startsWith('blob:')
    ) {
      URL.revokeObjectURL(tournamentImagePreview);
    }
    setTournamentImagePreview(null);
  }

  function openNewTournamentForm() {
    resetTournamentForm();
    if (games.length > 0) {
      setTournamentGameId(games[0].id);
    }
    setShowTournamentForm(true);
  }

  function openEditTournamentForm(tournament: Tournament) {
    setEditingTournament(tournament);
    setTournamentName(tournament.name);
    setTournamentGameId(tournament.game_id);
    setTournamentDate(tournament.tournament_date);
    setTournamentLocation(tournament.location || '');
    setTournamentDescription(tournament.description || '');
    setTournamentStatus(tournament.status);
    setTournamentImageFile(null);
    setTournamentImagePreview(tournament.image_url);
    setShowTournamentForm(true);
  }

  function closeTournamentForm() {
    if (savingTournament) return;
    setShowTournamentForm(false);
    resetTournamentForm();
  }

  function handleTournamentImageChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5 MB.');
      return;
    }

    if (
      tournamentImagePreview &&
      tournamentImagePreview.startsWith('blob:')
    ) {
      URL.revokeObjectURL(tournamentImagePreview);
    }

    setTournamentImageFile(file);
    setTournamentImagePreview(URL.createObjectURL(file));
  }

  async function uploadTournamentImage(tournamentId: string) {
    if (!tournamentImageFile) return null;

    const extension =
      tournamentImageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${tournamentId}/cover.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('tournaments')
      .upload(filePath, tournamentImageFile, {
        upsert: true,
        contentType: tournamentImageFile.type,
      });

    if (uploadError) {
      console.error('Erro ao enviar imagem do torneio:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from('tournaments')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleCreateTournament() {
    if (!tournamentName.trim() || !tournamentGameId || !tournamentDate) {
      alert('Preencha os campos obrigatórios do torneio.');
      return;
    }

    if (!currentProfile) {
      alert('Usuário não identificado.');
      return;
    }

    setSavingTournament(true);

    try {
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
          name: tournamentName.trim(),
          game_id: tournamentGameId,
          tournament_date: tournamentDate,
          location: tournamentLocation.trim() || null,
          description: tournamentDescription.trim() || null,
          status: isAdmin ? tournamentStatus : 'pending',
          created_by: currentProfile.id,
        })
        .select('id')
        .single();

      if (tournamentError) {
        console.error('Erro ao criar torneio:', tournamentError);
        alert(tournamentError.message);
        return;
      }

      if (tournamentImageFile) {
        try {
          const imageUrl = await uploadTournamentImage(tournament.id);
          const { error: imageError } = await supabase
            .from('tournaments')
            .update({ image_url: imageUrl })
            .eq('id', tournament.id);

          if (imageError) throw new Error(imageError.message);
        } catch (error) {
          console.error('Erro ao salvar imagem:', error);
          await supabase.from('tournaments').delete().eq('id', tournament.id);
          alert(
            error instanceof Error
              ? error.message
              : 'Não foi possível enviar a imagem.'
          );
          return;
        }
      }

      await loadTournaments();
      closeTournamentForm();

      alert(
        isAdmin
          ? 'Torneio criado com sucesso.'
          : 'Torneio enviado para aprovação.'
      );
    } catch (error) {
      console.error('Erro inesperado:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro ao criar o torneio.'
      );
    } finally {
      setSavingTournament(false);
    }
  }

  async function handleUpdateTournament() {
    if (!editingTournament || !tournamentName.trim() || !tournamentGameId || !tournamentDate) {
      return;
    }

    setSavingTournament(true);

    try {
      let imageUrl = editingTournament.image_url;

      if (tournamentImageFile) {
        imageUrl = await uploadTournamentImage(editingTournament.id);
      }

      const nextStatus = isAdmin ? tournamentStatus : 'pending';

      const { error } = await supabase
        .from('tournaments')
        .update({
          name: tournamentName.trim(),
          game_id: tournamentGameId,
          tournament_date: tournamentDate,
          location: tournamentLocation.trim() || null,
          description: tournamentDescription.trim() || null,
          image_url: imageUrl,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTournament.id);

      if (error) {
        console.error('Erro ao atualizar torneio:', error);
        alert(error.message);
        return;
      }

      await loadTournaments();
      closeTournamentForm();

      alert(
        isAdmin
          ? 'Torneio atualizado com sucesso.'
          : 'Torneio atualizado e enviado novamente para aprovação.'
      );
    } catch (error) {
      console.error('Erro inesperado:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro ao atualizar o torneio.'
      );
    } finally {
      setSavingTournament(false);
    }
  }

  async function handleSaveTournament() {
    if (editingTournament) {
      await handleUpdateTournament();
    } else {
      await handleCreateTournament();
    }
  }

  async function handleDeleteTournament(tournament: Tournament) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o torneio "${tournament.name}"?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournament.id);

    if (error) {
      console.error('Erro ao excluir torneio:', error);
      alert(error.message);
      return;
    }

    await loadTournaments();
  }

  /*
   * =========================
   * PARTICIPANTES - LOAD
   * =========================
   */

  async function loadParticipants(tournamentId: string) {
    setLoadingParticipants(true);

    const { data, error } = await supabase
      .from('tournament_players')
      .select(`
        id,
        tournament_id,
        player_id,
        deck_id,
        placement,
        wins,
        losses,
        player:players (
          id,
          name,
          slug,
          photo_url,
          bio,
          active
        ),
        deck:decks (
          id,
          name,
          player_id,
          game_id,
          format,
          description,
          image_url,
          status,
          decklist_image_url
        )
      `)
      .eq('tournament_id', tournamentId);

    if (error) {
      console.error('Erro ao carregar participantes:', error);
      alert(error.message);
      setParticipants([]);
      setLoadingParticipants(false);
      return;
    }

    const normalized = (data || []).map((item: any) => ({
      ...item,
      player: Array.isArray(item.player)
        ? item.player[0] || null
        : item.player || null,
      deck: Array.isArray(item.deck)
        ? item.deck[0] || null
        : item.deck || null,
    }));

    setParticipants(normalized as TournamentParticipant[]);
    setLoadingParticipants(false);
  }

  /*
   * =========================
   * PARTIDAS - LOAD
   * =========================
   */

  async function loadMatches(tournamentId: string) {
    setLoadingMatches(true);

    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        tournament_id,
        tournament_player_id,
        round,
        opponent_name,
        opponent_deck,
        result,
        player_score,
        opponent_score,
        tournament_player:tournament_players (
          id,
          player_id,
          deck_id,
          player:players (
            id,
            name,
            slug,
            photo_url
          ),
          deck:decks (
            id,
            name
          )
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true });

    if (error) {
      console.error('Erro ao carregar partidas:', error);
      setMatches([]);
      setLoadingMatches(false);
      return;
    }

    const normalized = (data || []).map((item: any) => {
      const tp = Array.isArray(item.tournament_player)
        ? item.tournament_player[0]
        : item.tournament_player;
        
      const p = tp ? (Array.isArray(tp.player) ? tp.player[0] : tp.player) : null;
      const d = tp ? (Array.isArray(tp.deck) ? tp.deck[0] : tp.deck) : null;

      return {
        ...item,
        tournament_player: tp
          ? {
              ...tp,
              player: p,
              deck: d,
            }
          : null,
      };
    });

    setMatches(normalized as TournamentMatch[]);
    setLoadingMatches(false);
  }

  /*
   * =========================
   * ABRIR MODAL DO TORNEIO
   * =========================
   */

  async function openParticipants(tournament: Tournament) {
    setSelectedTournament(tournament);
    setShowParticipants(true);
    setTournamentModalTab('participants');
    setShowParticipantForm(false);
    setShowMatchForm(false);
    setEditingParticipant(null);
    setEditingMatch(null);

    await loadParticipants(tournament.id);
    await loadMatches(tournament.id);
  }

  function closeParticipants() {
    if (savingParticipant || savingMatch) return;

    setShowParticipants(false);
    setSelectedTournament(null);
    
    setParticipants([]);
    setShowParticipantForm(false);
    setEditingParticipant(null);
    setParticipantPlayerId('');
    setParticipantDeckId('');
    setPlayerDecks([]);
    
    setMatches([]);
    setShowMatchForm(false);
    setEditingMatch(null);

    closeDeckForm();
  }

  /*
   * =========================
   * DECKS - LOAD
   * =========================
   */

  async function loadPlayerDecks(playerId: string) {
    if (!playerId) {
      setPlayerDecks([]);
      return;
    }

    setLoadingDecks(true);

    let query = supabase
      .from('decks')
      .select(`
        id,
        name,
        player_id,
        game_id,
        format,
        description,
        image_url,
        status,
        decklist_image_url
      `)
      .eq('player_id', playerId);

    if (selectedTournament?.game_id) {
      query = query.eq('game_id', selectedTournament.game_id);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Erro ao carregar decks:', error);
      setPlayerDecks([]);
      setLoadingDecks(false);
      return;
    }

    setPlayerDecks((data || []) as Deck[]);
    setLoadingDecks(false);
  }

  /*
   * =========================
   * NOVO DECK - FORM
   * =========================
   */

  function resetDeckForm() {
    setDeckName('');
    setDecklistImageFile(null);

    if (
      decklistImagePreview &&
      decklistImagePreview.startsWith('blob:')
    ) {
      URL.revokeObjectURL(decklistImagePreview);
    }

    setDecklistImagePreview(null);
  }

  function closeDeckForm() {
    if (savingDeck) return;

    setShowDeckForm(false);
    resetDeckForm();
  }

  function openNewDeckForm() {
    resetDeckForm();
    setShowDeckForm(true);
  }

  function handleDecklistImageChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem da decklist deve ter no máximo 10 MB.');
      return;
    }

    if (
      decklistImagePreview &&
      decklistImagePreview.startsWith('blob:')
    ) {
      URL.revokeObjectURL(decklistImagePreview);
    }

    setDecklistImageFile(file);
    setDecklistImagePreview(URL.createObjectURL(file));
  }

  async function uploadDecklistImage(deckId: string) {
    if (!decklistImageFile) return null;

    const extension =
      decklistImageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${deckId}/decklist.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('decks')
      .upload(filePath, decklistImageFile, {
        upsert: true,
        contentType: decklistImageFile.type,
      });

    if (uploadError) {
      console.error('Erro ao enviar decklist:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from('decks')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleCreateDeck() {
    if (!selectedTournament || !participantPlayerId || !deckName.trim() || !decklistImageFile) {
      alert('Preencha os campos obrigatórios do deck e envie a imagem.');
      return;
    }

    if (!isAdmin && currentProfile?.player_id !== participantPlayerId) {
      alert('Você só pode criar um deck para o seu próprio jogador.');
      return;
    }

    setSavingDeck(true);

    try {
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .insert({
          player_id: participantPlayerId,
          game_id: selectedTournament.game_id,
          name: deckName.trim(),
          status: 'published',
        })
        .select('id')
        .single();

      if (deckError) {
        console.error('Erro ao criar deck:', deckError);
        alert(deckError.message);
        return;
      }

      try {
        const decklistUrl = await uploadDecklistImage(deck.id);
        const { error: updateError } = await supabase
          .from('decks')
          .update({ decklist_image_url: decklistUrl })
          .eq('id', deck.id);

        if (updateError) throw new Error(updateError.message);
      } catch (error) {
        await supabase.from('decks').delete().eq('id', deck.id);
        alert(
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar a decklist.'
        );
        return;
      }

      await loadPlayerDecks(participantPlayerId);
      setParticipantDeckId(deck.id);
      closeDeckForm();
    } catch (error) {
      console.error('Erro inesperado ao criar deck:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro ao criar o deck.'
      );
    } finally {
      setSavingDeck(false);
    }
  }

  /*
   * =========================
   * NOVO PARTICIPANTE
   * =========================
   */

  function resetParticipantForm() {
    setEditingParticipant(null);
    setParticipantPlayerId('');
    setParticipantDeckId('');
    setParticipantPlacement('');
    setParticipantWins('0');
    setParticipantLosses('0');
    setPlayerDecks([]);
  }

  function openNewParticipantForm() {
    resetParticipantForm();

    if (!isAdmin && currentProfile?.player_id) {
      setParticipantPlayerId(currentProfile.player_id);
      loadPlayerDecks(currentProfile.player_id);
    }

    setShowParticipantForm(true);
  }

  function openEditParticipantForm(participant: TournamentParticipant) {
    setEditingParticipant(participant);
    setParticipantPlayerId(participant.player_id);
    setParticipantDeckId(participant.deck_id || '');
    setParticipantPlacement(
      participant.placement !== null ? String(participant.placement) : ''
    );
    setParticipantWins(String(participant.wins ?? 0));
    setParticipantLosses(String(participant.losses ?? 0));
    loadPlayerDecks(participant.player_id);
    setShowParticipantForm(true);
  }

  function handleParticipantPlayerChange(playerId: string) {
    setParticipantPlayerId(playerId);
    setParticipantDeckId('');

    if (playerId) {
      loadPlayerDecks(playerId);
    } else {
      setPlayerDecks([]);
    }
  }

  async function handleSaveParticipant() {
    if (!selectedTournament || !participantPlayerId || !participantDeckId) {
      alert('Selecione o jogador e o deck.');
      return;
    }

    const wins = Number(participantWins);
    const losses = Number(participantLosses);
    const placement =
      participantPlacement.trim() === '' ? null : Number(participantPlacement);

    if (!Number.isInteger(wins) || wins < 0) {
      alert('Informe um número válido de vitórias.');
      return;
    }

    if (!Number.isInteger(losses) || losses < 0) {
      alert('Informe um número válido de derrotas.');
      return;
    }

    if (placement !== null && (!Number.isInteger(placement) || placement < 1)) {
      alert('A colocação deve ser um número maior que zero.');
      return;
    }

    setSavingParticipant(true);

    try {
      if (!isAdmin && currentProfile?.player_id !== participantPlayerId) {
        alert('Você só pode adicionar o seu próprio jogador.');
        return;
      }

      const existingQuery = await supabase
        .from('tournament_players')
        .select('id')
        .eq('tournament_id', selectedTournament.id)
        .eq('player_id', participantPlayerId)
        .maybeSingle();

      if (existingQuery.error) {
        console.error('Erro ao verificar participante:', existingQuery.error);
        alert(existingQuery.error.message);
        return;
      }

      if (
        existingQuery.data &&
        (!editingParticipant || existingQuery.data.id !== editingParticipant.id)
      ) {
        alert('Este jogador já está cadastrado neste torneio.');
        return;
      }

      const participantData = {
        player_id: participantPlayerId,
        deck_id: participantDeckId,
        placement,
        wins,
        losses,
      };

      if (editingParticipant) {
        const { error } = await supabase
          .from('tournament_players')
          .update(participantData)
          .eq('id', editingParticipant.id);

        if (error) {
          console.error('Erro ao atualizar participante:', error);
          alert(error.message);
          return;
        }
      } else {
        const { error } = await supabase
          .from('tournament_players')
          .insert({
            tournament_id: selectedTournament.id,
            ...participantData,
          });

        if (error) {
          console.error('Erro ao adicionar participante:', error);
          alert(error.message);
          return;
        }
      }

      await loadParticipants(selectedTournament.id);
      setShowParticipantForm(false);
      resetParticipantForm();

      alert(
        editingParticipant
          ? 'Participante atualizado.'
          : 'Participante adicionado ao torneio.'
      );
    } catch (error) {
      console.error('Erro inesperado:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro ao salvar o participante.'
      );
    } finally {
      setSavingParticipant(false);
    }
  }

  async function handleDeleteParticipant(participant: TournamentParticipant) {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      `Remover ${participant.player?.name || 'este jogador'} do torneio?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('tournament_players')
      .delete()
      .eq('id', participant.id);

    if (error) {
      console.error('Erro ao remover participante:', error);
      alert(error.message);
      return;
    }

    if (selectedTournament) {
      await loadParticipants(selectedTournament.id);
      // Se remover participante, remover também as partidas dele caso a deleção não seja em cascata (mas o schema pede CASCADE).
      // Porém, recarregar as partidas para refletir a interface.
      await loadMatches(selectedTournament.id); 
    }
  }

  /*
   * =========================
   * PARTIDAS - FORM
   * =========================
   */

  function resetMatchForm() {
    setEditingMatch(null);
    setMatchParticipantId('');
    setMatchRound('1');
    setMatchOpponentName('');
    setMatchOpponentDeck('');
    setMatchResult('win');
    setMatchPlayerScore('2');
    setMatchOpponentScore('0');
  }

  function openNewMatchForm() {
    resetMatchForm();
    // Se o usuário não for admin e tiver participado do torneio, pré-seleciona ele
    if (!isAdmin && currentProfile?.player_id) {
      const myParticipation = participants.find(
        (p) => p.player_id === currentProfile?.player_id
      );
      if (myParticipation) {
        setMatchParticipantId(myParticipation.id);
      }
    }
    setShowMatchForm(true);
  }

  function openEditMatchForm(match: TournamentMatch) {
    setEditingMatch(match);
    setMatchParticipantId(match.tournament_player_id);
    setMatchRound(String(match.round));
    setMatchOpponentName(match.opponent_name);
    setMatchOpponentDeck(match.opponent_deck || '');
    setMatchResult(match.result);
    setMatchPlayerScore(String(match.player_score));
    setMatchOpponentScore(String(match.opponent_score));
    setShowMatchForm(true);
  }

  async function handleSaveMatch() {
    if (!selectedTournament || !matchParticipantId) {
      alert('Selecione o participante do Torega TCG.');
      return;
    }

    const roundNum = Number(matchRound);
    if (!Number.isInteger(roundNum) || roundNum < 1) {
      alert('A rodada deve ser um número inteiro positivo.');
      return;
    }

    if (!matchOpponentName.trim()) {
      alert('Informe o nome do adversário.');
      return;
    }

    const pScore = Number(matchPlayerScore);
    const oScore = Number(matchOpponentScore);

    if (!Number.isInteger(pScore) || pScore < 0 || !Number.isInteger(oScore) || oScore < 0) {
      alert('O placar deve conter números válidos a partir de zero.');
      return;
    }

    setSavingMatch(true);

    try {
      const selectedParticipantRecord = participants.find(
        (p) => p.id === matchParticipantId
      );

      // Bloqueio de segurança: jogador não-admin editando partida de outro jogador
      if (
        !isAdmin &&
        selectedParticipantRecord?.player_id !== currentProfile?.player_id
      ) {
        alert('Você só pode cadastrar partidas para a sua própria participação.');
        return;
      }

      const matchData = {
        tournament_id: selectedTournament.id,
        tournament_player_id: matchParticipantId,
        round: roundNum,
        opponent_name: matchOpponentName.trim(),
        opponent_deck: matchOpponentDeck.trim() || null,
        result: matchResult,
        player_score: pScore,
        opponent_score: oScore,
      };

      if (editingMatch) {
        const { error } = await supabase
          .from('matches')
          .update({ ...matchData, updated_at: new Date().toISOString() })
          .eq('id', editingMatch.id);

        if (error) {
          console.error('Erro ao atualizar partida:', error);
          alert(error.message);
          return;
        }
      } else {
        const { error } = await supabase
          .from('matches')
          .insert(matchData);

        if (error) {
          console.error('Erro ao cadastrar partida:', error);
          alert(error.message);
          return;
        }
      }

      await loadMatches(selectedTournament.id);
      setShowMatchForm(false);
      resetMatchForm();

      alert(editingMatch ? 'Partida atualizada.' : 'Partida registrada com sucesso.');
    } catch (error) {
      console.error('Erro inesperado:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro ao salvar a partida.'
      );
    } finally {
      setSavingMatch(false);
    }
  }

  async function handleDeleteMatch(match: TournamentMatch) {
    // Apenas Admin ou o dono da partida podem excluir
    if (
      !isAdmin &&
      match.tournament_player?.player_id !== currentProfile?.player_id
    ) {
      alert('Você só pode excluir suas próprias partidas.');
      return;
    }

    const confirmed = window.confirm(
      `Excluir a partida da rodada ${match.round} contra ${match.opponent_name}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', match.id);

    if (error) {
      console.error('Erro ao excluir partida:', error);
      alert(error.message);
      return;
    }

    if (selectedTournament) {
      await loadMatches(selectedTournament.id);
    }
  }

  /*
   * =========================
   * LOGOUT
   * =========================
   */

  async function handleLogout() {
    await signOut();
    onLogout();
  }

  /*
   * =========================
   * STATUS
   * =========================
   */

  function getStatusLabel(status: string) {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return 'Pendente';
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  }

  /*
   * =========================
   * LOADING
   * =========================
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <span className="text-sm text-neutral-500">
          Carregando painel...
        </span>
      </div>
    );
  }

  /*
   * =========================
   * ACESSO NEGADO
   * =========================
   */

  if (!authorized) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">
            Acesso negado
          </h1>
          <p className="text-neutral-500 mt-2">
            Você não possui permissão para acessar esta área.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 border border-white/10 px-5 py-3 text-sm hover:bg-white/5"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  /*
   * =========================
   * PAINEL PRINCIPAL
   * =========================
   */

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">

      {/* HEADER */}
      <header className="border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/toregafoto.png"
              alt="Torega TCG"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                Torega TCG
              </p>
              <h1 className="text-xl font-semibold text-white">
                Administração
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {currentProfile?.display_name && (
              <div className="hidden sm:block text-right">
                <p className="text-sm text-white">
                  {currentProfile.display_name}
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  {isAdmin ? 'Administrador' : 'Jogador'}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="border border-neutral-800 px-4 py-2 text-sm hover:bg-white/5"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* NAVEGAÇÃO */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-900 mb-8 sm:mb-10">
          <button
            onClick={() => setActiveSection('tournaments')}
            className={`px-5 py-3 text-sm border-b-2 ${
              activeSection === 'tournaments'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Trophy size={16} />
              Torneios
            </span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveSection('players')}
              className={`px-5 py-3 text-sm border-b-2 ${
                activeSection === 'players'
                  ? 'border-white text-white'
                  : 'border-transparent text-neutral-500 hover:text-white'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Users size={16} />
                Jogadores
              </span>
            </button>
          )}
        </div>

        {/* =========================
            JOGADORES
        ========================= */}

        {activeSection === 'players' && isAdmin && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Users size={20} className="text-neutral-400" />
                  <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    Gerenciamento
                  </span>
                </div>
                <h2 className="text-3xl font-semibold text-white">
                  Jogadores
                </h2>
                <p className="text-neutral-500 mt-2">
                  Gerencie os jogadores cadastrados no Torega TCG.
                </p>
              </div>

              <button
                onClick={openNewPlayerForm}
                className="inline-flex items-center justify-center gap-2 bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-neutral-200"
              >
                <Plus size={17} />
                Novo jogador
              </button>
            </div>

            <div className="border border-neutral-900 overflow-hidden">
              <div className="grid grid-cols-[1fr_220px_100px] gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 bg-white/[0.03] border-b border-neutral-900 text-xs uppercase tracking-wider text-neutral-500">
                <span>Jogador</span>
                <span>Jogos</span>
                <span>Status</span>
              </div>

              {players.map((player) => (
                <div
                  key={player.id}
                  className="grid grid-cols-[1fr_220px_100px] gap-3 sm:gap-4 px-4 sm:px-5 py-4 sm:py-5 border-b border-neutral-900 last:border-b-0 items-center"
                >
                  <div className="flex items-center gap-4">
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
                        <Users size={18} />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">
                        {player.name}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        {player.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {player.player_games?.map(({ game }) => {
                      if (!game) return null;
                      return (
                        <span
                          key={game.id}
                          className="text-xs border border-neutral-800 px-2 py-1 text-neutral-400"
                        >
                          {game.name}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-xs ${
                        player.active ? 'text-green-400' : 'text-neutral-600'
                      }`}
                    >
                      {player.active ? 'Ativo' : 'Inativo'}
                    </span>
                    <button
                      onClick={() => openEditPlayerForm(player)}
                      className="text-neutral-500 hover:text-white"
                      title="Editar jogador"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {players.length === 0 && (
                <div className="px-6 py-16 text-center text-neutral-500">
                  Nenhum jogador cadastrado.
                </div>
              )}
            </div>
          </section>
        )}

        {/* =========================
            TORNEIOS
        ========================= */}

        {activeSection === 'tournaments' && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Trophy size={20} className="text-neutral-400" />
                  <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    Competitivo
                  </span>
                </div>
                <h2 className="text-3xl font-semibold text-white">
                  {isAdmin ? 'Torneios' : 'Meus torneios'}
                </h2>
                <p className="text-neutral-500 mt-2">
                  {isAdmin
                    ? 'Gerencie os torneios cadastrados no Torega TCG.'
                    : 'Cadastre e acompanhe os torneios enviados por você.'}
                </p>
              </div>

              <button
                onClick={openNewTournamentForm}
                className="inline-flex items-center justify-center gap-2 bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-neutral-200"
              >
                <Plus size={17} />
                Novo torneio
              </button>
            </div>

            <div className="border border-neutral-900 overflow-hidden">
              <div className="grid grid-cols-[1fr_160px_140px_170px] gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 bg-white/[0.03] border-b border-neutral-900 text-xs uppercase tracking-wider text-neutral-500">
                <span>Torneio</span>
                <span>Jogo</span>
                <span>Data</span>
                <span>Status</span>
              </div>

              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="grid grid-cols-[1fr_160px_140px_170px] gap-3 sm:gap-4 px-4 sm:px-5 py-4 sm:py-5 border-b border-neutral-900 last:border-b-0 items-center"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {tournament.image_url ? (
                      <img
                        src={tournament.image_url}
                        alt={tournament.name}
                        className="w-14 h-14 object-cover border border-neutral-800 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 shrink-0">
                        <Trophy size={20} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">
                        {tournament.name}
                      </p>
                      {tournament.location && (
                        <p className="text-xs text-neutral-600 mt-1 truncate">
                          {tournament.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-sm text-neutral-400">
                    {tournament.game?.name || '—'}
                  </span>

                  <span className="text-sm text-neutral-400">
                    {new Date(`${tournament.tournament_date}T00:00:00`).toLocaleDateString('pt-BR')}
                  </span>

                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-xs ${getStatusClass(tournament.status)}`}>
                      {getStatusLabel(tournament.status)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openParticipants(tournament)}
                        className="text-neutral-500 hover:text-white"
                        title="Detalhes e Participantes"
                      >
                        <Users size={15} />
                      </button>
                      <button
                        onClick={() => openEditTournamentForm(tournament)}
                        className="text-neutral-500 hover:text-white"
                        title="Editar torneio"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteTournament(tournament)}
                        className="text-neutral-600 hover:text-red-400"
                        title="Excluir torneio"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {tournaments.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <Trophy size={28} className="mx-auto text-neutral-700" />
                  <p className="text-neutral-500 mt-4">
                    Nenhum torneio cadastrado.
                  </p>
                  <p className="text-xs text-neutral-700 mt-2">
                    Cadastre o primeiro torneio do Torega TCG.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* =========================
          FORMULÁRIO JOGADOR
      ========================= */}

      {showPlayerForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-900">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Jogadores</p>
                <h3 className="text-xl font-semibold text-white mt-1">
                  {editingPlayer ? 'Editar jogador' : 'Novo jogador'}
                </h3>
              </div>
              <button
                onClick={closePlayerForm}
                disabled={savingPlayer}
                className="text-neutral-500 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm text-neutral-400 mb-3">Foto do jogador</label>
                <div className="flex items-center gap-5">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Users size={28} className="text-neutral-600" />
                    )}
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2 border border-neutral-800 px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-white/5 cursor-pointer">
                      <Upload size={16} /> Escolher foto
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handlePhotoChange(event.target.files?.[0] || null)}
                      />
                    </label>
                    <p className="text-xs text-neutral-600 mt-2">JPG, PNG ou WEBP · máximo 5 MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="Ex.: Gabriel Abreu"
                  className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="gabriel-abreu"
                  className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                />
                <p className="text-xs text-neutral-600 mt-2">Usado na URL do perfil do jogador.</p>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Breve descrição do jogador..."
                  rows={4}
                  className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-3">Jogos</label>
                <div className="grid grid-cols-2 gap-3">
                  {games.map((game) => {
                    const selected = selectedGames.includes(game.id);
                    return (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => toggleGame(game.id)}
                        className={`text-left px-4 py-3 border transition ${
                          selected
                            ? 'border-white bg-white text-black'
                            : 'border-neutral-800 bg-black text-neutral-400 hover:border-neutral-600'
                        }`}
                      >
                        {game.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between border border-neutral-900 px-4 py-4">
                <div>
                  <p className="text-sm text-white">Jogador ativo</p>
                  <p className="text-xs text-neutral-600 mt-1">
                    Jogadores inativos não aparecem como integrantes ativos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`relative w-11 h-6 transition ${active ? 'bg-white' : 'bg-neutral-800'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 transition ${active ? 'left-6 bg-black' : 'left-1 bg-neutral-500'}`} />
                </button>
              </div>

              <div className="flex justify-end gap-3 px-6 py-5 border-t border-neutral-900">
                <button
                  onClick={closePlayerForm}
                  disabled={savingPlayer}
                  className="border border-neutral-800 px-5 py-3 text-sm text-neutral-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePlayer}
                  disabled={savingPlayer}
                  className="bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50"
                >
                  {savingPlayer ? 'Salvando...' : editingPlayer ? 'Salvar alterações' : 'Cadastrar jogador'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          FORMULÁRIO TORNEIO
      ========================= */}

      {showTournamentForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-900">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Torneios</p>
                <h3 className="text-xl font-semibold text-white mt-1">
                  {editingTournament ? 'Editar torneio' : 'Novo torneio'}
                </h3>
              </div>
              <button
                onClick={closeTournamentForm}
                disabled={savingTournament}
                className="text-neutral-500 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm text-neutral-400 mb-3">Imagem do torneio</label>
                <div className="space-y-4">
                  <div className="w-full h-48 bg-black border border-neutral-800 overflow-hidden flex items-center justify-center">
                    {tournamentImagePreview ? (
                      <img src={tournamentImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Trophy size={36} className="text-neutral-700" />
                    )}
                  </div>
                  <label className="inline-flex items-center gap-2 border border-neutral-800 px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-white/5 cursor-pointer">
                    <Upload size={16} /> Escolher imagem
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleTournamentImageChange(event.target.files?.[0] || null)}
                    />
                  </label>
                  <p className="text-xs text-neutral-600">JPG, PNG ou WEBP · máximo 5 MB</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">Nome do torneio</label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(event) => setTournamentName(event.target.value)}
                  placeholder="Ex.: Torneio Torega TCG"
                  className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">Jogo</label>
                <select
                  value={tournamentGameId}
                  onChange={(event) => setTournamentGameId(event.target.value)}
                  className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                >
                  <option value="">Selecione o jogo</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>{game.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">Data</label>
                <input
                  type="date"
                  value={tournamentDate}
                  onChange={(event) => setTournamentDate(event.target.value)}
                  className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">Local</label>
                <input
                  type="text"
                  value={tournamentLocation}
                  onChange={(event) => setTournamentLocation(event.target.value)}
                  placeholder="Ex.: Manaus, AM"
                  className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">Descrição</label>
                <textarea
                  value={tournamentDescription}
                  onChange={(event) => setTournamentDescription(event.target.value)}
                  placeholder="Informações sobre o torneio..."
                  rows={5}
                  className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500 resize-none"
                />
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Status</label>
                  <select
                    value={tournamentStatus}
                    onChange={(event) => setTournamentStatus(event.target.value)}
                    className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                  >
                    <option value="pending">Pendente</option>
                    <option value="approved">Aprovado</option>
                    <option value="rejected">Rejeitado</option>
                  </select>
                </div>
              )}

              {!isAdmin && (
                <div className="border border-yellow-900/40 bg-yellow-950/20 px-4 py-4">
                  <p className="text-sm text-yellow-400">Este torneio será enviado para aprovação.</p>
                  <p className="text-xs text-neutral-600 mt-1">Após o envio, um administrador precisará aprovar o torneio para que ele apareça publicamente no site.</p>
                </div>
              )}

              <div className="flex justify-end gap-3 px-6 py-5 border-t border-neutral-900">
                <button
                  onClick={closeTournamentForm}
                  disabled={savingTournament}
                  className="border border-neutral-800 px-5 py-3 text-sm text-neutral-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTournament}
                  disabled={savingTournament}
                  className="bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50"
                >
                  {savingTournament ? 'Salvando...' : editingTournament ? 'Salvar alterações' : 'Cadastrar torneio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          MODAL DE PARTICIPANTES E PARTIDAS
      ========================= */}

      {showParticipants && selectedTournament && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-neutral-950 border border-neutral-800 flex flex-col">
            
            {/* HEADER DO MODAL */}
            <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-neutral-900 bg-neutral-950">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Detalhes do Torneio</p>
                <h3 className="text-xl font-semibold text-white mt-1">{selectedTournament.name}</h3>
              </div>
              <button
                onClick={closeParticipants}
                className="text-neutral-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* ABAS (TABS) */}
            <div className="shrink-0 flex px-6 border-b border-neutral-900 bg-neutral-950/50">
              <button
                onClick={() => setTournamentModalTab('participants')}
                className={`px-4 py-4 text-sm font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                  tournamentModalTab === 'participants'
                    ? 'border-white text-white'
                    : 'border-transparent text-neutral-500 hover:text-white hover:border-neutral-600'
                }`}
              >
                Participantes
              </button>
              <button
                onClick={() => setTournamentModalTab('matches')}
                className={`px-4 py-4 text-sm font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                  tournamentModalTab === 'matches'
                    ? 'border-white text-white'
                    : 'border-transparent text-neutral-500 hover:text-white hover:border-neutral-600'
                }`}
              >
                Partidas (Histórico)
              </button>
            </div>

            {/* ÁREA ROLÁVEL COM CONTEÚDO */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* === ABA: PARTICIPANTES === */}
              {tournamentModalTab === 'participants' && (
                <div className="animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <p className="text-sm text-white">Participantes</p>
                      <p className="text-xs text-neutral-600 mt-1">Registre somente os jogadores da Torega que participaram.</p>
                    </div>
                    <button
                      onClick={openNewParticipantForm}
                      className="inline-flex items-center justify-center gap-2 bg-white text-black px-4 py-3 text-sm font-semibold hover:bg-neutral-200"
                    >
                      <Plus size={16} /> Adicionar jogador
                    </button>
                  </div>

                  {loadingParticipants ? (
                    <div className="py-16 text-center text-neutral-600">Carregando participantes...</div>
                  ) : participants.length === 0 ? (
                    <div className="border border-neutral-900 py-16 text-center">
                      <Users size={28} className="mx-auto text-neutral-700" />
                      <p className="text-neutral-500 mt-4">Nenhum jogador adicionado.</p>
                      <p className="text-xs text-neutral-700 mt-2">Adicione os jogadores da Torega que participaram deste torneio.</p>
                    </div>
                  ) : (
                    <div className="border border-neutral-900 overflow-hidden">
                      <div className="grid grid-cols-[1fr_1fr_180px_100px] gap-4 px-5 py-4 bg-white/[0.03] border-b border-neutral-900 text-xs uppercase tracking-wider text-neutral-500">
                        <span>Jogador</span>
                        <span>Deck usado</span>
                        <span>Resultado</span>
                        <span>Ações</span>
                      </div>
                      {participants.map((participant) => (
                        <div key={participant.id} className="grid grid-cols-[1fr_1fr_180px_100px] gap-4 px-5 py-5 border-b border-neutral-900 last:border-b-0 items-center">
                          <div className="flex items-center gap-4 min-w-0">
                            {participant.player?.photo_url ? (
                              <img
                                src={participant.player.photo_url}
                                alt={participant.player.name}
                                className="w-10 h-10 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                                <Users size={16} className="text-neutral-600" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {participant.player?.name || 'Jogador'}
                              </p>
                              <p className="text-xs text-neutral-600 mt-1 truncate">Participante</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <Layers size={15} className="text-neutral-600 shrink-0" />
                            <span className="text-sm text-neutral-400 truncate">
                              {participant.deck?.name || 'Nenhum deck'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-white">
                                {participant.placement ? `${participant.placement}º` : '-'}
                              </span>
                              <span className="text-xs text-green-400">{participant.wins}V</span>
                              <span className="text-xs text-red-400">{participant.losses}D</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-700">Resultado</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openEditParticipantForm(participant)}
                              className="text-neutral-500 hover:text-white"
                              title="Editar participante"
                            >
                              <Pencil size={15} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteParticipant(participant)}
                                className="text-neutral-600 hover:text-red-400"
                                title="Remover participante"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* === ABA: PARTIDAS === */}
              {tournamentModalTab === 'matches' && (
                <div className="animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <p className="text-sm text-white">Histórico de Partidas</p>
                      <p className="text-xs text-neutral-600 mt-1">Registre os confrontos individuais dos jogadores da Torega neste torneio.</p>
                    </div>
                    <button
                      onClick={openNewMatchForm}
                      disabled={participants.length === 0}
                      className="inline-flex items-center justify-center gap-2 bg-white text-black px-4 py-3 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} /> Adicionar partida
                    </button>
                  </div>

                  {participants.length === 0 && (
                    <div className="mb-4 border border-yellow-900/40 bg-yellow-950/20 px-4 py-3 text-xs text-yellow-400">
                      Adicione participantes na aba "Participantes" antes de registrar partidas.
                    </div>
                  )}

                  {loadingMatches ? (
                    <div className="py-16 text-center text-neutral-600">Carregando histórico...</div>
                  ) : matches.length === 0 ? (
                    <div className="border border-neutral-900 py-16 text-center">
                      <Swords size={28} className="mx-auto text-neutral-700" />
                      <p className="text-neutral-500 mt-4">Nenhuma partida registrada.</p>
                      <p className="text-xs text-neutral-700 mt-2">Clique no botão acima para adicionar um resultado.</p>
                    </div>
                  ) : (
                    <div className="border border-neutral-900 overflow-hidden">
                      <div className="grid grid-cols-[80px_1fr_120px_1fr_100px_100px] gap-4 px-5 py-4 bg-white/[0.03] border-b border-neutral-900 text-xs uppercase tracking-wider text-neutral-500">
                        <span>Rodada</span>
                        <span>Jogador (Torega)</span>
                        <span className="text-center">Placar</span>
                        <span>Adversário</span>
                        <span>Resultado</span>
                        <span>Ações</span>
                      </div>
                      {matches.map((match) => (
                        <div key={match.id} className="grid grid-cols-[80px_1fr_120px_1fr_100px_100px] gap-4 px-5 py-5 border-b border-neutral-900 last:border-b-0 items-center">
                          <span className="text-sm font-bold text-white">R{match.round}</span>
                          
                          {/* Jogador Torega */}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {match.tournament_player?.player?.name || 'Desconhecido'}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1 truncate">
                              Deck: {match.tournament_player?.deck?.name || 'Não informado'}
                            </p>
                          </div>

                          {/* Placar */}
                          <div className="text-center font-mono text-lg font-bold">
                            <span className={match.player_score >= match.opponent_score ? 'text-white' : 'text-neutral-500'}>
                              {match.player_score}
                            </span>
                            <span className="text-neutral-700 mx-2">×</span>
                            <span className={match.opponent_score >= match.player_score ? 'text-white' : 'text-neutral-500'}>
                              {match.opponent_score}
                            </span>
                          </div>

                          {/* Adversário */}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-neutral-300 truncate">
                              {match.opponent_name}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1 truncate">
                              Deck: {match.opponent_deck || 'Desconhecido'}
                            </p>
                          </div>

                          {/* Resultado */}
                          <div>
                            {match.result === 'win' ? (
                              <span className="inline-block px-2 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-widest">
                                Vitória
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                                Derrota
                              </span>
                            )}
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-3">
                            {/* Verifica permissão para editar/excluir (Admin ou dono) */}
                            {(isAdmin || currentProfile?.player_id === match.tournament_player?.player_id) && (
                              <>
                                <button
                                  onClick={() => openEditMatchForm(match)}
                                  className="text-neutral-500 hover:text-white"
                                  title="Editar partida"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMatch(match)}
                                  className="text-neutral-600 hover:text-red-400"
                                  title="Excluir partida"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================
          FORMULÁRIO PARTICIPANTE
      ========================= */}

      {showParticipantForm && selectedTournament && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-900">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Participante</p>
                <h3 className="text-xl font-semibold text-white mt-1">
                  {editingParticipant ? 'Editar participante' : 'Adicionar jogador'}
                </h3>
              </div>
              <button
                onClick={() => {
                  if (savingParticipant) return;
                  setShowParticipantForm(false);
                  resetParticipantForm();
                }}
                disabled={savingParticipant}
                className="text-neutral-500 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* JOGADOR */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Jogador</label>
                {isAdmin ? (
                  <select
                    value={participantPlayerId}
                    onChange={(event) => handleParticipantPlayerChange(event.target.value)}
                    className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                  >
                    <option value="">Selecione o jogador</option>
                    {players
                      .filter((player) => player.active)
                      .map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <div className="w-full bg-black border border-neutral-800 px-4 py-3 text-white">
                    {players.find((player) => player.id === currentProfile?.player_id)?.name ||
                      currentProfile?.display_name ||
                      'Seu jogador'}
                  </div>
                )}
              </div>

              {/* DECK */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Deck usado no torneio</label>
                <div className="flex gap-3">
                  <select
                    value={participantDeckId}
                    onChange={(event) => setParticipantDeckId(event.target.value)}
                    disabled={!participantPlayerId || loadingDecks}
                    className="flex-1 min-w-0 bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500 disabled:opacity-50"
                  >
                    <option value="">
                      {loadingDecks ? 'Carregando decks...' : 'Selecione o deck'}
                    </option>
                    {playerDecks.map((deck) => (
                      <option key={deck.id} value={deck.id}>
                        {deck.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={openNewDeckForm}
                    disabled={!participantPlayerId || savingParticipant}
                    className="shrink-0 inline-flex items-center justify-center gap-2 border border-neutral-800 px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} /> Novo deck
                  </button>
                </div>

                {!loadingDecks && participantPlayerId && playerDecks.length === 0 && (
                  <div className="mt-3 border border-neutral-900 bg-white/[0.02] px-4 py-4">
                    <p className="text-sm text-white">Nenhum deck cadastrado para este jogo.</p>
                    <p className="text-xs text-neutral-600 mt-1">Crie o deck usado pelo jogador neste torneio.</p>
                    <button
                      type="button"
                      onClick={openNewDeckForm}
                      className="mt-3 inline-flex items-center gap-2 text-xs text-white hover:text-neutral-300"
                    >
                      <Plus size={14} /> Criar primeiro deck
                    </button>
                  </div>
                )}

                {selectedDeck?.decklist_image_url && (
                  <div className="mt-4 border border-neutral-900 bg-black overflow-hidden">
                    <div className="px-4 py-3 border-b border-neutral-900">
                      <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">Decklist</p>
                    </div>
                    <img
                      src={selectedDeck.decklist_image_url}
                      alt={`Decklist ${selectedDeck.name}`}
                      className="w-full h-auto max-h-[520px] object-contain"
                    />
                  </div>
                )}
              </div>

              {/* RESULTADO */}
              <div>
                <label className="block text-sm text-neutral-400 mb-3">Resultado</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-600 mb-2">Colocação</label>
                    <input
                      type="number"
                      min="1"
                      value={participantPlacement}
                      onChange={(event) => setParticipantPlacement(event.target.value)}
                      placeholder="Ex.: 1"
                      className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-2">Vitórias</label>
                    <input
                      type="number"
                      min="0"
                      value={participantWins}
                      onChange={(event) => setParticipantWins(event.target.value)}
                      className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-2">Derrotas</label>
                    <input
                      type="number"
                      min="0"
                      value={participantLosses}
                      onChange={(event) => setParticipantLosses(event.target.value)}
                      className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-600 mt-2">A colocação é opcional. Vitórias e derrotas começam em 0.</p>
              </div>

              <div className="border border-neutral-900 bg-white/[0.02] px-4 py-4">
                <p className="text-sm text-white">{editingParticipant ? 'Atualizando participação' : 'Registrando participação'}</p>
                <p className="text-xs text-neutral-600 mt-1">O deck selecionado ficará registrado especificamente para este torneio.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-5 border-t border-neutral-900">
              <button
                onClick={() => {
                  if (savingParticipant) return;
                  setShowParticipantForm(false);
                  resetParticipantForm();
                }}
                disabled={savingParticipant}
                className="border border-neutral-800 px-5 py-3 text-sm text-neutral-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveParticipant}
                disabled={savingParticipant || !participantPlayerId || !participantDeckId}
                className="bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50"
              >
                {savingParticipant ? 'Salvando...' : editingParticipant ? 'Salvar alterações' : 'Adicionar participante'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          FORMULÁRIO NOVO DECK
      ========================= */}

      {showDeckForm && selectedTournament && participantPlayerId && (
        <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-sm flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-900">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Deck</p>
                <h3 className="text-xl font-semibold text-white mt-1">Novo deck</h3>
                <p className="text-xs text-neutral-600 mt-2">{selectedTournament.game?.name || 'Jogo do torneio'}</p>
              </div>
              <button
                onClick={closeDeckForm}
                disabled={savingDeck}
                className="text-neutral-500 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Nome do deck</label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(event) => setDeckName(event.target.value)}
                  placeholder="Ex.: Luffy"
                  className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-3">Decklist</label>
                <div className="w-full min-h-64 bg-black border border-neutral-800 overflow-hidden flex items-center justify-center">
                  {decklistImagePreview ? (
                    <img
                      src={decklistImagePreview}
                      alt="Preview da decklist"
                      className="w-full h-auto max-h-[520px] object-contain"
                    />
                  ) : (
                    <div className="py-20 text-center">
                      <Layers size={36} className="mx-auto text-neutral-700" />
                      <p className="text-sm text-neutral-500 mt-4">Envie a foto da decklist</p>
                      <p className="text-xs text-neutral-700 mt-2">A imagem será salva no perfil do jogador.</p>
                    </div>
                  )}
                </div>
                <label className="mt-4 inline-flex items-center gap-2 border border-neutral-800 px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-white/5 cursor-pointer">
                  <Upload size={16} /> Escolher foto
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => handleDecklistImageChange(event.target.files?.[0] || null)}
                  />
                </label>
                <p className="text-xs text-neutral-600 mt-2">JPG, PNG ou WEBP · máximo 10 MB</p>
              </div>

              <div className="border border-neutral-900 bg-white/[0.02] px-4 py-4">
                <p className="text-sm text-white">Jogo: {selectedTournament.game?.name || '—'}</p>
                <p className="text-sm text-white mt-1">
                  Jogador: {players.find((player) => player.id === participantPlayerId)?.name || currentProfile?.display_name || '—'}
                </p>
                <p className="text-xs text-neutral-600 mt-2">
                  O jogo é definido automaticamente pelo torneio. O deck ficará disponível no perfil do jogador e poderá ser reutilizado em outros torneios do mesmo jogo.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-5 border-t border-neutral-900">
              <button
                onClick={closeDeckForm}
                disabled={savingDeck}
                className="border border-neutral-800 px-5 py-3 text-sm text-neutral-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateDeck}
                disabled={savingDeck || !deckName.trim() || !decklistImageFile}
                className="bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50"
              >
                {savingDeck ? 'Salvando...' : 'Criar deck'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          FORMULÁRIO PARTIDA (MATCH)
      ========================= */}

      {showMatchForm && selectedTournament && (
        <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-sm flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-900">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Histórico de Partidas</p>
                <h3 className="text-xl font-semibold text-white mt-1">
                  {editingMatch ? 'Editar partida' : 'Nova partida'}
                </h3>
              </div>
              <button
                onClick={() => {
                  if (savingMatch) return;
                  setShowMatchForm(false);
                  resetMatchForm();
                }}
                disabled={savingMatch}
                className="text-neutral-500 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* LADO DO TOREGA */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Jogador (Participante)</label>
                  <select
                    value={matchParticipantId}
                    onChange={(e) => setMatchParticipantId(e.target.value)}
                    disabled={editingMatch !== null} // Bloquear mudança de jogador na edição
                    className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500 disabled:opacity-50"
                  >
                    <option value="">Selecione quem jogou</option>
                    {participants.map((p) => {
                      // Bloqueio de UI para não-admins
                      if (!isAdmin && currentProfile?.player_id !== p.player_id) {
                        return null;
                      }
                      return (
                        <option key={p.id} value={p.id}>
                          {p.player?.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                {matchSelectedParticipant && (
                  <div className="border border-neutral-900 bg-white/[0.02] px-4 py-3 flex items-center gap-3">
                    <Layers size={16} className="text-neutral-500" />
                    <div>
                      <p className="text-xs text-neutral-500">Deck usado</p>
                      <p className="text-sm text-white font-semibold">{matchSelectedParticipant.deck?.name || 'Nenhum deck cadastrado'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* RODADA E OPONENTE */}
              <div className="grid grid-cols-3 gap-4 border-t border-neutral-900 pt-6">
                <div className="col-span-1">
                  <label className="block text-sm text-neutral-400 mb-2">Rodada</label>
                  <input
                    type="number"
                    min="1"
                    value={matchRound}
                    onChange={(e) => setMatchRound(e.target.value)}
                    className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-neutral-400 mb-2">Adversário</label>
                  <input
                    type="text"
                    value={matchOpponentName}
                    onChange={(e) => setMatchOpponentName(e.target.value)}
                    placeholder="Nome do adversário..."
                    className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">Deck do Adversário (Opcional)</label>
                <input
                  type="text"
                  value={matchOpponentDeck}
                  onChange={(e) => setMatchOpponentDeck(e.target.value)}
                  placeholder="Deck do adversário..."
                  className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                />
              </div>

              {/* RESULTADO E PLACAR */}
              <div className="border-t border-neutral-900 pt-6 space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Resultado Final</label>
                  <select
                    value={matchResult}
                    onChange={(e) => setMatchResult(e.target.value as 'win' | 'loss')}
                    className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                  >
                    <option value="win">Vitória</option>
                    <option value="loss">Derrota</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">Vitórias do Torega</label>
                    <input
                      type="number"
                      min="0"
                      value={matchPlayerScore}
                      onChange={(e) => setMatchPlayerScore(e.target.value)}
                      className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">Vitórias do Adversário</label>
                    <input
                      type="number"
                      min="0"
                      value={matchOpponentScore}
                      onChange={(e) => setMatchOpponentScore(e.target.value)}
                      className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500 font-mono text-center"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3 px-6 py-5 border-t border-neutral-900">
              <button
                onClick={() => {
                  if (savingMatch) return;
                  setShowMatchForm(false);
                  resetMatchForm();
                }}
                disabled={savingMatch}
                className="border border-neutral-800 px-5 py-3 text-sm text-neutral-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMatch}
                disabled={savingMatch || !matchParticipantId || !matchOpponentName.trim()}
                className="bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50"
              >
                {savingMatch ? 'Salvando...' : editingMatch ? 'Salvar partida' : 'Adicionar partida'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}