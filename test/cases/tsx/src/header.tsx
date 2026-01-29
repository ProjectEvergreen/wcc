// testing for https://github.com/ProjectEvergreen/wcc/issues/228
export default class Header extends HTMLElement {
  render() {
    return (
      <button popovertarget="mobile-menu" popovertargetaction="hide">
        Close
      </button>
    );
  }
}
