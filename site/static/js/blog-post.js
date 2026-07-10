// Blog post interactive JS.
// Extracted from inline <script> in templates/blog-post.html to cut TBT:
// 715 lines of JS parse cost per page -> 0 (loaded with `defer`, parsed after HTML).
// Cacheable across all 469 blog pages (was duplicated in every HTML response).

// Social sharing functions
function shareOnTwitter() {
    const url = window.location.href;
    const title = document.title;
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
}

function shareOnLinkedIn() {
    const url = window.location.href;
    const title = document.title;
    const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(linkedinUrl, '_blank', 'width=550,height=420');
}

function shareOnFacebook() {
    const url = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
}

function showCopyToast(message) {
    let toast = document.getElementById('copy-link-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'copy-link-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        Object.assign(toast.style, {
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%) translateY(-12px)',
            background: 'rgba(30, 58, 43, 0.96)',
            color: '#faf8f5',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            zIndex: '99999',
            opacity: '0',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
            pointerEvents: 'none',
            fontFamily: "'DM Sans', -apple-system, sans-serif",
        });
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    void toast.offsetWidth;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-12px)';
    }, 1800);
}

function copyLink(evt) {
    const url = window.location.href;
    const btn = (evt && (evt.currentTarget || (evt.target && evt.target.closest('.copy'))))
              || document.querySelector('.share-btn-overlay.copy, .social-btn-icon.copy');
    navigator.clipboard.writeText(url).then(function() {
        showCopyToast('Link copied to clipboard');
        if (btn) {
            const originalIcon = btn.querySelector('i');
            if (!originalIcon) return;
            const checkIcon = document.createElement('i');
            checkIcon.className = 'fas fa-check';
            checkIcon.setAttribute('aria-hidden', 'true');
            const originalLabel = btn.getAttribute('aria-label');
            btn.replaceChild(checkIcon, originalIcon);
            btn.setAttribute('aria-label', 'Link copied');
            setTimeout(function() {
                if (checkIcon.parentNode === btn) {
                    btn.replaceChild(originalIcon, checkIcon);
                }
                if (originalLabel) btn.setAttribute('aria-label', originalLabel);
            }, 1800);
        }
    }).catch(function() {
        showCopyToast('Could not copy - please copy the URL manually');
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return false;
}

// Build an SVG icon node from a parsed SVG document. Uses DOMParser to safely
// turn a hardcoded SVG string (no user input) into a real DOM node.
const _svgParser = new DOMParser();
function buildSvgIconNode(svgString) {
    const doc = _svgParser.parseFromString(svgString, 'image/svg+xml');
    const svg = doc.documentElement;
    return document.importNode(svg, true);
}

// Table of Contents Generation and Active State
document.addEventListener('DOMContentLoaded', function() {
    const tocList = document.getElementById('toc-list');
    const articleContent = document.querySelector('.content-body');

    if (!tocList || !articleContent) return;

    const headings = articleContent.querySelectorAll('h2, h3');

    if (headings.length === 0) {
        document.querySelector('.table-of-contents').style.display = 'none';
        return;
    }

    // Static SVG icon strings, mapped by section keyword. None of these come
    // from user input - the keys are hardcoded and the values are literals.
    const TOC_ICONS = {
        fusion: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v6m0 6v6M1 12h6m6 0h6"/></svg>',
        ai: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h.01M15 9h.01M9 15h6"/></svg>',
        robot: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="6" rx="2"/><rect x="7" y="13" width="10" height="9" rx="2"/><path d="M9 13V8m6 5V8M9 19v2m6-2v2"/></svg>',
        crypto: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.5 9.5l5 5m0-5l-5 5M8 12h8"/></svg>',
        money: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12m-2-7h4a2 2 0 110 4H10"/></svg>',
        government: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        defense: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        math: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
        timeline: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/></svg>',
        people: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>',
        poverty: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 14v7"/></svg>',
        growth: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        business: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>',
        inflation: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        skeptic: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"/></svg>',
        future: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        conclusion: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
        document: '<svg class="toc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
    };

    function getIconKeyForSection(text) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('fusion') || lowerText.includes('energy')) return 'fusion';
        if (lowerText.includes('ai') || lowerText.includes('artificial intelligence')) return 'ai';
        if (lowerText.includes('robot') || lowerText.includes('automation')) return 'robot';
        if (lowerText.includes('bitcoin') || lowerText.includes('crypto')) return 'crypto';
        if (lowerText.includes('financial') || lowerText.includes('money') || lowerText.includes('dollar')) return 'money';
        if (lowerText.includes('government') || lowerText.includes('policy')) return 'government';
        if (lowerText.includes('defense') || lowerText.includes('military')) return 'defense';
        if (lowerText.includes('math') || lowerText.includes('calculation')) return 'math';
        if (lowerText.includes('timeline') || lowerText.includes('roadmap')) return 'timeline';
        if (lowerText.includes('people') || lowerText.includes('social') || lowerText.includes('human')) return 'people';
        if (lowerText.includes('poverty') || lowerText.includes('inequality')) return 'poverty';
        if (lowerText.includes('growth') || lowerText.includes('economic')) return 'growth';
        if (lowerText.includes('entrepreneur') || lowerText.includes('business')) return 'business';
        if (lowerText.includes('inflation') || lowerText.includes('concern')) return 'inflation';
        if (lowerText.includes('skeptic') || lowerText.includes('objection')) return 'skeptic';
        if (lowerText.includes('future') || lowerText.includes('vision') || lowerText.includes('2035')) return 'future';
        if (lowerText.includes('conclusion') || lowerText.includes('summary')) return 'conclusion';
        return 'document';
    }

    headings.forEach((heading, index) => {
        const level = heading.tagName.toLowerCase();
        const text = heading.textContent;
        const id = heading.id || `heading-${index}`;

        if (!heading.id) heading.id = id;

        heading.style.cursor = 'pointer';
        heading.style.position = 'relative';
        heading.addEventListener('click', function() {
            const url = new URL(window.location);
            url.hash = id;
            history.pushState(null, null, url);

            navigator.clipboard.writeText(url.toString()).then(() => {
                const feedback = document.createElement('span');
                feedback.textContent = '🔗 Link copied!';
                feedback.style.cssText = 'position: absolute; left: -120px; top: 50%; transform: translateY(-50%); background: #e8ddc7; color: #2d3c34; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; opacity: 0; transition: opacity 0.3s ease;';
                this.style.position = 'relative';
                this.appendChild(feedback);
                setTimeout(() => feedback.style.opacity = '1', 10);
                setTimeout(() => {
                    feedback.style.opacity = '0';
                    setTimeout(() => feedback.remove(), 300);
                }, 2000);
            });
        });

        const li = document.createElement('li');
        li.className = `toc-${level}`;

        const a = document.createElement('a');
        a.href = `#${id}`;
        a.dataset.target = id;

        const iconNode = buildSvgIconNode(TOC_ICONS[getIconKeyForSection(text)]);
        const textSpan = document.createElement('span');
        textSpan.className = 'toc-text';
        textSpan.textContent = text;

        a.appendChild(iconNode);
        a.appendChild(textSpan);

        li.appendChild(a);
        tocList.appendChild(li);
    });

    tocList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.dataset.target;
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                history.pushState(null, null, `#${targetId}`);
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                updateActiveLink(targetId);
            }
        });
    });

    function updateActiveLink(targetId = null) {
        const links = tocList.querySelectorAll('a');
        let activeLink = null;

        if (targetId) {
            links.forEach(link => {
                if (link.dataset.target === targetId) {
                    link.classList.add('active');
                    activeLink = link;
                } else {
                    link.classList.remove('active');
                }
            });
        } else {
            let current = '';
            headings.forEach(heading => {
                const rect = heading.getBoundingClientRect();
                if (rect.top <= 200) current = heading.id;
            });
            links.forEach(link => {
                link.classList.remove('active');
                if (link.dataset.target === current) {
                    link.classList.add('active');
                    activeLink = link;
                }
            });
        }

        if (activeLink) {
            const tocContainer = document.querySelector('.table-of-contents');
            if (tocContainer) {
                const linkRect = activeLink.getBoundingClientRect();
                const tocRect = tocContainer.getBoundingClientRect();
                if (linkRect.top < tocRect.top || linkRect.bottom > tocRect.bottom) {
                    activeLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }

    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateActiveLink();
                ticking = false;
            });
            ticking = true;
        }
    });

    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        setTimeout(() => {
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
                updateActiveLink(targetId);
            }
        }, 100);
    } else {
        updateActiveLink();
    }
});

// Focus Mode Toggle
document.addEventListener('DOMContentLoaded', function() {
    const focusToggle = document.getElementById('focus-mode-toggle');
    if (focusToggle) {
        const isFocusMode = localStorage.getItem('focusMode') === 'true';
        if (isFocusMode) {
            document.body.classList.add('focus-mode');
            const tocSidebar = document.querySelector('.table-of-contents');
            if (tocSidebar) tocSidebar.style.setProperty('display', 'none', 'important');
        }

        focusToggle.addEventListener('click', function() {
            document.body.classList.toggle('focus-mode');
            const isActive = document.body.classList.contains('focus-mode');
            localStorage.setItem('focusMode', isActive);

            const tocSidebar = document.querySelector('.table-of-contents');
            if (tocSidebar) {
                if (isActive) {
                    tocSidebar.style.setProperty('display', 'none', 'important');
                } else {
                    const scrollY = window.scrollY;
                    const fadeInStart = window.innerHeight * 0.3;
                    if (scrollY > fadeInStart) {
                        tocSidebar.style.setProperty('display', 'block', 'important');
                    }
                }
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey &&
                !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
                focusToggle.click();
            }
        });
    }
});

// Export toolbar toggle - Show on hover
document.addEventListener('DOMContentLoaded', function() {
    const exportToggle = document.getElementById('export-toggle');
    const exportDropdown = document.getElementById('export-dropdown');
    let hideTimeout;

    if (exportToggle && exportDropdown) {
        exportToggle.addEventListener('mouseenter', function() {
            clearTimeout(hideTimeout);
            exportDropdown.classList.add('active');
        });
        exportDropdown.addEventListener('mouseenter', function() {
            clearTimeout(hideTimeout);
            exportDropdown.classList.add('active');
        });
        exportToggle.addEventListener('mouseleave', function() {
            hideTimeout = setTimeout(function() {
                exportDropdown.classList.remove('active');
            }, 200);
        });
        exportDropdown.addEventListener('mouseleave', function() {
            hideTimeout = setTimeout(function() {
                exportDropdown.classList.remove('active');
            }, 200);
        });
    }
});

function getArticleContent() {
    const article = document.querySelector('.blog-content');
    if (!article) return null;
    const clone = article.cloneNode(true);
    clone.querySelectorAll('.blog-cta').forEach(el => el.remove());
    clone.querySelectorAll('script').forEach(el => el.remove());
    clone.querySelectorAll('style').forEach(el => el.remove());
    return clone;
}

function buildMarkdownFromContent(content, title) {
    let markdown = `# ${title}\n\n`;
    content.querySelectorAll('h2, h3, h4, p, ul, ol, blockquote, img').forEach(el => {
        if (el.tagName === 'H2') markdown += `## ${el.textContent.trim()}\n\n`;
        else if (el.tagName === 'H3') markdown += `### ${el.textContent.trim()}\n\n`;
        else if (el.tagName === 'H4') markdown += `#### ${el.textContent.trim()}\n\n`;
        else if (el.tagName === 'P') markdown += `${el.textContent.trim()}\n\n`;
        else if (el.tagName === 'BLOCKQUOTE') markdown += `> ${el.textContent.trim()}\n\n`;
        else if (el.tagName === 'IMG') markdown += `![${el.alt}](${el.src})\n\n`;
        else if (el.tagName === 'UL') {
            el.querySelectorAll('li').forEach(li => markdown += `- ${li.textContent.trim()}\n`);
            markdown += '\n';
        }
        else if (el.tagName === 'OL') {
            el.querySelectorAll('li').forEach((li, i) => markdown += `${i+1}. ${li.textContent.trim()}\n`);
            markdown += '\n';
        }
    });
    return markdown;
}

function copyAsMarkdown() {
    const content = getArticleContent();
    if (!content) return;
    const title = document.querySelector('.post-title')?.textContent || 'Article';
    navigator.clipboard.writeText(buildMarkdownFromContent(content, title)).then(() => {
        showFeedback('Copied as Markdown!');
        document.getElementById('export-dropdown').classList.remove('active');
    });
}

function downloadAsMarkdown() {
    const content = getArticleContent();
    if (!content) return;
    const title = document.querySelector('.post-title')?.textContent || 'Article';
    const blob = new Blob([buildMarkdownFromContent(content, title)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('Downloaded as Markdown!');
    document.getElementById('export-dropdown').classList.remove('active');
}

function copyAsPlainText() {
    const content = getArticleContent();
    if (!content) return;
    const title = document.querySelector('.post-title')?.textContent || '';
    const text = title + '\n\n' + content.textContent.trim();
    navigator.clipboard.writeText(text).then(() => {
        showFeedback('Copied as Text!');
        document.getElementById('export-dropdown').classList.remove('active');
    });
}

function downloadAsPlainText() {
    const content = getArticleContent();
    if (!content) return;
    const title = document.querySelector('.post-title')?.textContent || 'Article';
    const text = title + '\n\n' + content.textContent.trim();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('Downloaded as Text!');
    document.getElementById('export-dropdown').classList.remove('active');
}

function showFeedback(message) {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = 'position: fixed; top: 2rem; right: 2rem; background: #e8ddc7; color: #2d3c34; padding: 1rem 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; font-weight: 600; opacity: 0; transition: opacity 0.3s ease;';
    document.body.appendChild(feedback);
    setTimeout(() => feedback.style.opacity = '1', 10);
    setTimeout(() => {
        feedback.style.opacity = '0';
        setTimeout(() => feedback.remove(), 300);
    }, 2500);
}

// Fade in/out fixed social sharing icons and TOC based on scroll position
window.addEventListener('scroll', function() {
    const fixedSidebar = document.querySelector('.social-sharing-fixed');
    const tocSidebar = document.querySelector('.table-of-contents');
    const heroSection = document.querySelector('.blog-post-hero');
    const shareSection = document.querySelector('.share-with-friends');
    const relatedPosts = document.querySelector('.related-posts');
    const scrollY = window.scrollY;

    if (heroSection) {
        const heroHeight = heroSection.offsetHeight;
        const fadeInStart = heroHeight - 200;
        const fadeInEnd = heroHeight + 100;

        let heroOpacity = 0;
        if (scrollY > fadeInStart && scrollY < fadeInEnd) {
            heroOpacity = (scrollY - fadeInStart) / (fadeInEnd - fadeInStart);
            heroOpacity = Math.max(0, Math.min(1, heroOpacity));
        } else if (scrollY >= fadeInEnd) {
            heroOpacity = 1;
        }

        if (fixedSidebar) fixedSidebar.style.opacity = heroOpacity;
        if (tocSidebar && !document.body.classList.contains('focus-mode')) {
            if (scrollY > fadeInStart) {
                tocSidebar.style.setProperty('display', 'block', 'important');
            } else {
                tocSidebar.style.setProperty('display', 'none', 'important');
            }
            tocSidebar.style.opacity = heroOpacity;
        }
    }

    if (fixedSidebar && shareSection) {
        const shareSectionTop = shareSection.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        const fadeStart = windowHeight + 200;
        const fadeEnd = windowHeight - 100;

        if (shareSectionTop < fadeStart && shareSectionTop > fadeEnd) {
            const opacity = (shareSectionTop - fadeEnd) / (fadeStart - fadeEnd);
            if (fixedSidebar) fixedSidebar.style.opacity = Math.max(0, Math.min(1, opacity));
        } else if (shareSectionTop <= fadeEnd) {
            if (fixedSidebar) fixedSidebar.style.opacity = '0';
        }
    }

    if (tocSidebar && relatedPosts && !document.body.classList.contains('focus-mode')) {
        const relatedPostsTop = relatedPosts.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        const tocFadeStart = windowHeight + 300;
        const tocFadeEnd = windowHeight - 100;

        if (relatedPostsTop < tocFadeStart && relatedPostsTop > tocFadeEnd) {
            const tocOpacity = (relatedPostsTop - tocFadeEnd) / (tocFadeStart - tocFadeEnd);
            tocSidebar.style.opacity = Math.max(0, Math.min(1, tocOpacity));
        } else if (relatedPostsTop <= tocFadeEnd) {
            tocSidebar.style.opacity = '0';
        }
    }
});

// Convert footnote references to inline tooltips.
// Tooltip content comes from Zola-rendered footnote markdown (author-trusted,
// not user input). We move the existing DOM node into the tooltip wrapper
// rather than reassigning innerHTML, which keeps Zola's escaping intact.
document.addEventListener('DOMContentLoaded', function() {
    const footnoteRefs = document.querySelectorAll('.blog-content sup a');

    // Map footnote id -> the original <div.footnote-definition> node so we can
    // clone its sanitized content into each tooltip.
    const footnoteNodes = {};
    document.querySelectorAll('.footnote-definition').forEach(item => {
        footnoteNodes[item.id] = item;
    });

    footnoteRefs.forEach((ref) => {
        const href = ref.getAttribute('href');
        if (!href || !href.startsWith('#')) return;

        const footnoteId = href.replace(/^#/, '');
        const sourceNode = footnoteNodes[footnoteId];
        if (!sourceNode) return;

        // Clone the source <div> so we can mutate without touching the original.
        const clone = sourceNode.cloneNode(true);
        const backRef = clone.querySelector('a[href*="zola-continue-reading"]');
        if (backRef) backRef.remove();
        const sourcePara = clone.querySelector('p');
        if (!sourcePara) return;

        const supElement = ref.closest('sup');
        const targetElement = supElement || ref;

        const wrapper = document.createElement('span');
        wrapper.className = 'footnote-tooltip';

        const tooltipContent = document.createElement('span');
        tooltipContent.className = 'footnote-tooltip-content';
        // Move the paragraph's children into the tooltip (preserves the
        // sanitized DOM structure Zola produced, no innerHTML reassignment).
        while (sourcePara.firstChild) {
            tooltipContent.appendChild(sourcePara.firstChild);
        }

        targetElement.parentNode.insertBefore(wrapper, targetElement);
        wrapper.appendChild(targetElement);
        wrapper.appendChild(tooltipContent);

        ref.addEventListener('click', function(e) {
            e.preventDefault();
        });
    });
});

// Related-post video thumbnails: play on hover, pause on leave
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.related-video').forEach(function(video) {
        const link = video.closest('.related-post');
        if (!link) return;
        link.addEventListener('mouseenter', function() {
            video.play().catch(function() {});
        });
        link.addEventListener('mouseleave', function() {
            video.pause();
            video.currentTime = 0;
        });
    });
});

