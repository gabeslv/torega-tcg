import { useEffect, useState } from 'react';
import { Pencil, Plus, Users, X, Upload } from 'lucide-react';
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

type AdminPanelProps = {
  onLogout: () => void;
};

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [active, setActive] = useState(true);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const profile = await getCurrentProfile();

    if (!profile || profile.role !== 'admin') {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);

    await Promise.all([
      loadPlayers(),
      loadGames(),
    ]);
  }

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
      console.error('Erro ao carregar jogadores:', error);
      setLoading(false);
      return;
    }

    setPlayers((data as unknown as Player[]) || []);
    setLoading(false);
  }

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

  function resetForm() {
    setName('');
    setSlug('');
    setBio('');
    setActive(true);
    setSelectedGames([]);
    setEditingPlayer(null);

    setPhotoFile(null);

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoPreview(null);
  }

  function openNewPlayerForm() {
    resetForm();
    setShowPlayerForm(true);
  }

  function openEditPlayerForm(player: Player) {
    setEditingPlayer(player);

    setName(player.name);
    setSlug(player.slug);
    setBio(player.bio || '');
    setActive(player.active);

    const playerGameIds = player.player_games
      ?.map(({ game }) => game?.id)
      .filter((id): id is string => Boolean(id));

    setSelectedGames(playerGameIds || []);

    setPhotoFile(null);
    setPhotoPreview(player.photo_url);

    setShowPlayerForm(true);
  }

  function closePlayerForm() {
    if (saving) return;

    setShowPlayerForm(false);
    resetForm();
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

    if (!editingPlayer && (!slug || slug === generateSlug(name))) {
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

    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPlayerPhoto(playerId: string) {
    if (!photoFile) {
      return null;
    }

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
    if (!name.trim()) {
      alert('Informe o nome do jogador.');
      return;
    }

    if (!slug.trim()) {
      alert('Informe o slug do jogador.');
      return;
    }

    setSaving(true);

    try {
      const { data: player, error: playerError } = await supabase
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
            .update({
              photo_url: photoUrl,
            })
            .eq('id', player.id);

          if (photoError) {
            throw new Error(photoError.message);
          }
        } catch (error) {
          console.error('Erro ao salvar foto:', error);

          await supabase
            .from('players')
            .delete()
            .eq('id', player.id);

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

          await supabase
            .from('players')
            .delete()
            .eq('id', player.id);

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
      setSaving(false);
    }
  }

  async function handleUpdatePlayer() {
    if (!editingPlayer) return;

    if (!name.trim()) {
      alert('Informe o nome do jogador.');
      return;
    }

    if (!slug.trim()) {
      alert('Informe o slug do jogador.');
      return;
    }

    setSaving(true);

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
        console.error(
          'Erro ao atualizar jogos do jogador:',
          deleteGamesError
        );

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
          console.error(
            'Erro ao associar novos jogos:',
            insertGamesError
          );

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
      setSaving(false);
    }
  }

  async function handleSavePlayer() {
    if (editingPlayer) {
      await handleUpdatePlayer();
    } else {
      await handleCreatePlayer();
    }
  }

  async function handleLogout() {
    await signOut();
    onLogout();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <span className="text-sm text-neutral-500">
          Carregando painel...
        </span>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <header className="border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
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

          <button
            onClick={handleLogout}
            className="border border-neutral-800 px-4 py-2 text-sm hover:bg-white/5"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
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
          <div className="grid grid-cols-[1fr_220px_100px] gap-4 px-5 py-4 bg-white/[0.03] border-b border-neutral-900 text-xs uppercase tracking-wider text-neutral-500">
            <span>Jogador</span>
            <span>Jogos</span>
            <span>Status</span>
          </div>

          {players.map((player) => (
            <div
              key={player.id}
              className="grid grid-cols-[1fr_220px_100px] gap-4 px-5 py-5 border-b border-neutral-900 last:border-b-0 items-center"
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
                  if (!game) {
                    return null;
                  }

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
                    player.active
                      ? 'text-green-400'
                      : 'text-neutral-600'
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
      </main>

      {showPlayerForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-900">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Jogadores
                </p>

                <h3 className="text-xl font-semibold text-white mt-1">
                  {editingPlayer
                    ? 'Editar jogador'
                    : 'Novo jogador'}
                </h3>
              </div>

              <button
                onClick={closePlayerForm}
                disabled={saving}
                className="text-neutral-500 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm text-neutral-400 mb-3">
                  Foto do jogador
                </label>

                <div className="flex items-center gap-5">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users
                        size={28}
                        className="text-neutral-600"
                      />
                    )}
                  </div>

                  <div>
                    <label className="inline-flex items-center gap-2 border border-neutral-800 px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-white/5 cursor-pointer">
                      <Upload size={16} />

                      Escolher foto

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          handlePhotoChange(
                            event.target.files?.[0] || null
                          )
                        }
                      />
                    </label>

                    <p className="text-xs text-neutral-600 mt-2">
                      JPG, PNG ou WEBP · máximo 5 MB
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Nome
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    handleNameChange(event.target.value)
                  }
                  placeholder="Ex.: Gabriel Abreu"
                  className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Slug
                </label>

                <input
                  type="text"
                  value={slug}
                  onChange={(event) =>
                    setSlug(event.target.value)
                  }
                  placeholder="gabriel-abreu"
                  className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500"
                />

                <p className="text-xs text-neutral-600 mt-2">
                  Usado na URL do perfil do jogador.
                </p>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Bio
                </label>

                <textarea
                  value={bio}
                  onChange={(event) =>
                    setBio(event.target.value)
                  }
                  placeholder="Breve descrição do jogador..."
                  rows={4}
                  className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-3">
                  Jogos
                </label>

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
                  <p className="text-sm text-white">
                    Jogador ativo
                  </p>

                  <p className="text-xs text-neutral-600 mt-1">
                    Jogadores inativos não aparecem como integrantes ativos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`relative w-11 h-6 transition ${
                    active
                      ? 'bg-white'
                      : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 transition ${
                      active
                        ? 'left-6 bg-black'
                        : 'left-1 bg-neutral-500'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-5 border-t border-neutral-900">
              <button
                onClick={closePlayerForm}
                disabled={saving}
                className="border border-neutral-800 px-5 py-3 text-sm text-neutral-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={handleSavePlayer}
                disabled={saving}
                className="bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50"
              >
                {saving
                  ? 'Salvando...'
                  : editingPlayer
                    ? 'Salvar alterações'
                    : 'Cadastrar jogador'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}