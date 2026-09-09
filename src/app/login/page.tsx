"use client";

import { useActionState, useEffect, useState, type FormEvent } from "react";
import { signIn, signUp, type AuthState } from "./actions";
import { brandButtonStyle } from "@/lib/brandColor";
import { createClient } from "@/lib/supabase/client";

const initialState: AuthState = { error: null, message: null };

type Mode = "signin" | "signup" | "forgot" | "recovery";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [signInState, signInAction, signInPending] = useActionState(
    signIn,
    initialState,
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUp,
    initialState,
  );

  // パスワード再設定メールのリンクを開いてこのページに戻ってきた場合、
  // Supabaseのクライアントがリンク内のトークンを自動で読み取って
  // PASSWORD_RECOVERY イベントを発火する。検知したら、通常のログイン
  // フォームの代わりに「新しいパスワードを設定」フォームに切り替える。
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    // リンクの有効期限切れ・二重クリックなどでSupabaseがエラーを返した
    // 場合、"#error=...&error_code=...&error_description=..." という形で
    // URLのハッシュに載ってくる(成功時はここに access_token などが載る)。
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const errorDescription = hashParams.get("error_description");
    if (errorDescription) {
      // マウント時に一度だけURLを読み取る、正当な「外部システムとの同期」
      // なので、この行に限りルールを外す。
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLinkError(errorDescription.replace(/\+/g, " "));
      // 再読み込みで同じエラーが再表示され続けないよう、URLからハッシュを消す。
      window.history.replaceState(null, "", window.location.pathname);
    }

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setLinkError(null);
        setMode("recovery");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // 「パスワードをお忘れですか？」: 再設定メールを送る。
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPending, setForgotPending] = useState(false);
  const [forgotState, setForgotState] = useState<AuthState>(initialState);

  async function handleForgotSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setForgotPending(true);
    setForgotState(initialState);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/login`,
    });

    setForgotPending(false);
    setForgotState(
      error
        ? { error: error.message, message: null }
        : {
            error: null,
            message:
              "パスワード再設定メールを送信しました。メール内のリンクを開いてください。",
          },
    );
  }

  // 再設定リンクから戻ってきた場合: 新しいパスワードを保存する。
  const [newPassword, setNewPassword] = useState("");
  const [recoveryPending, setRecoveryPending] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  async function handleRecoverySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRecoveryPending(true);
    setRecoveryError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setRecoveryPending(false);
      setRecoveryError(error.message);
      return;
    }

    // サーバー側(ミドルウェア)にも新しいセッションを認識させるため、
    // クライアント遷移ではなくページ全体を再読み込みする。
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 上記の理由で意図的にフルリロードしている
    window.location.href = "/";
  }

  if (mode === "recovery") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-100 bg-white p-8 shadow-lg">
          <h1 className="text-xl font-semibold text-zinc-900">
            新しいパスワードを設定
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            転職活動トラッカーの新しいパスワードを入力してください。
          </p>

          <form onSubmit={handleRecoverySubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                新しいパスワード
              </label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
              />
            </div>

            {recoveryError && (
              <p className="text-sm text-red-600">{recoveryError}</p>
            )}

            <button
              type="submit"
              disabled={recoveryPending}
              style={brandButtonStyle}
              className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-60"
            >
              {recoveryPending ? "更新中..." : "パスワードを更新"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-100 bg-white p-8 shadow-lg">
          <h1 className="text-xl font-semibold text-zinc-900">
            パスワードを再設定
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            登録したメールアドレスに再設定用のリンクを送ります。
          </p>

          <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                メールアドレス
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
              />
            </div>

            {forgotState.error && (
              <p className="text-sm text-red-600">{forgotState.error}</p>
            )}
            {forgotState.message && (
              <p className="text-sm text-emerald-600">{forgotState.message}</p>
            )}

            <button
              type="submit"
              disabled={forgotPending}
              style={brandButtonStyle}
              className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-60"
            >
              {forgotPending ? "送信中..." : "再設定メールを送信"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode("signin")}
            className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-800"
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    );
  }

  const state = mode === "signin" ? signInState : signUpState;
  const action = mode === "signin" ? signInAction : signUpAction;
  const pending = mode === "signin" ? signInPending : signUpPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-100 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-semibold text-zinc-900">
          転職活動トラッカー
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {mode === "signin"
            ? "ログインしてデータを同期"
            : "アカウントを作成"}
        </p>

        {linkError && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <p>メール内のリンクの有効期限が切れているか、既に使用済みです。</p>
            <button
              type="button"
              onClick={() => {
                setLinkError(null);
                setMode("forgot");
              }}
              className="mt-1 font-medium underline hover:text-amber-900"
            >
              もう一度再設定メールを送る
            </button>
          </div>
        )}

        <form action={action} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              メールアドレス
            </label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-700">
                パスワード
              </label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-zinc-500 hover:text-green-700 hover:underline"
                >
                  パスワードをお忘れですか？
                </button>
              )}
            </div>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          {state.message && (
            <p className="text-sm text-emerald-600">{state.message}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            style={brandButtonStyle}
            className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-60"
          >
            {pending
              ? "処理中..."
              : mode === "signin"
                ? "ログイン"
                : "アカウント作成"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-800"
        >
          {mode === "signin"
            ? "アカウントをお持ちでない方はこちら"
            : "すでにアカウントをお持ちの方はこちら"}
        </button>
      </div>
    </div>
  );
}
