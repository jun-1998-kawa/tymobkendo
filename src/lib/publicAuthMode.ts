/**
 * 公開ページ（トップ / ニュース）で使用する AppSync の authMode を決定する。
 *
 * 公開コンテンツ（SiteConfig / HeroSlide / News / 公開 Page）はログイン状態に
 * 関わらず表示する必要がある。data モデルの認可は以下を想定している。
 *   - allow.guest().to(["read"])           … 未ログイン（Identity Pool unauthenticated ロール / IAM）
 *   - allow.authenticated().to(["read"])   … ログイン中（Cognito User Pool）
 *
 * ここで authMode を固定で 'identityPool' にすると、ログイン中かつ ADMINS / MEMBERS
 * グループに所属するユーザーは Identity Pool の「グループ用 IAM ロール」に解決される。
 * グループロールには AppSync(data) への権限が付与されていないため、
 * `UnauthorizedException: Permission denied`（HTTP 401）になり、
 * トップページの背景画像（SiteConfig）やお知らせ（News）が表示されなくなる。
 *
 * そのため、ログイン中は 'userPool'（allow.authenticated 経由）で読み、
 * 未ログイン時のみ 'identityPool'（allow.guest 経由）で読む。
 */
import { fetchAuthSession } from "aws-amplify/auth";

export type PublicAuthMode = "userPool" | "identityPool";

export async function resolvePublicAuthMode(): Promise<PublicAuthMode> {
  try {
    const { tokens } = await fetchAuthSession();
    // tokens が取得できる = ログイン済み。User Pool 認証で読む。
    return tokens?.accessToken ? "userPool" : "identityPool";
  } catch {
    // セッション取得に失敗した場合はゲスト扱い。
    return "identityPool";
  }
}
