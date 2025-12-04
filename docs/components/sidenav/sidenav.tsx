import type { Page, Graph } from '@greenwood/cli';
import { getContent } from '@greenwood/cli/src/data/client.js';
import styles from './sidenav.module.css';

type DocsPage = Page & {
  data: {
    tableOfContents: any;
  };
};

export default class SideNav extends HTMLElement {
  route: string;
  toc: {};

  // TODO: heading
  // TODO: current route
  async connectedCallback() {
    const route = this.getAttribute('route') ?? '';
    const page = ((await getContent()) as Graph).find((page) => page.route === route);
    console.log({ page });
    // TODO:
    // @ts-expect-error
    const { tableOfContents } = page?.data ?? { tableOfContents: {} };

    console.log({ tableOfContents });

    this.toc = tableOfContents;
    this.render();
  }

  render() {
    return <span>SideNav goes here</span>;
  }
}

customElements.define('wcc-sidenav', SideNav);

// export default class SideNav extends HTMLElement {
//   async connectedCallback() {
//     const heading = this.getAttribute("heading");
//     const route = this.getAttribute("route");
//     const currentRoute = this.getAttribute("current-route");
//     const content = (await getContentByRoute(route)).filter((page) => page.route !== route);
//     const sections = [];

//     content.forEach((item) => {
//       const segments = item.route
//         .replace(`${route}`, "")
//         .split("/")
//         .filter((segment) => segment !== "");
//       const parent = content.find((page) => page.route === `${route}${segments[0]}/`);

//       if (!sections[parent.data.order - 1]) {
//         sections[parent.data.order - 1] = {
//           link: parent.route,
//           heading: parent.label, // TODO title not populating
//           items: [],
//         };
//       }

//       if (parent.route !== item.route) {
//         sections[parent.data.order - 1].items[item.data.order - 1] = item;
//       }
//     });

//     if (sections.length === 0) {
//       return;
//     }

//     this.innerHTML = `
//       <div class="${styles.fullMenu}" data-full>
//         ${sections
//           .map((section) => {
//             const { heading, items, link } = section;
//             const isActiveHeading = currentRoute.startsWith(link) ? "active" : "";

//             return `
//               <h3 class="${styles.compactMenuSectionHeading}" role="heading">
//                 <a class="${isActiveHeading}" href="${link}">${heading}</a>
//               </h3>
//               <ul class="${styles.compactMenuSectionList}">
//                 ${items
//                   .map((item) => {
//                     const { label, route } = item;
//                     const itemClass =
//                       route === currentRoute
//                         ? styles.compactMenuSectionListItemActive
//                         : styles.compactMenuSectionListItem;

//                     return `
//                       <li class="${itemClass}">
//                         <a href="${route}">${label}</a>
//                       </li>
//                     `;
//                   })
//                   .join("")}
//               </ul>
//             `;
//           })
//           .join("")}
//       </div>
//       <div class="${styles.compactMenu}" data-compact>
//         <button popovertarget="compact-menu" class="${styles.compactMenuPopoverTrigger}" aria-label="Compact Guides Menu">
//           ${heading}
//           <span id="indicator">&#9660;</span>
//         </button>
//         <div id="compact-menu" class="${styles.compactMenuPopover}" popover="manual">
//           <button class="${styles.compactMenuCloseButton}" popovertarget="compact-menu" popovertargetaction="hide" aria-label="Compact Menu Close Button">
//             &times;
//           </button>
//           ${sections
//             .map((section) => {
//               const { heading, items, link } = section;
//               const isActiveHeading = currentRoute.startsWith(link) ? "active" : "";

//               return `
//                 <h3 class="${styles.compactMenuSectionHeading}" role="heading">
//                   <a class="${isActiveHeading}" href="${link}">${heading}</a>
//                 </h3>
//                 <ul class="${styles.compactMenuSectionList}">
//                   ${items
//                     .map((item) => {
//                       const { label, route } = item;
//                       const itemClass =
//                         route === currentRoute
//                           ? styles.compactMenuSectionListItemActive
//                           : styles.compactMenuSectionListItem;

//                       return `
//                         <li class="${itemClass}">
//                           <a href="${route}">${label}</a>
//                         </li>
//                       `;
//                     })
//                     .join("")}
//                 </ul>
//               `;
//             })
//             .join("")}
//         </div>
//       </div>
//     `;
//   }
// }
