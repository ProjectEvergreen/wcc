export default class HomePage extends HTMLElement {
  constructor() {
    super();
    console.debug('HomePage constructor');
    // create a Shadow root
    this.root = this.attachShadow({ mode: 'closed' });
  }

  // run some code when the component is ready
  connectedCallback() {
    this.root.innerHTML = this.getTemplate();
  }

  // create templates that interpolate variables and HTML!
  getTemplate() {
    return `
      <style>
        .header {
          background-color: #192a27;
          min-height: 30px;
          padding: 10px;
          font-size: 1.2rem;
        }

        .header h4 {
          margin: 0 auto;
          padding: 4px 0 0 10px;
          display: inline-block;
          color: #efefef;
        }

        .head-wrap {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }

        .brand {
          justify-items: left;
          padding: 10px;
        }

        .brand img {
          float:left;
          height: 30px;
          width: 30px;
        }

        .header .social {
          margin-left:auto;
          text-align: right;
        }

        .header img.github-badge {
          display: inline-block;
          width: 90px;
          height: 20px;
        }

      </style>

      <header class="header">
        <div class="head-wrap">
          <div class="brand">
            <a href="/">
              <img src="/assets/greenwood-logo.png" alt="Greenwood logo"/>
              <h4>My Personal Blog</h4>
            </a>
          </div>
          <div class="social">
            <a href="https://github.com/ProjectEvergreen/greenwood">
              <img 
                src="https://img.shields.io/github/stars/ProjectEvergreen/greenwood.svg?style=social&logo=github&label=github" 
                alt="Greenwood GitHub badge"
                class="github-badge"/>
            </a>
          </div>
        </div>
      </header>
    `;
  }
}

// class HeaderComponent extends HTMLElement {
//   constructor() {
//     super();

//     // create a Shadow root
//     this.root = this.attachShadow({ mode: 'closed' });
//   }

//   // run some code when the component is ready
//   connectedCallback() {
//     this.root.innerHTML = this.getTemplate();
//   }

//   // create templates that interpolate variables and HTML!
//   getTemplate() {
//     return `
//       <style>
//       .header {
//         background-color: #192a27;
//         min-height: 30px;
//         padding: 10px;
//         font-size: 1.2rem;
//       }

//       .header h4 {
//         margin: 0 auto;
//         padding: 4px 0 0 10px;
//         display: inline-block;
//         color: #efefef;
//       }

//       .head-wrap {
//         display: flex;
//         align-items: center;
//         flex-wrap: wrap;
//       }

//       .brand {
//         justify-items: left;
//         padding: 10px;
//       }

//       .brand img {
//         float:left;
//         height: 30px;
//         width: 30px;
//       }

//       .header .social {
//         margin-left:auto;
//         text-align: right;
//       }

//       .header img.github-badge {
//         display: inline-block;
//         width: 90px;
//         height: 20px;
//       }

//       </style>

//       <header class="header">
//         <div class="head-wrap">
//           <div class="brand">
//             <a href="/">
//               <img src="/assets/greenwood-logo.png" alt="Greenwood logo"/>
//               <h4>My Personal Blog</h4>
//             </a>
//           </div>
//           <div class="social">
//             <a href="https://github.com/ProjectEvergreen/greenwood">
//               <img 
//                 src="https://img.shields.io/github/stars/ProjectEvergreen/greenwood.svg?style=social&logo=github&label=github" 
//                 alt="Greenwood GitHub badge"
//                 class="github-badge"/>
//             </a>
//           </div>
//         </div>
//       </header>
//     `;
//   }
// }

// customElements.define('app-header', HeaderComponent);