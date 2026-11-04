declare module 'virtual:licenses' {
  const licenses: { name: string; version: string; license: string; url: string | null }[];
  export default licenses;
}
