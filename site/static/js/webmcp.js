/* WebMCP — expose this site's real capabilities to an in-browser AI agent.
 *
 * https://webmachinelearning.github.io/webmcp/
 *
 * An agent driving a browser can call these instead of scraping the DOM or
 * guessing at URLs. Every tool here wraps something the site genuinely does:
 * the search tool queries the same prebuilt Fuse index the Cmd+K modal uses,
 * and the status tool hits the same /api/status the footer indicator polls.
 * Nothing here is a stub — a tool that returns nothing useful is worse than an
 * absent tool, because the agent spends a turn discovering that.
 *
 * No-ops entirely on browsers without navigator.modelContext, which today is
 * every browser except Chrome behind the WebMCP origin trial.
 */
(function () {
  'use strict';

  if (!('modelContext' in navigator) ||
      typeof navigator.modelContext.registerTool !== 'function') {
    return;
  }

  var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
  var indexPromise = null;

  /* Same index the Cmd+K search loads, cached for the page's lifetime so an
     agent making several queries pays the fetch once. Falls back to English,
     matching search.js — an agent on /fr/ should still get results rather than
     an error. */
  function loadIndex() {
    if (indexPromise) return indexPromise;
    indexPromise = fetch('/search-index.' + lang + '.json')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .catch(function () {
        return fetch('/search-index.en.json').then(function (r) { return r.json(); });
      });
    return indexPromise;
  }

  function scoreEntry(entry, needle) {
    var haystacks = [
      [entry.title || '', 4],
      [entry.tags || '', 3],
      [entry.categories || '', 2],
      [entry.excerpt || '', 1],
    ];
    var score = 0;
    for (var i = 0; i < haystacks.length; i++) {
      if (String(haystacks[i][0]).toLowerCase().indexOf(needle) !== -1) {
        score += haystacks[i][1];
      }
    }
    return score;
  }

  navigator.modelContext.registerTool({
    name: 'search_divinci_site',
    description:
      'Search divinci.ai pages and blog posts about Divinci AI: release management, ' +
      'quality assurance, RAG, voice agents, compliance and pricing. Returns matching ' +
      'page titles, URLs and summaries.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'What to search for, in natural language or keywords.',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default 5, max 20).',
        },
      },
      required: ['query'],
    },
    async execute(input) {
      var query = String((input && input.query) || '').trim();
      if (!query) {
        return { content: [{ type: 'text', text: 'No query supplied.' }] };
      }
      var limit = Math.min(Math.max(Number(input && input.limit) || 5, 1), 20);

      var entries = await loadIndex();
      var needle = query.toLowerCase();
      var hits = entries
        .map(function (e) { return { e: e, score: scoreEntry(e, needle) }; })
        .filter(function (h) { return h.score > 0; })
        .sort(function (a, b) { return b.score - a.score; })
        .slice(0, limit)
        .map(function (h) {
          return {
            title: h.e.title,
            url: new URL(h.e.url, location.origin).href,
            summary: String(h.e.excerpt || '').slice(0, 300),
          };
        });

      if (!hits.length) {
        return {
          content: [{
            type: 'text',
            text: 'No pages on divinci.ai matched "' + query + '". ' +
                  'The full page list is at https://divinci.ai/llms-full.txt',
          }],
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(hits, null, 2) }],
      };
    },
  });

  navigator.modelContext.registerTool({
    name: 'get_divinci_platform_status',
    description:
      'Get the current operational status of the Divinci AI platform and its ' +
      'components. Use this when a user reports something is not working, before ' +
      'suggesting they open a support ticket.',
    inputSchema: { type: 'object', properties: {} },
    async execute() {
      try {
        var res = await fetch('/api/status', { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('status ' + res.status);
        var data = await res.json();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return {
          content: [{
            type: 'text',
            text: 'Could not read platform status: ' + err.message +
                  '. The human-readable page is https://divinci.ai/status/',
          }],
        };
      }
    },
  });

  navigator.modelContext.registerTool({
    name: 'get_divinci_agent_endpoints',
    description:
      'Get the machine endpoints for working with Divinci programmatically: the ' +
      'MCP server, its OAuth endpoints, the API catalog and the agent skills index. ' +
      'Use this when the user wants to connect an agent or tool to Divinci rather ' +
      'than read about it.',
    inputSchema: { type: 'object', properties: {} },
    async execute() {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            mcp_server: 'https://mcp.divinci.app/mcp',
            mcp_description: 'https://mcp.divinci.app/info',
            oauth_protected_resource:
              'https://mcp.divinci.app/.well-known/oauth-protected-resource',
            oauth_authorization_server:
              'https://mcp.divinci.app/.well-known/oauth-authorization-server',
            api_catalog: 'https://divinci.ai/.well-known/api-catalog',
            agent_card: 'https://divinci.ai/.well-known/agent-card.json',
            agent_skills: 'https://divinci.ai/.well-known/agent-skills/index.json',
            auth_guide: 'https://divinci.ai/auth.md',
            sdk_docs: 'https://sdk.divinci.ai/',
          }, null, 2),
        }],
      };
    },
  });
})();
