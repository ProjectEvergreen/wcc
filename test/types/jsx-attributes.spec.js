import { expect } from 'chai';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

describe('Published JSX attribute declarations', function () {
  it('should type HTML/SVG attributes without exposing DOM object members', function () {
    this.timeout(10000);
    const filename = fileURLToPath(
      new URL('./attributes-consumer.tsx', import.meta.url),
    ).replaceAll('\\', '/');
    const source = `
      import 'wc-compiler/jsx-runtime';
      const meta = <meta property="og:title" content="Example" />;
      const label = <label for="email" />;
      const input = <input readonly required={false} size="10" value={42} />;
      const numeric = <input size={10} min={0} max={10} step={2} />;
      const global = <div tabindex="-1" popover="hint" aria-hidden={false} data-count={2} />;
      const emptyPopover = <div popover />;
      const button = <button popovertarget="menu" popovertargetaction="toggle" />;
      const targetInput = <input popovertarget="menu" />;
      const optional = <div title={null} hidden="until-found" />;
      const image = <img loading="lazy" decoding="async" fetchpriority="high" crossorigin="anonymous" referrerpolicy="" />;
      const frame = <iframe loading="eager" sandbox="allow-scripts allow-forms allow-downloads" />;
      const editor = <div contenteditable="plaintext-only" dir="auto" inputmode="decimal" spellcheck={false} translate="no" />;
      const suggestions = <input writingsuggestions={false} autocorrect="off" capture="environment" />;
      const keyboard = <div virtualkeyboardpolicy="manual" enterkeyhint="search" />;
      const ariaKeywords = <div aria-live="polite" aria-checked="mixed" aria-expanded={false} aria-relevant="text additions" role="button checkbox" />;
      const ariaSvg = <svg aria-live="polite" aria-hidden={false} />;
      const ariaDefault = <div aria-hidden="undefined" />;
      const form = <form method="dialog" enctype="multipart/form-data" autocomplete="off" target="checkout-window" />;
      const inputKeywords = <input type="email" formmethod="dialog" formenctype="text/plain" autocomplete="section-checkout shipping street-address" />;
      const buttonKeywords = <button type="submit" formmethod="post" formtarget="confirmation" />;
      const script = <script type="application/ld+json" />;
      const metadata = <meta name="my-custom-name" content="freeform" />;
      const lists = <ol type="A"><li /></ol>;
      const media = <video preload="metadata"><track kind="captions" /></video>;
      declare const loading: 'lazy' | 'eager' | undefined;
      const dynamic = <img loading={loading} />;
      const spread = <img {...{ loading: 'lazy' as const }} />;
      // @ts-expect-error loading has fixed keywords
      const loadingTypo = <img loading="lzy" />;
      // @ts-expect-error iframe loading has the same fixed keywords
      const iframeTypo = <iframe loading="lzy" />;
      // @ts-expect-error decoding is not a freeform string
      const decodingTypo = <img decoding="asnc" />;
      // @ts-expect-error fetch priority has fixed keywords on links too
      const priorityTypo = <link fetchpriority="urgent" />;
      // @ts-expect-error keyword checks apply to dynamic strings
      const dynamicTypo = <img loading={'lzy' as string} />;
      // @ts-expect-error keyword checks apply to spread props
      const spreadTypo = <img {...{ loading: 'lzy' }} />;
      // @ts-expect-error input types have their own keywords
      const inputTypo = <input type="emial" />;
      // @ts-expect-error email is an input type, not a button type
      const buttonTypo = <button type="email" />;
      // @ts-expect-error form method is a closed enum
      const methodTypo = <form method="fetch" />;
      // @ts-expect-error form encodings are not arbitrary MIME types
      const encodingTypo = <form enctype="application/json" />;
      // @ts-expect-error form autocomplete differs from input autocomplete
      const autocompleteTypo = <form autocomplete="email" />;
      // @ts-expect-error direction is a closed enum
      const directionTypo = <div dir="left" />;
      // @ts-expect-error obsolete inputmode completions must not override the standard
      const inputmodeTypo = <input inputmode="latin" />;
      // @ts-expect-error contenteditable is a closed enum
      const editableTypo = <div contenteditable="editable" />;
      // @ts-expect-error hidden has finite keywords as well as JSX boolean shorthand
      const hiddenTypo = <div hidden="yes" />;
      // @ts-expect-error ARIA keywords are checked in HTML
      const ariaTypo = <div aria-live="politely" />;
      // @ts-expect-error ARIA keywords are also checked in SVG
      const svgAriaTypo = <svg aria-live="politely" />;
      // @ts-expect-error virtualkeyboardpolicy is not a boolean keyword
      const keyboardTypo = <div virtualkeyboardpolicy="true" />;
      // @ts-expect-error ol type differs from input and button type
      const listTypo = <ol type="decimal" />;
      // @ts-expect-error preload is a closed enum
      const mediaTypo = <audio preload="lazy" />;
      // @ts-expect-error track kind has its own keywords
      const trackTypo = <track kind="subtitle" />;
      // @ts-expect-error keyword checks apply to intrinsic prop objects
      const imageProps: JSX.IntrinsicElements['img'] = { loading: 'lzy' };
      const svg = <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
        <linearGradient gradientUnits="userSpaceOnUse" />
        <path d="M0 0" stroke-width={2} />
        <use xlink:href="#icon" />
        <a href="#icon" /><title>Icon</title>
      </svg>;
      const htmlLink = <a href="/" download={false} />;
      const htmlTitle = <title>Page</title>;
      const markup = <section innerHTML="<strong>Example</strong>" />;
      let count = 0;
      const events = <button onclick={(event) => { const mouse: MouseEvent = event; }} />;
      const assignment = <button onclick={count += 1} />;
      declare global { namespace JSX { interface IntrinsicElements { 'wcc-custom': { count: number }; } } }
      const custom = <wcc-custom count={1} />;
      // @ts-expect-error DOM methods are not attributes
      const method = <div cloneNode={123} />;
      // @ts-expect-error computed DOM properties are not attributes
      const computed = <div clientWidth={123} />;
      // @ts-expect-error DOM input setters are not attributes
      const setter = <input valueAsNumber={42} />;
      // @ts-expect-error use HTML attribute names
      const domName = <label htmlFor="email" />;
      // @ts-expect-error typo
      const typo = <meta propert="og:title" />;
      // @ts-expect-error target attributes are not global
      const wrongTag = <span popovertarget="menu" />;
      // @ts-expect-error invalid popover keyword
      const mode = <div popover="wrong" />;
      // @ts-expect-error invalid target action
      const action = <button popovertargetaction="wrong" />;
      // @ts-expect-error no SVG catch-all index signature
      const svgTypo = <svg widht="10" />;
      // @ts-expect-error invalid attribute value
      const object = <input size={{}} />;
      // @ts-expect-error explicitly declared hyphenated attributes are checked
      const aria = <div aria-hidden={{}} />;
      // @ts-expect-error invalid callback parameter
      const eventType = <button onclick={(event: KeyboardEvent) => {}} />;
      // @ts-expect-error object literals also check unknown hyphenated attributes
      const svgObject: JSX.IntrinsicElements['path'] = { 'stroke-widht': 2 };
    `;
    const options = {
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.NodeNext,
      target: ts.ScriptTarget.ESNext,
      types: [],
      lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
    };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (name, ...args) =>
      name === filename
        ? ts.createSourceFile(name, source, options.target, true, ts.ScriptKind.TSX)
        : getSourceFile(name, ...args);
    const program = ts.createProgram([filename], options, host);
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    expect(diagnostics).to.deep.equal([]);
    // The public JSX declarations must not depend on our build-time data packages.
    expect(
      program
        .getSourceFiles()
        .some((file) =>
          /node_modules\/(property-information|html-element-attributes|svg-element-attributes|html-validate|@vscode\/web-custom-data)\//.test(
            file.fileName,
          ),
        ),
    ).to.equal(false);
  });
});
