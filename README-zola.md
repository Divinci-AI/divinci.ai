# Divinci.ai Website - Zola Version

The official website for Divinci AI, built with Zola static site generator and deployed on Cloudflare Pages.

## Development Setup

### Prerequisites

- [Zola](https://www.getzola.org/documentation/getting-started/installation/) (v0.17.0 or later)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/DivinciApp/divinci.ai.git
   cd divinci.ai
   ```

### Development

Start the development server:
```
zola serve
```

This will start a local server at http://127.0.0.1:1111 with live reload.

### Building for Production

Build the site for production:
```
zola build
```

The built site will be in the `public` directory.

## Project Structure

```
divinci.ai/
├── content/             # Content files in Markdown format
│   ├── blog/            # Blog posts
│   │   └── _index.md    # Blog section configuration
│   └── _index.md        # Home page content
├── sass/                # Sass files for styling
├── static/              # Static assets (images, CSS, JS)
│   ├── images/          # Image files
│   ├── js/              # JavaScript files
│   └── _redirects       # Cloudflare Pages redirects
├── templates/           # HTML templates
│   ├── partials/        # Reusable template parts
│   │   ├── footer.html  # Footer template
│   │   └── header.html  # Header template
│   ├── base.html        # Base template
│   ├── index.html       # Home page template
│   ├── blog.html        # Blog listing template
│   └── blog-page.html   # Blog post template
├── config.toml          # Zola configuration
└── README.md            # This file
```

## Adding New Pages

Create a new `.md` file in the `content/` directory:

```markdown
+++
title = "Page Title"
description = "Page description"
template = "page.html"
+++

# Your page content here

Write your content in Markdown format.
```

## Adding New Blog Posts

Create a new `.md` file in the `content/blog/` directory:

```markdown
+++
title = "Blog Post Title"
description = "Blog post description"
date = 2023-05-15
[taxonomies]
tags = ["tag1", "tag2"]
[extra]
author = "Author Name"
+++

# Your blog post content here

Write your content in Markdown format.
```

## Deployment

The site is automatically deployed to Cloudflare Pages when changes are pushed to the main branch.

### Manual Deployment

1. Build the site: `zola build`
2. Deploy the contents of the `public` directory to Cloudflare Pages

## Cloudflare Pages Configuration

- **Build command**: `zola build`
- **Build output directory**: `public`
- **Root directory**: `/`

## License

[License information here]
