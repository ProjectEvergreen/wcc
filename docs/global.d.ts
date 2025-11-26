declare module '*.module.css' {
  const styles: Readonly<Record<string, string>>;
  export default styles;
}
