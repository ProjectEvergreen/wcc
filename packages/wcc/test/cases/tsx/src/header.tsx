// testing for https://github.com/ProjectEvergreen/wcc/issues/228
export default class Header extends HTMLElement {
  render() {
    return (
      <header>
        <button popovertarget="mobile-menu" popovertargetaction="hide">
          Close
        </button>

        {/* @ts-expect-error popovertargetaction should only be valid if its one of the supported values */}
        <button popovertarget="mobile-menu" popovertargetaction="wcc">
          Close
        </button>

        {/* @ts-expect-error popovertarget should only be valid on <button> and <input> */}
        <span popovertarget="mobile-menu">Close</span>
      </header>
    );
  }
}
