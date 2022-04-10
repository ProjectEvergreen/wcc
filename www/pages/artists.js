import '../components/footer.js';
import '../components/header.js';

export default class ArtistsPage extends HTMLElement {
  constructor(props = {}) {
    super();

    console.debug('ArtistsPage constructor', this.shadowRoot)

    if(this.shadowRoot) {
      console.debug('ArtistsPage => shadowRoot detected!')
      const artists = JSON.parse(this.shadowRoot.querySelector('script[type="application/json"').text);
      console.log("Found SSR artists with length", artists.length);
      this.artists = artists;
    } else {
      this.attachShadow({ mode: 'open' });
      console.debug(this.shadowRoot);
      this.artists = props.artists || [];
    }

    console.debug('=====================');
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = this.getTemplate();
  }

  getTemplate() {
    return `
      <script type="application/json">
        ${JSON.stringify(this.artists)}
      </script>

      <wcc-header></wcc-header>

      <h1>Artists Page</h1>

      <table>
        <thead>
          <tr>
            <td>Name</td>
            <td>Image</td>
          </tr>
        </thead>
        <tbody>
          ${this.artists.map(artist => {
            const { name, imageUrl } = artist;

            return `
              <tr>
                <td><h1>${name}</h1></td>
                <td><img src="${imageUrl}" alt="${name}" loading="lazy"/></td>
              </tr>
            `;
          }).join('\n')}
        </tbody>
      </table>

      <wcc-footer></wcc-footer>
    `;
  }
}

export async function getData() {
  return {
    artists:   [
      { id: "1", name: "Analog", imageUrl: "//d34k5cjnk2rcze.cloudfront.net/images/artists/analog.jpg" },
      { id: "2", name: "Electro Calrissian", imageUrl: "//d34k5cjnk2rcze.cloudfront.net/images/artists/electro-calrissian.jpg" },
      { id: "3", name: "Rory Boyan", imageUrl: "//d34k5cjnk2rcze.cloudfront.net/images/artists/rory.jpg" }
    ]
  }
}