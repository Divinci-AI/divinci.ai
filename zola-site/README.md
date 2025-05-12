# Divinci AI Website

This is the source code for the Divinci AI website, built with [Zola](https://www.getzola.org/), a fast static site generator written in Rust.

## Development

### Prerequisites

- [Zola](https://www.getzola.org/documentation/getting-started/installation/) (v0.17.2 or later)

### Local Development

1. Clone this repository
2. Navigate to the project directory
3. Run `zola serve` to start the development server
4. Visit `http://127.0.0.1:1025` in your browser

### Building for Production

Run `zola build` to generate the static site in the `public` directory.

## Deployment

This site is configured for deployment on Cloudflare Pages.

### Cloudflare Pages Setup

1. Create a new Cloudflare Pages project
2. Connect your GitHub repository
3. Set the build command to: `curl -sL https://github.com/getzola/zola/releases/download/v0.17.2/zola-v0.17.2-x86_64-unknown-linux-gnu.tar.gz | tar zxv && ./zola build`
4. Set the build output directory to: `public`
5. Add the following environment variable:
   - `ZOLA_VERSION`: `0.17.2`

## Project Structure

- `content/`: Markdown files that make up the content of the site
- `static/`: Static assets like CSS, JavaScript, and images
- `templates/`: HTML templates using the Tera templating language
- `config.toml`: Site configuration
- `.cloudflare/`: Cloudflare Pages configuration
- `netlify.toml`: Netlify configuration (alternative deployment option)

## License

Copyright © 2023-2025 Divinci AI. All rights reserved.
