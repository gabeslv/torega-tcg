import { FormEvent, useState } from 'react';
import { signIn } from './lib/auth';

type AdminLoginProps = {
  onLogin: () => void;
};

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError('E-mail ou senha inválidos.');
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="border border-white/10 bg-white/[0.03] p-8">
          <div className="flex justify-center mb-8">
            <img
              src="/toregafoto.svg"
              alt="Torega TCG"
              className="h-16 w-auto"
            />
          </div>

          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 mb-3">
              Área administrativa
            </p>

            <h1 className="text-3xl font-semibold">
              Entrar
            </h1>

            <p className="text-sm text-zinc-500 mt-2">
              Acesso restrito à administração do Torega TCG.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                E-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full bg-black border border-white/10 px-4 py-3 outline-none focus:border-white/30"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Senha
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full bg-black border border-white/10 px-4 py-3 outline-none focus:border-white/30"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-3 font-semibold hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}