# Deploying to Cloudflare Pages

This document provides instructions for deploying the Divinci.ai Zola site to Cloudflare Pages.

## Prerequisites

1. A Cloudflare account
2. Access to the Cloudflare Pages dashboard
3. A GitHub repository containing your Zola site

## Deployment Steps

### 1. Connect Your GitHub Repository

1. Log in to your Cloudflare dashboard
2. Navigate to **Pages** in the sidebar
3. Click **Create a project**
4. Select **Connect to Git**
5. Authenticate with GitHub and select your repository
6. Click **Begin setup**

### 2. Configure Build Settings

Configure the following build settings:

- **Project name**: `divinci-ai` (or your preferred name)
- **Production branch**: `main` (or your main branch)
- **Build command**: `zola build`
- **Build output directory**: `public`
- **Root directory**: `/` (or the directory containing your Zola site if in a subdirectory)

### 3. Environment Variables

Add the following environment variables:

- `ZOLA_VERSION`: `0.17.2` (or your preferred Zola version)

### 4. Advanced Build Settings (Optional)

You can configure additional settings:

- **Web Analytics**: Enable Cloudflare Web Analytics
- **Minify**: Enable HTML/CSS/JS minification
- **Caching**: Configure caching behavior

### 5. Deploy

Click **Save and Deploy** to start the deployment process.

## Custom Domain Setup

To use a custom domain with your Cloudflare Pages site:

1. Navigate to your Pages project
2. Click on **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain name (e.g., `divinci.ai`)
5. Follow the instructions to verify domain ownership

If your domain is already on Cloudflare:
- Select **Use a domain that's on Cloudflare**
- Choose your domain from the list

If your domain is not on Cloudflare:
- Select **Use a domain that's not on Cloudflare**
- Follow the instructions to add DNS records

## Continuous Deployment

Cloudflare Pages automatically deploys your site when changes are pushed to your repository. Each commit to your main branch will trigger a new production deployment.

You can also set up preview deployments for pull requests:

1. Navigate to your Pages project
2. Click on **Settings**
3. Under **Builds & deployments**, enable **Preview deployments**

## Monitoring and Troubleshooting

To monitor your deployments:

1. Navigate to your Pages project
2. Click on **Deployments** to see all deployments
3. Click on a specific deployment to view build logs and details

If you encounter issues:
- Check the build logs for errors
- Verify your build command and output directory
- Ensure your Zola version is compatible with your site

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Zola Documentation](https://www.getzola.org/documentation/)
- [Cloudflare Pages GitHub Action](https://github.com/cloudflare/pages-action) (for custom CI/CD workflows)
