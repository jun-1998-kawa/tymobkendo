// amplify_outputs.json は `npx ampx sandbox` / Amplify Hosting のビルドで
// 自動生成されるため、ローカルでは存在しないことが多い。
// 型解決だけ通すための ambient 宣言。
declare module "*/amplify_outputs.json" {
  const value: Record<string, unknown>;
  export default value;
}
